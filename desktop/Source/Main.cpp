/*
  Klangwerk Desktop
  - zeigt die Klangwerk-Weboberfläche in einem App-Fenster (WebView2 unter Windows)
  - lädt VST3-Plugins in 8 Slots und spielt sie über das Audio-Interface
  - reicht MIDI-Geräte nativ an die Oberfläche durch (kein Web-MIDI nötig)
  - merkt sich geladene Plugins samt Einstellungen
*/
#include <juce_gui_extra/juce_gui_extra.h>
#include <juce_audio_utils/juce_audio_utils.h>
#include <juce_audio_processors/juce_audio_processors.h>
#include "KlangwerkWeb.h"

using namespace juce;

static File appDataDir()
{
    auto d = File::getSpecialLocation (File::userApplicationDataDirectory).getChildFile ("Klangwerk");
    d.createDirectory();
    return d;
}

//==============================================================================
/** Audio: 8 Plugin-Slots, jeder mit eigener MIDI-Warteschlange, Summe auf Stereo. */
class Engine final : public AudioIODeviceCallback
{
public:
    static constexpr int numSlots = 8;

    struct Slot
    {
        std::unique_ptr<AudioPluginInstance> inst;
        MidiMessageCollector midi;
        std::atomic<float> gain { 1.0f };
        String id, name;
    };

    Slot slots[numSlots];
    std::atomic<float> master { 1.0f };
    CriticalSection lock;
    double sampleRate = 48000.0;
    int blockSize = 512;

    Engine()
    {
        for (auto& s : slots) s.midi.reset (sampleRate);
        scratch.setSize (32, 8192);
        midiBuf.ensureSize (8192);
    }

    void audioDeviceIOCallbackWithContext (const float* const*, int, float* const* out, int numOut,
                                           int n, const AudioIODeviceCallbackContext&) override
    {
        for (int c = 0; c < numOut; ++c)
            if (out[c] != nullptr) FloatVectorOperations::clear (out[c], n);

        const ScopedTryLock sl (lock);
        if (! sl.isLocked() || n > scratch.getNumSamples()) return;

        const float m = master.load();

        for (auto& s : slots)
        {
            auto* p = s.inst.get();
            if (p == nullptr) continue;

            const int ch = jmin (scratch.getNumChannels(), jmax (2, p->getTotalNumInputChannels(), p->getTotalNumOutputChannels()));
            AudioBuffer<float> buf (scratch.getArrayOfWritePointers(), ch, n);
            buf.clear();
            midiBuf.clear();
            s.midi.removeNextBlockOfMessages (midiBuf, n);
            p->processBlock (buf, midiBuf);

            const int oc = jmin (2, p->getTotalNumOutputChannels());
            const float g = s.gain.load() * m;
            for (int c = 0; c < jmin (2, numOut); ++c)
            {
                if (out[c] == nullptr || oc == 0) continue;
                const int src = oc == 1 ? 0 : c;
                FloatVectorOperations::addWithMultiply (out[c], buf.getReadPointer (src), g, n);
            }
        }
    }

    void audioDeviceAboutToStart (AudioIODevice* d) override
    {
        const ScopedLock sl (lock);
        sampleRate = d->getCurrentSampleRate();
        blockSize  = d->getCurrentBufferSizeSamples();
        scratch.setSize (32, jmax (8192, blockSize * 2));
        for (auto& s : slots)
        {
            s.midi.reset (sampleRate);
            if (s.inst != nullptr) { s.inst->setRateAndBufferSizeDetails (sampleRate, blockSize); s.inst->prepareToPlay (sampleRate, blockSize); }
        }
    }

    void audioDeviceStopped() override
    {
        const ScopedLock sl (lock);
        for (auto& s : slots) if (s.inst != nullptr) s.inst->releaseResources();
    }

    /** Tauscht das Plugin eines Slots aus; das alte wird außerhalb der Sperre zerstört. */
    std::unique_ptr<AudioPluginInstance> swap (int i, std::unique_ptr<AudioPluginInstance> p, const String& id, const String& name)
    {
        if (p != nullptr)
        {
            p->enableAllBuses();
            p->setRateAndBufferSizeDetails (sampleRate, blockSize);
            p->prepareToPlay (sampleRate, blockSize);
        }
        const ScopedLock sl (lock);
        std::swap (slots[i].inst, p);
        slots[i].id = id;
        slots[i].name = name;
        slots[i].midi.reset (sampleRate);
        return p;
    }

    void sendMidi (int i, const MidiMessage& msg)
    {
        if (isPositiveAndBelow (i, numSlots))
            slots[i].midi.addMessageToQueue (MidiMessage (msg).withTimeStamp (Time::getMillisecondCounterHiRes() * 0.001));
    }

private:
    AudioBuffer<float> scratch;
    MidiBuffer midiBuf;
};

//==============================================================================
class PluginWindow final : public DocumentWindow
{
public:
    PluginWindow (const String& title, AudioProcessorEditor* ed, std::function<void()> onClose)
        : DocumentWindow (title, Colours::black, DocumentWindow::closeButton | DocumentWindow::minimiseButton), closed (std::move (onClose))
    {
        setUsingNativeTitleBar (true);
        setContentOwned (ed, true);
        setResizable (ed->isResizable(), false);
        centreWithSize (getWidth(), getHeight());
        setVisible (true);
    }
    void closeButtonPressed() override { if (closed) closed(); }

private:
    std::function<void()> closed;
};

//==============================================================================
class MainComponent final : public Component,
                            private MidiInputCallback,
                            private Timer
{
public:
    MainComponent()
    {
        addDefaultFormatsToManager (formats);
        if (auto xml = parseXML (appDataDir().getChildFile ("plugins.xml")))
            known.recreateFromXml (*xml);

        if (auto xml = parseXML (appDataDir().getChildFile ("audio.xml")))
            deviceManager.initialise (0, 2, xml.get(), true);
        else
            deviceManager.initialiseWithDefaultDevices (0, 2);
        deviceManager.addAudioCallback (&engine);

        restoreSlots();
        openMidiDevices();
        midiConn = std::make_unique<MidiDeviceListConnection> (MidiDeviceListConnection::make ([this]
        {
            openMidiDevices();
            web.emitEventIfBrowserIsVisible ("kwMidiDevices", midiDeviceInfo());
        }));

        addAndMakeVisible (web);
        web.goToURL (WebBrowserComponent::getResourceProviderRoot());
        setSize (1480, 940);
    }

    ~MainComponent() override
    {
        stopTimer();
        saveSlots();
        if (auto xml = deviceManager.createStateXml()) xml->writeTo (appDataDir().getChildFile ("audio.xml"));
        windows.clear();
        deviceManager.removeAudioCallback (&engine);
        inputs.clear();
        for (int i = 0; i < Engine::numSlots; ++i) engine.swap (i, nullptr, {}, {});
    }

    void resized() override { web.setBounds (getLocalBounds()); }

private:
    //==========================================================================
    // Weboberfläche + Brücke
    static std::optional<WebBrowserComponent::Resource> resource (const String& url)
    {
        const auto path = url == "/" ? String ("index.html") : url.fromFirstOccurrenceOf ("/", false, false).upToFirstOccurrenceOf ("?", false, false);
        const auto file = path.fromLastOccurrenceOf ("/", false, false);
        for (int i = 0; i < KlangwerkWeb::namedResourceListSize; ++i)
        {
            if (file != KlangwerkWeb::originalFilenames[i]) continue;
            int size = 0;
            auto* data = KlangwerkWeb::getNamedResource (KlangwerkWeb::namedResourceList[i], size);
            std::vector<std::byte> bytes ((size_t) size);
            std::memcpy (bytes.data(), data, (size_t) size);
            const auto ext = file.fromLastOccurrenceOf (".", false, false);
            const String mime = ext == "html" ? "text/html; charset=utf-8" : ext == "css" ? "text/css; charset=utf-8" : ext == "js" ? "text/javascript; charset=utf-8" : "application/octet-stream";
            return WebBrowserComponent::Resource { std::move (bytes), mime };
        }
        return std::nullopt;
    }

    WebBrowserComponent::Options webOptions()
    {
        using O = WebBrowserComponent::Options;
        return O{}
            .withBackend (O::Backend::webview2)
            .withWinWebView2Options (O::WinWebView2{}
                                        .withUserDataFolder (appDataDir().getChildFile ("WebView2"))
                                        .withStatusBarDisabled()
                                        .withBackgroundColour (Colour (0xff0b0c0e)))
            .withNativeIntegrationEnabled()
            .withKeepPageLoadedWhenBrowserIsHidden()
            .withResourceProvider ([] (const String& url) { return resource (url); })
            .withNativeFunction ("kwInfo", [] (const Array<var>&, auto done)
            {
                DynamicObject::Ptr o = new DynamicObject();
                o->setProperty ("desktop", true);
                o->setProperty ("version", JUCE_APPLICATION_VERSION_STRING);
                done (var (o.get()));
            })
            .withNativeFunction ("kwMidiDevices", [this] (const Array<var>&, auto done) { done (midiDeviceInfo()); })
            .withNativeFunction ("kwPlugins",     [this] (const Array<var>&, auto done) { done (pluginList()); })
            .withNativeFunction ("kwSlots",       [this] (const Array<var>&, auto done) { done (slotInfo()); })
            .withNativeFunction ("kwScan",        [this] (const Array<var>&, auto done) { startScan(); done (true); })
            .withNativeFunction ("kwLoad",        [this] (const Array<var>& a, auto done) { done (loadPlugin ((int) a[0], a[1].toString(), {})); })
            .withNativeFunction ("kwUnload",      [this] (const Array<var>& a, auto done) { unload ((int) a[0]); done (true); })
            .withNativeFunction ("kwEditor",      [this] (const Array<var>& a, auto done) { done (showEditor ((int) a[0])); })
            .withNativeFunction ("kwGain",        [this] (const Array<var>& a, auto done)
            {
                const int i = (int) a[0];
                const float g = jlimit (0.0f, 2.0f, (float) (double) a[1]);
                if (i < 0) engine.master = g; else if (i < Engine::numSlots) engine.slots[i].gain = g;
                done (true);
            })
            .withNativeFunction ("kwAudioSettings", [this] (const Array<var>&, auto done) { showAudioSettings(); done (true); })
            .withEventListener ("kwSlotMidi", [this] (var v)
            {
                if (auto* arr = v["m"].getArray(); arr != nullptr && ! arr->isEmpty())
                {
                    const int b0 = (int) (*arr)[0], b1 = arr->size() > 1 ? (int) (*arr)[1] : 0, b2 = arr->size() > 2 ? (int) (*arr)[2] : 0;
                    engine.sendMidi ((int) v["s"], arr->size() >= 3 ? MidiMessage (b0, b1, b2) : arr->size() == 2 ? MidiMessage (b0, b1) : MidiMessage (b0));
                }
            })
            .withEventListener ("kwMidiOut", [this] (var v)
            {
                auto* arr = v["m"].getArray();
                if (arr == nullptr || arr->isEmpty()) return;
                const auto name = v["d"].toString();
                auto it = outputs.find (name);
                if (it == outputs.end())
                    for (auto& info : MidiOutput::getAvailableDevices())
                        if (info.name == name)
                            if (auto o = MidiOutput::openDevice (info.identifier))
                                it = outputs.emplace (name, std::move (o)).first;
                if (it == outputs.end()) return;
                MemoryBlock mb;
                for (auto& b : *arr) { const auto byte = (uint8) (int) b; mb.append (&byte, 1); }
                it->second->sendMessageNow (MidiMessage (mb.getData(), (int) mb.getSize()));
            });
    }

    //==========================================================================
    // MIDI-Eingänge -> Oberfläche
    void openMidiDevices()
    {
        auto avail = MidiInput::getAvailableDevices();
        for (auto it = inputs.begin(); it != inputs.end();)
        {
            const bool still = std::any_of (avail.begin(), avail.end(), [&] (auto& d) { return d.identifier == it->first; });
            if (still) ++it; else it = inputs.erase (it);
        }
        for (auto& d : avail)
        {
            if (inputs.count (d.identifier) != 0) continue;
            if (auto in = MidiInput::openDevice (d.identifier, this))
            {
                in->start();
                inputs.emplace (d.identifier, std::move (in));
            }
        }
    }

    var midiDeviceInfo() const
    {
        Array<var> ins, outs;
        for (auto& [id, in] : inputs) ins.add (in->getName());
        for (auto& d : MidiOutput::getAvailableDevices()) outs.add (d.name);
        DynamicObject::Ptr o = new DynamicObject();
        o->setProperty ("ins", ins);
        o->setProperty ("outs", outs);
        return var (o.get());
    }

    void handleIncomingMidiMessage (MidiInput* src, const MidiMessage& msg) override
    {
        if (msg.isActiveSense() || msg.isMidiClock()) return;
        const String name = src->getName();
        Array<var> bytes;
        for (int i = 0; i < msg.getRawDataSize(); ++i) bytes.add ((int) msg.getRawData()[i]);
        SafePointer<MainComponent> self (this);
        MessageManager::callAsync ([self, name, bytes]
        {
            if (self == nullptr) return;
            DynamicObject::Ptr o = new DynamicObject();
            o->setProperty ("d", name);
            o->setProperty ("m", bytes);
            self->web.emitEventIfBrowserIsVisible ("kwMidiIn", var (o.get()));
        });
    }

    //==========================================================================
    // Plugins
    var pluginList() const
    {
        Array<var> list;
        for (auto& d : known.getTypes())
        {
            DynamicObject::Ptr o = new DynamicObject();
            o->setProperty ("id", d.createIdentifierString());
            o->setProperty ("name", d.name);
            o->setProperty ("vendor", d.manufacturerName);
            o->setProperty ("category", d.category);
            o->setProperty ("instrument", d.isInstrument);
            o->setProperty ("format", d.pluginFormatName);
            list.add (var (o.get()));
        }
        return list;
    }

    var slotInfo() const
    {
        Array<var> list;
        for (auto& s : engine.slots)
        {
            DynamicObject::Ptr o = new DynamicObject();
            o->setProperty ("id", s.id);
            o->setProperty ("name", s.name);
            o->setProperty ("gain", (double) s.gain.load());
            list.add (var (o.get()));
        }
        return list;
    }

    var loadPlugin (int i, const String& id, const String& stateBase64)
    {
        DynamicObject::Ptr r = new DynamicObject();
        if (! isPositiveAndBelow (i, Engine::numSlots)) { r->setProperty ("ok", false); r->setProperty ("err", "Ungültiger Slot"); return var (r.get()); }
        if (id.isEmpty()) { unload (i); r->setProperty ("ok", true); return var (r.get()); }

        auto desc = known.getTypeForIdentifierString (id);
        if (desc == nullptr) { r->setProperty ("ok", false); r->setProperty ("err", "Plugin nicht gefunden – bitte neu scannen"); return var (r.get()); }

        String err;
        auto inst = formats.createPluginInstance (*desc, engine.sampleRate, engine.blockSize, err);
        if (inst == nullptr) { r->setProperty ("ok", false); r->setProperty ("err", err.isEmpty() ? String ("Plugin ließ sich nicht laden") : err); return var (r.get()); }

        if (stateBase64.isNotEmpty())
        {
            MemoryBlock mb;
            if (mb.fromBase64Encoding (stateBase64)) inst->setStateInformation (mb.getData(), (int) mb.getSize());
        }

        windows.erase (i);
        auto old = engine.swap (i, std::move (inst), id, desc->name);
        old.reset();
        saveSlots();
        r->setProperty ("ok", true);
        r->setProperty ("name", desc->name);
        return var (r.get());
    }

    void unload (int i)
    {
        if (! isPositiveAndBelow (i, Engine::numSlots)) return;
        windows.erase (i);
        engine.swap (i, nullptr, {}, {}).reset();
        saveSlots();
    }

    bool showEditor (int i)
    {
        if (! isPositiveAndBelow (i, Engine::numSlots) || engine.slots[i].inst == nullptr) return false;
        if (auto it = windows.find (i); it != windows.end()) { it->second->toFront (true); return true; }
        auto* p = engine.slots[i].inst.get();
        AudioProcessorEditor* ed = p->hasEditor() ? p->createEditorAndMakeActive() : nullptr;
        if (ed == nullptr) ed = new GenericAudioProcessorEditor (*p);
        windows[i] = std::make_unique<PluginWindow> ("Slot " + String (i + 1) + ": " + engine.slots[i].name, ed,
                                                     [this, i] { MessageManager::callAsync ([this, i] { windows.erase (i); }); });
        return true;
    }

    void startScan()
    {
        if (scanner != nullptr) return;
        AudioPluginFormat* vst3 = nullptr;
        for (auto* f : formats.getFormats()) if (f->getName() == "VST3") vst3 = f;
        if (vst3 == nullptr) return;
        scanner = std::make_unique<PluginDirectoryScanner> (known, *vst3, vst3->getDefaultLocationsToSearch(), true,
                                                            appDataDir().getChildFile ("scan-absturz.txt"), true);
        startTimer (5);
    }

    void timerCallback() override
    {
        if (scanner == nullptr) { stopTimer(); return; }
        String name;
        const bool more = scanner->scanNextFile (true, name);
        DynamicObject::Ptr o = new DynamicObject();
        o->setProperty ("name", name);
        o->setProperty ("progress", (double) scanner->getProgress());
        o->setProperty ("done", ! more);
        if (! more)
        {
            scanner.reset();
            stopTimer();
            if (auto xml = known.createXml()) xml->writeTo (appDataDir().getChildFile ("plugins.xml"));
            o->setProperty ("count", known.getNumTypes());
        }
        web.emitEventIfBrowserIsVisible ("kwScan", var (o.get()));
    }

    //==========================================================================
    // Speichern / Wiederherstellen der Slots (Plugin + komplette Einstellungen)
    void saveSlots()
    {
        XmlElement root ("KlangwerkSlots");
        root.setAttribute ("master", (double) engine.master.load());
        for (int i = 0; i < Engine::numSlots; ++i)
        {
            auto& s = engine.slots[i];
            auto* e = root.createNewChildElement ("Slot");
            e->setAttribute ("index", i);
            e->setAttribute ("gain", (double) s.gain.load());
            if (s.inst == nullptr) continue;
            e->setAttribute ("id", s.id);
            MemoryBlock mb;
            s.inst->getStateInformation (mb);
            e->setAttribute ("state", mb.toBase64Encoding());
        }
        root.writeTo (appDataDir().getChildFile ("slots.xml"));
    }

    void restoreSlots()
    {
        auto xml = parseXML (appDataDir().getChildFile ("slots.xml"));
        if (xml == nullptr) return;
        engine.master = (float) xml->getDoubleAttribute ("master", 1.0);
        for (auto* e : xml->getChildIterator())
        {
            const int i = e->getIntAttribute ("index", -1);
            if (! isPositiveAndBelow (i, Engine::numSlots)) continue;
            engine.slots[i].gain = (float) e->getDoubleAttribute ("gain", 1.0);
            const auto id = e->getStringAttribute ("id");
            if (id.isNotEmpty()) loadPlugin (i, id, e->getStringAttribute ("state"));
        }
    }

    void showAudioSettings()
    {
        auto* sel = new AudioDeviceSelectorComponent (deviceManager, 0, 0, 2, 2, false, false, true, false);
        sel->setSize (520, 420);
        DialogWindow::LaunchOptions o;
        o.content.setOwned (sel);
        o.dialogTitle = "Audio-Einstellungen (für VST-Plugins)";
        o.dialogBackgroundColour = Colour (0xff17181b);
        o.useNativeTitleBar = true;
        o.resizable = false;
        o.launchAsync();
    }

    //==========================================================================
    AudioDeviceManager deviceManager;
    Engine engine;
    AudioPluginFormatManager formats;
    KnownPluginList known;
    std::unique_ptr<PluginDirectoryScanner> scanner;
    std::map<int, std::unique_ptr<PluginWindow>> windows;
    std::map<String, std::unique_ptr<MidiInput>> inputs;
    std::map<String, std::unique_ptr<MidiOutput>> outputs;
    std::unique_ptr<MidiDeviceListConnection> midiConn;
    WebBrowserComponent web { webOptions() };

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)
};

//==============================================================================
class KlangwerkApplication final : public JUCEApplication
{
public:
    const String getApplicationName() override       { return JUCE_APPLICATION_NAME_STRING; }
    const String getApplicationVersion() override    { return JUCE_APPLICATION_VERSION_STRING; }
    bool moreThanOneInstanceAllowed() override       { return false; }

    void initialise (const String&) override { window = std::make_unique<MainWindow> (getApplicationName()); }
    void shutdown() override                 { window = nullptr; }
    void systemRequestedQuit() override      { quit(); }

    class MainWindow final : public DocumentWindow
    {
    public:
        explicit MainWindow (const String& name)
            : DocumentWindow (name, Colour (0xff0b0c0e), DocumentWindow::allButtons)
        {
            setUsingNativeTitleBar (true);
            setContentOwned (new MainComponent(), true);
            setResizable (true, true);
            setResizeLimits (900, 600, 10000, 10000);
            centreWithSize (getWidth(), getHeight());
            setVisible (true);
        }
        void closeButtonPressed() override { JUCEApplication::getInstance()->systemRequestedQuit(); }
    };

private:
    std::unique_ptr<MainWindow> window;
};

START_JUCE_APPLICATION (KlangwerkApplication)
