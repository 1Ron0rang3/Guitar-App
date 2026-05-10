# Guitar Fretboard Scale Generator

Single-page React app for building custom guitar note maps. Choose pitch classes, change tuning, and highlight every occurrence of those notes across the fretboard.

## Features

- Dynamic fretboard rendering from the current tuning
- Standard, Drop D, D Standard, Open G, and Open D presets
- Clickable note selection with enharmonic labels
- Optional text-based note input
- Root note highlighting
- Toggle note labels on/off
- Hide or dim non-selected notes
- Adjustable fret count up to 24 frets
- Local storage persistence for the current setup

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Open the local Vite URL shown in the terminal.

## Build for production

```bash
npm run build
```

## Project structure

- `src/App.tsx` - top-level state and page composition
- `src/components/Fretboard.tsx` - rendered guitar neck and note markers
- `src/components/NoteSelector.tsx` - clickable pitch-class selector and root-note controls
- `src/components/ControlsPanel.tsx` - text note input and display toggles
- `src/components/TuningSettings.tsx` - editable string tuning and preset selector
- `src/music/notes.ts` - reusable pitch-class parsing, normalization, display, and fret math
- `src/hooks/useLocalStorage.ts` - persistence helper for saving the current setup

## Note mapping logic

The app stores notes internally as 12 pitch classes:

`C, C#, D, D#, E, F, F#, G, G#, A, A#, B`

When a string tuning is entered, each open string is normalized into that sharp-based internal format. Flats like `Bb` and `Db` are converted to their enharmonic sharp equivalents so matching stays consistent.

Each fret advances one semitone:

- open string note = fret `0`
- fret `1` = next note in the chromatic array
- fret `2` = two semitones up
- and so on, wrapping around every 12 semitones

That means each displayed fret note is calculated as:

`(open string index + fret number) % 12`

Selected notes are matched by pitch class only, so every `C` is highlighted everywhere on the fretboard regardless of octave.
