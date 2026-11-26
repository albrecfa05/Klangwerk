# Klangwerk Desktop (Windows)

Die Desktop-App zeigt dieselbe Klangwerk-Oberfläche wie die Webseite und kann zusätzlich **VST3-Plugins direkt laden**.

## Installieren

1. **[Klangwerk-Windows.zip herunterladen](https://github.com/albrecfa05/Klangwerk/releases/latest/download/Klangwerk-Windows.zip)**. Das ist immer die neueste veröffentlichte Version, eine Anmeldung ist nicht nötig. Alle Versionen stehen unter *Releases*.
2. Entpacken und `Klangwerk.exe` starten. Windows SmartScreen warnt beim ersten Start, weil die App nicht signiert ist: *Weitere Informationen → Trotzdem ausführen*.
3. Voraussetzung ist die Microsoft-Edge-WebView2-Laufzeit. Auf Windows 10/11 ist sie normalerweise schon installiert.

## Plugins laden

1. **Steuerung → VST-Plugins (direkt in Klangwerk) → Plugins suchen.** Durchsucht wird der Standardordner `C:\Program Files\Common Files\VST3`. Beim ersten Mal kann das einige Minuten dauern.
2. Pro Slot ein Plugin wählen. **Fenster** öffnet die Oberfläche des Plugins.
3. Bei **Part A / Part B** die Ausgabe auf *Nur VST-Slot* oder *Intern + VST-Slot* stellen und den Slot wählen. In Song-Sektionen lassen sich Slots wie Presets auf Knöpfe legen.
4. **Audio-Einstellungen:** Audio-Gerät und Puffergröße für die Plugins wählen. Kleiner Puffer = weniger Verzögerung.

Geladene Plugins und ihre Einstellungen merkt sich die App (`%APPDATA%\Klangwerk`).

## Gut zu wissen

- MIDI-Geräte öffnet die App selbst. Unter Windows kann meist nur ein Programm ein MIDI-Gerät gleichzeitig nutzen: rekordbox oder FL Studio vorher schließen.
- Der interne Synth läuft über das Browser-Audio, die Plugins über das gewählte Audio-Gerät. Beide klingen gleichzeitig.
- **Plugins im Looper:** Als Quelle einer Loop-Spur funktionieren *Alles inkl. VST*, *Part A* / *Part B* (inklusive des Plugins, auf das der Part gerade spielt) oder gezielt *VST-Slot 1–8*. Die App schneidet jeden Slot im Hintergrund mit. Sobald eine Aufnahme oder ein Overdub endet, wird genau der Abschnitt in die Spur gemischt, den du gehört hast. Das dauert einen kurzen Moment. Danach verhält sich die Spur wie jede andere (Undo, Szenen, WAV-Export).
- Klingt eine Plugin-Spur minimal versetzt, kannst du das unter *Steuerung → Looper-Ausgleich für Plugins (ms)* korrigieren.
- Stürzt ein Plugin beim Suchen ab, startet die App neu und überspringt es beim nächsten Suchen.

## Selbst bauen

Benötigt: Visual Studio 2022 (C++), CMake ≥ 3.22 und das NuGet-Paket `Microsoft.Web.WebView2` (siehe `.github/workflows/desktop-windows.yml`).

```
cmake -S desktop -B build -A x64
cmake --build build --config Release
```

JUCE 9.0.6 wird automatisch heruntergeladen.

## Lizenz-Hinweis

Die App nutzt das JUCE-Framework. JUCE steht entweder unter der **AGPLv3** oder einer **kommerziellen JUCE-Lizenz**. Wer die App weitergibt, muss eine der beiden Bedingungen erfüllen. Bei einem öffentlichen Open-Source-Repo passt die AGPLv3. Für eine kommerzielle oder geschlossene Nutzung ist eventuell eine JUCE-Lizenz nötig.
