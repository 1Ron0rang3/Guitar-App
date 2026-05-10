# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React | 18.3.x |
| Language | TypeScript | 5.6.x |
| Build / Dev server | Vite + @vitejs/plugin-react | 5.4.x / 4.3.x |
| Styling | Tailwind CSS | 3.4.x |
| CSS processing | PostCSS + Autoprefixer | 8.4.x / 10.4.x |
| Font | Plus Jakarta Sans (Google Fonts) | — |

No backend, no router, no state management library, no test framework.

## Commands

```bash
npm run dev      # start Vite dev server
npm run build    # type-check with tsc, then bundle with Vite
npm run preview  # preview the production build locally
```

There is no test runner or linter configured beyond TypeScript strict mode.

## Architecture

This is a single-page React + TypeScript app with no router, no external state library, and no backend. All application state lives in `App.tsx` and is persisted to `localStorage` via `useLocalStorage`.

### State & persistence

`App.tsx` holds every piece of state (`selectedNotes`, `tuning`, `fretCount`, `showLabels`, `hideUnselected`, `accidentalPreference`, `rootNote`) and writes them together under a single `localStorage` key (`guitar-fretboard-scale-generator`) via a `useEffect`. The stored object carries a `version` field; when the version mismatches the current default, specific fields (currently `fretCount`) are reset to their defaults on load to handle breaking schema changes.

### Music logic (`src/music/notes.ts`)

All notes are stored and compared internally as **sharp names** from `CHROMATIC_SHARPS` (e.g. `"C#"`, not `"Db"`). Flat inputs are normalised to their sharp equivalent via `normalizeNoteName` → `ENHARMONIC_EQUIVALENTS`. Flat display is purely cosmetic via `formatNote`. Any new music logic should follow this convention: store sharps, format on render.

### Styling

The project uses a hybrid approach:
- **Custom CSS classes** in `src/index.css` handle all structural and component-level styles (`.fretboard`, `.note-marker`, `.panel`, etc.). These classes are what the JSX components use.
- **Tailwind** is present but used only for utilities where custom classes aren't already defined. The Tailwind config extends the default theme with four named colours (`ink`, `sky`, `coral`, `brass`) and a `panel` box-shadow.
- CSS custom properties on `:root` define the design tokens (colours, gradients) used throughout `index.css`.

When adding new UI, prefer extending `index.css` with a new class rather than inlining many Tailwind utilities, to stay consistent with the existing pattern.
