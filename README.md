# Klangwerk

Klangwerk ist eine Musik-Oberfläche, die komplett im Browser läuft. Sie enthält:

- **P-8-Synth:** zwei 8-stimmige Synth-Parts (A und B) im Stil der frühen 80er (2 VCOs mit Sync und Cross-Mod, Hochpass, 12/24-dB-Ladder-Filter, 2 Hüllkurven, LFO, Arpeggiator, Chorus/Delay/Hall)
- **Loopstation:** 8 Audio-Spuren plus 4 MIDI-Loops (Noten aufnehmen, Quantisierung, bis zu 2 Ziele wie Synth-Parts oder VST-Plugins). Rec startet sofort, am nächsten Takt oder am Loop-Anfang. Audio-Spuren: Pro Spur wählbar: Quelle (alles, Part A, Part B, Drums, Audio-Eingang) und Länge (1–16 Takte). Dazu Overdub, Undo/Redo, Rückwärts, Szenen und WAV-Export
- **Mixer:** Kanalzüge für Part A/B, Drums, Eingang, alle Loop-Spuren, zwei Loop-Gruppen und Master, mit Pegelanzeigen und Crossfader. Jeder Kanal hat Effekte (DJ-Filter, 3-Band-EQ, Drive, Kompressor, Hall- und Delay-Send). Das DDJ-Mischpult steuert wahlweise Part A/B, die Loop-Gruppen oder die gewählte Spur
- **Audio-Eingang:** Interface-Eingänge einzeln oder in Stereo, mit Gain, Low-Cut und Vocal-Hall (nur zum Abhören oder mit aufnehmen). Eingang 1 und 2 lassen sich im Looper getrennt aufnehmen
- **Notenrolle:** MIDI-Dateien laden. Die Noten fallen auf die Klaviatur, es gibt einen Warte-Modus, Tempo-Regler und A–B-Schleifen. Eigenes Spiel lässt sich aufnehmen und als MIDI speichern
- **Songs & Setlist:** Songs vorab planen. Jede Sektion bekommt Presets (oder VST-Slots), Drum-Kit und Looper-Szene. Abruf per Knopf, Pad oder DDJ
- **Synth standardmäßig aus:** Die Keyboards spielen den internen Synth erst, wenn du ihn zuschaltest
- **Steuerung:** Belegungsplan aller Knöpfe, Fader und Regler (druckbar), LED-Rückmeldung an DDJ-400 und Oxygen-Pads (leuchtet bei laufenden Spuren, blinkt bei Aufnahme). Geführte Einrichtung für M-Audio Oxygen 25, Pioneer DDJ-400 (beide Seiten, alle vier Pad-Modi) und Roland FP-30. Zusätzlich MIDI-Learn für jedes Bedienelement
- **VST-Plugins:** In der **Desktop-App für Windows** lädst du VST3-Plugins direkt in 8 Slots und kannst sie auch loopen ([desktop/README.md](desktop/README.md)). In der Browser-Version gehen die Parts per virtuellem MIDI-Port an FL Studio ([docs/FL-Studio-und-VST.md](docs/FL-Studio-und-VST.md)).

## Starten

**Am einfachsten:** **https://albrecfa05.github.io/Klangwerk/** in **Chrome oder Edge** öffnen (Firefox und Safari unterstützen Web MIDI nicht zuverlässig).

**Desktop-App (Windows, mit VST3-Plugins):** [Klangwerk-Windows.zip herunterladen](https://github.com/albrecfa05/Klangwerk/releases/latest/download/Klangwerk-Windows.zip) (immer die neueste Version, keine Anmeldung nötig). Details in [desktop/README.md](desktop/README.md).

**Lokal:** Repo herunterladen und `index.html` per Doppelklick in Chrome/Edge öffnen. Eine Installation oder ein Server ist nicht nötig. Wer lieber eine einzige Datei weitergibt: `python3 tools/build_single.py` erzeugt `dist/Klangwerk.html`.

Dann auf **„Audio starten“** klicken und den MIDI-Zugriff erlauben. Neu erkannte Geräte bieten automatisch die geführte Einrichtung an.

## Ansichten

Oben in der Leiste kannst du zwischen den Ansichten wechseln: **Alles · Synth · Looper · Mixer · Keyboard · Songs · Steuerung**. Jede Ansicht hat eine eigene Adresse (z. B. `index.html#mixer`), die du als Lesezeichen speichern kannst. Gezeichnet wird nur, was gerade sichtbar ist. In Hintergrund-Tabs pausiert die Grafik ganz.

## Geräte (Voreinstellung)

| Gerät | Rolle | Was es steuert |
|---|---|---|
| Roland FP-30 | Part A | Tastatur + Sustain-Pedal |
| M-Audio Oxygen 25 | Part B | Tasten, 8 Pads (Pad-Modus), 8 Regler (Mixer/Synth), Transport |
| Pioneer DDJ-400 | Steuerung | Pads je Seite und Modus (HOT CUE / BEAT LOOP / BEAT JUMP / SAMPLER), Kanal-Fader, Filter, EQ, Crossfader, Play/Cue |

Alles ist änderbar unter **Steuerung** bzw. **MIDI**. Details: [docs/Steuerung.md](docs/Steuerung.md)

## Aufbau

```
index.html            Oberfläche
css/klangwerk.css     Gestaltung
js/worklets.js        Audio-Engine (Synth + Looper als AudioWorklet)
js/desktop.js         Brücke zur Desktop-App (im Browser inaktiv)
js/app.js             Bedienung, MIDI, Mixer, Songs, Notenrolle
songs/                Beispiel-Setlist zum Importieren
docs/                 Anleitungen (FL Studio/VST, Steuerung)
tools/build_single.py Ein-Datei-Version bauen
desktop/              Windows-App (JUCE, C++): Weboberfläche + VST3-Host
.github/workflows/    Automatischer Windows-Build
```

Es gibt keine Abhängigkeiten und keinen Build-Schritt. Einstellungen (eigene Presets, Zuweisungen, Songs, Mixer) speichert der Browser lokal. Über **Export/Import** lassen sie sich als JSON-Datei weitergeben.

## Hinweise

- Die Presets „DM-Stil“ und „Orchester“ sind eigene Annäherungen mit dem Synth, keine Samples oder Originalklänge.
- Noten urheberrechtlich geschützter Songs liegen hier nicht bei. Eigene MIDI-Dateien lädt man in die Notenrolle. Als gemeinfreie Beispiele sind Bach (Präludium C-Dur) und Beethoven (Ode an die Freude) eingebaut.
- Die DDJ-400-Vorbelegung beruht auf den üblichen Werkseinstellungen. Die geführte Einrichtung liest die tatsächlichen Signale deines Geräts aus.
