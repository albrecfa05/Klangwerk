# VST-Plugins über FL Studio

Ein Browser kann selbst keine VST-Plugins laden. Klangwerk schickt deshalb die Noten von Part A und/oder Part B per MIDI an FL Studio, und dort spielen die Plugins. Pedal, Pitch-Bend und Mod-Rad gehen mit, ebenso die Noten aus dem Autoplay der Notenrolle.

## 1. Virtuelle MIDI-Ports anlegen (Windows)

1. **loopMIDI** von Tobias Erichsen installieren (kostenlos).
2. Einen Port pro Instrument anlegen, z. B. `Klangwerk Streicher`, `Klangwerk Blech`, `Klangwerk Klavier`.
   Getrennte Ports sind in FL Studio am zuverlässigsten (siehe Hinweis unten).
3. loopMIDI muss laufen, bevor du Klangwerk öffnest. Sonst die Klangwerk-Seite neu laden.

Auf dem Mac geht dasselbe mit dem **IAC-Treiber** (Audio-MIDI-Setup → MIDI-Studio → IAC-Treiber → „Gerät ist online“).

## 2. FL Studio einrichten

1. **Options → MIDI settings → Input:** Die loopMIDI-Ports aktivieren (Enable). Jedem Port eine eigene **Port-Nummer** geben.
2. Plugin in den **Channel Rack** laden (z. B. Spitfire Symphony Orchestra Discover, BBC Symphony Orchestra Discover oder LABS).
3. Im Channel-Menü des Instruments unter **„Receive notes from“** den passenden Port bzw. Controller und MIDI-Kanal wählen.
4. Gegebenenfalls in den Wrapper-Einstellungen des Plugins den **MIDI-Input-Port** auf dieselbe Port-Nummer stellen.

**Hinweis:** In FL Studio empfängt das gerade ausgewählte Instrument im Channel Rack oft alle Noten des Controllers. Mit einem eigenen loopMIDI-Port pro Instrument vermeidest du doppelte Noten.

## 3. Klangwerk verbinden

1. **Steuerung → VST-Plugins über FL Studio**
2. Pro Slot eintragen: Name (z. B. „Spitfire Strings“), MIDI-Port (der loopMIDI-Port), Kanal und optional eine Programmnummer (sendet beim Umschalten einen Program Change; 0 = aus).
3. Mit **Test-Ton** prüfen.
4. Oben bei **Part A / Part B** wählen:
   - *Intern*: der Klangwerk-Synth
   - *Intern + VST-Slot*: beides gleichzeitig (Layer)
   - *Nur VST-Slot*: nur das Plugin
5. **Songs:** In jeder Sektion kannst du statt eines Presets einen VST-Slot wählen. So schaltet ein Pad oder DDJ-Pad zwischen Plugins um.

## Grenzen

- Der Arpeggiator läuft nur im internen Synth.
- Der Looper nimmt den Klang aus FL Studio nicht direkt auf. Dafür FL-Ausgang → Audio-Interface-Eingang zurückführen und im Looper „Audio-Eingang“ + Quelle „Eingang“ nutzen. Oder die Loops gleich in FL Studio aufnehmen.
