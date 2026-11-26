# Steuerung

## Geführte Einrichtung

Unter **Steuerung → Geräte & geführte Einrichtung** (oder automatisch beim ersten Anschließen) zeigt Klangwerk jede Funktion einzeln: Das passende Bedienelement leuchtet gelb auf, du drückst oder drehst den genannten Knopf am Gerät, und Klangwerk merkt sich das. Jeder Schritt lässt sich überspringen. Die Einrichtung kannst du jederzeit wiederholen.

### M-Audio Oxygen 25 (23 Schritte)
- Tasten → Synth (Part B)
- Pads 1–8 → Pads in Klangwerk; was sie tun, hängt vom Pad-Modus ab (Drums / Presets / Looper / Song)
- Regler 1–8 → Modus *Mixer*: Lautstärke der Loop-Spuren 1–8 · Modus *Synth*: Cutoff, Reso, Filter-Env, Attack, Decay, Release, Delay, Hall
- Play / Stop → Takt starten / stoppen
- Record → Aufnahme auf der gewählten Loop-Spur
- Loop → Regler-Modus umschalten
- << / >> → Loop-Spur wählen

Sendet der Oxygen MMC statt CC, erkennt Klangwerk das ebenfalls.

### Pioneer DDJ-400 (31 Schritte)
Links (Deck 1) und rechts (Deck 2) sind gleich aufgebaut. Für jede Seite und jeden Pad-Modus drückst du die Modus-Taste oben (HOT CUE, BEAT LOOP, BEAT JUMP, SAMPLER) und dann Pad 1 und Pad 8. Liegen die Pads fortlaufend, ergänzt Klangwerk die übrigen automatisch, sonst fragt es nach jedem einzelnen Pad.

Voreinstellung der Pads (änderbar unter *DDJ-400: Pad-Modi belegen*):

| Modus | Links | Rechts |
|---|---|---|
| HOT CUE | Song-Sektionen 1–8 | Patches → Part B |
| BEAT LOOP | Looper Rec/Dub 1–8 | Looper Mute 1–8 |
| BEAT JUMP | Looper Stop/Start 1–8 | Patches → Part A |
| SAMPLER | Drums Elektro | Drums Orchester |

Weitere Elemente:
- PLAY links: Start/Stop · CUE links: Tap-Tempo
- PLAY rechts: nächste Sektion · CUE rechts: vorige Sektion
- Kanal-Fader, FILTER (DJ-Filter), EQ HI/MID/LOW: wirken auf den linken bzw. rechten Kanal. Was das ist, stellst du im Mixer unter „DDJ-Mischpult steuert“ ein: Part A / B, Loops 1–4 / 5–8 oder gewählte Loop-Spur / Master
- Crossfader: Part A ↔ Part B

## LED-Rückmeldung
Klangwerk schickt Leucht-Signale zurück an DDJ-400 und Oxygen (abschaltbar unter Steuerung → LEDs):
- Pad leuchtet: Spur läuft, Sektion oder Preset ist aktiv
- schnell blinkend: Aufnahme oder Overdub
- langsam blinkend: wartet auf den Takt oder schaltet gleich um
- PLAY links: blinkt im Takt, solange der Takt läuft

Ob und wie die LEDs reagieren, hängt von der Firmware des Geräts ab.

## Belegungsplan
Unter **Steuerung → Belegungsplan** siehst du alle Knöpfe, Fader und Regler mit ihrer aktuellen Funktion (passt sich an Pad-Modi und Mischpult-Modus an). Mit „Drucken“ gibt es ihn auf Papier oder als PDF.

### Roland FP-30
Tastentest und Sustain-Pedal. Tipp: die Lautstärke am Piano herunterdrehen, damit der interne Klang nicht mitklingt (oder bewusst aufdrehen, wenn du den FP-30-Flügel dazu spielen willst).

## MIDI-Learn
**MIDI-Learn** einschalten, ein beliebiges Element anklicken (Fader, Taster, Pad, Mixer-Fader, Sektions-Knopf …), am Gerät bewegen. Alle Zuweisungen stehen unter **MIDI** und lassen sich dort einzeln entfernen.
