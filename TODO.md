# Fretboard Scale Generator — Build Roadmap

Goal: ship a fully working, polished tool. Payment comes last.
Ranked easiest → hardest. Each item includes exact implementation steps.

---

## TIER 1 — Hours of work (data + wiring existing code)

---

### 1. Scale Library

The note selector already highlights arbitrary note sets on the fretboard. A scale library is just pre-populating it with named sets.

**Steps:**
1. Create `src/music/scales.ts` with a `SCALES` array:
   ```ts
   export interface ScaleType {
     id: string;
     label: string;
     intervals: number[]; // semitones from root
   }
   ```
   Include: Major, Natural Minor, Harmonic Minor, Melodic Minor, Major Pentatonic, Minor Pentatonic, Blues, Dorian, Phrygian, Lydian, Mixolydian, Locrian, Whole Tone, Diminished (half-whole), Diminished (whole-half).

2. Add a `getScaleNotes(root: PitchClass, intervals: number[]): PitchClass[]` helper (same pattern as `getChordNotes` in `chords.ts`).

3. Create `src/components/ScaleSelector.tsx`:
   - Root note dropdown (all 12 chromatic notes)
   - Scale type dropdown (from `SCALES`)
   - On change: call `onScaleSelect(notes: PitchClass[], root: PitchClass)` prop
   - A "Clear scale" button

4. Add a new tab `'scale'` to `PanelTab` type in `App.tsx`.

5. Wire the tab: when a scale is selected, call `setSelectedNotes(scaleNotes)` and `setRootNote(root)`.

6. Add the tab button in the `tabs-row` div and a conditional panel render for `activeTab === 'scale'`.

**Files to touch:** `src/music/scales.ts` (new), `src/components/ScaleSelector.tsx` (new), `src/App.tsx`, `src/index.css` (minimal styling for dropdowns).

---

### 2. Shareable URLs

Every state lives in `App.tsx`. Encode it into URL query params so any configuration can be linked and shared. This is the primary free growth mechanic.

**Steps:**
1. On mount in `App.tsx`, read URL params and use them to override localStorage defaults:
   ```ts
   const params = new URLSearchParams(window.location.search);
   // parse: notes, tuning, root, accidental, tab
   ```

2. Add a "Copy link" button in the header or controls panel. On click:
   ```ts
   const url = new URL(window.location.href);
   url.searchParams.set('notes', selectedNotes.join(','));
   url.searchParams.set('root', rootNote ?? '');
   url.searchParams.set('tuning', tuning.join(','));
   url.searchParams.set('acc', accidentalPreference);
   url.searchParams.set('tab', activeTab);
   navigator.clipboard.writeText(url.toString());
   ```
3. Show a brief "Copied!" toast on click (simple `useState` with a `setTimeout` reset).

4. On initial load, if URL params are present, prefer them over localStorage so shared links always open in the correct state.

**Files to touch:** `src/App.tsx`, `src/index.css` (toast styles).

---

### 3. Additional Tuning Presets

Low-effort expansion of the existing tunings list.

**Steps:**
1. In `src/music/notes.ts`, add to `COMMON_TUNINGS`:
   - Open E: `['E', 'B', 'E', 'G#', 'B', 'E']`
   - Open A: `['E', 'A', 'E', 'A', 'C#', 'E']`
   - DADGAD: `['D', 'A', 'D', 'G', 'A', 'D']`
   - Half-step Down (Eb standard): `['D#', 'G#', 'C#', 'F#', 'A#', 'D#']`
   - C Standard: `['C', 'F', 'A#', 'D#', 'G', 'C']`
   - Drop C: `['C', 'G', 'C', 'F', 'A', 'D']`
   - Double Drop D: `['D', 'A', 'D', 'G', 'B', 'D']`

2. No other changes needed — `TuningSettings` already renders whatever is in `COMMON_TUNINGS`.

**Files to touch:** `src/music/notes.ts` only.

---

### 4. Fret Count UI Control

`fretCount` is already in state (hardcoded to 24 on version mismatch). Expose it to the user.

**Steps:**
1. In `App.tsx`, change `const [fretCount]` back to `const [fretCount, setFretCount]`.
2. In `TuningSettings.tsx`, add a fret count control: a segmented button group for `[12, 15, 17, 20, 22, 24]` frets, or a simple number input clamped to `[12, 24]`.
3. Pass `fretCount` and `onFretCountChange` as props to `TuningSettings`.
4. Persist the selection — it already saves to localStorage via the `useEffect` in `App.tsx`.

**Files to touch:** `src/App.tsx`, `src/components/TuningSettings.tsx`.

---

### 5. Interval / Degree Labels on Fretboard

Instead of showing note names (C, D, E…), show scale degrees (1, 2, 3… or R, 2, 3…). Useful for understanding chord shapes and scale patterns without memorising note names.

**Steps:**
1. Add `labelMode: 'note' | 'interval'` to app state (default `'note'`).
2. Add a toggle button in the Controls panel next to "Show labels".
3. In `Fretboard.tsx`, if `labelMode === 'interval'` and `rootNote` is set:
   - Calculate `intervalIndex = (getNoteIndex(note) - getNoteIndex(rootNote) + 12) % 12`
   - Map to label: `['R','b2','2','b3','3','4','b5','5','b6','6','b7','7'][intervalIndex]`
4. Only show interval labels for selected notes (non-selected notes show nothing or a dot).

**Files to touch:** `src/App.tsx`, `src/components/Fretboard.tsx`, `src/components/TuningSettings.tsx` or `ControlsPanel.tsx`.

---

## TIER 2 — Days of work (new logic, new UI patterns)

---

### 6. Audio Playback (Web Audio API)

Let users hear what they are looking at. Highest engagement multiplier. No external dependencies — use the Web Audio API with sampled guitar sounds.

**Steps:**
1. Find a free guitar sample set (e.g. `guitar.js` or free SFZ samples). A minimal set is one sample per string at open + every few frets, with pitch-shifted playback filling the gaps. Alternatively use the Web Audio API with a plucked-string synthesis (Karplus-Strong algorithm) for zero-file-size audio.

2. Create `src/audio/player.ts`:
   - `playNote(note: PitchClass, duration?: number): void` — plays a single note
   - `playChord(frets: (number | null)[], tuning: PitchClass[], strum?: boolean): void` — plays strings in sequence with a small delay if strumming
   - `playScale(notes: PitchClass[], bpm?: number): void` — plays notes ascending then descending

3. Add play buttons:
   - On each `VoicingCard` in `ChordExplorer.tsx`: a play icon button that calls `playChord(voicing.frets, tuning)`
   - On the scale selector (item 1): a "Play ascending" button
   - On fretboard: optional "play open strings" for current tuning

4. Add a global volume control and mute button in the app header.

**Files to touch:** `src/audio/player.ts` (new), `src/components/ChordExplorer.tsx`, `src/components/ScaleSelector.tsx`, `src/App.tsx`, `src/index.css`.

---

### 7. Export Chord Diagrams as PNG

Music teachers and students want to save diagrams for worksheets and study notes.

**Steps:**
1. Install: `npm install html-to-image` (lightweight, no canvas dependency issues).
2. In `ChordExplorer.tsx`, add an "Export" button to the voicing grid area that:
   - Targets the `.chord-voicing-grid` DOM element using a `ref`
   - Calls `toPng(element, { backgroundColor: ... })` from `html-to-image`
   - Triggers a download via an `<a>` tag with `download="chord-diagram.png"`
3. Also add a single-diagram export button on each `VoicingCard` for individual diagrams.
4. For the preset shapes library, add export on each `PresetShapeCard`.

**Files to touch:** `src/components/ChordExplorer.tsx`, `src/index.css`.

---

### 8. Scale Box Patterns (CAGED / Position Overlay)

Show the named position shapes (box patterns) guitarists use to visualise scales on the neck, not just highlighted notes.

**Steps:**
1. For each scale, define 5 box pattern positions (fret ranges) that group the notes into playable shapes. These are pre-computed data, not generated algorithmically.
2. Add `patterns: BoxPattern[]` to `ScaleType` in `scales.ts`:
   ```ts
   interface BoxPattern {
     label: string; // "Position 1", "Box 1", or CAGED letter
     startFret: number; // relative to root fret
   }
   ```
3. In the `ScaleSelector` component, add a "Show positions" toggle and a position selector (1–5).
4. In `Fretboard.tsx`, pass an optional `highlightFretRange: [number, number] | null`. When set, dim notes outside the range to show a single position box.

**Files to touch:** `src/music/scales.ts`, `src/components/ScaleSelector.tsx`, `src/components/Fretboard.tsx`, `src/App.tsx`.

---

### 9. PWA — Make It Installable and Work Offline

Turn the app into a Progressive Web App. Users can install it on their phone and use it during practice without internet.

**Steps:**
1. Install: `npm install vite-plugin-pwa`.
2. In `vite.config.ts`, add the PWA plugin with a `manifest` block:
   - `name`: "Fretboard Scale Generator"
   - `short_name`: "Fretboard"
   - `theme_color`, `background_color`
   - `icons`: create 192×192 and 512×512 PNG icons
3. Set `registerType: 'autoUpdate'` and a `workbox` cache strategy for all assets.
4. Add a `<meta name="apple-mobile-web-app-capable" content="yes">` tag in `index.html` for iOS.
5. Test install on Android Chrome and iOS Safari.

**Files to touch:** `vite.config.ts`, `index.html`, `public/` (icons).

---

### 10. Mobile Layout Improvements

The fretboard scrolls horizontally on mobile, which is functional but not ideal. The chord diagrams are small on small screens.

**Steps:**
1. In `index.css`, add responsive breakpoints:
   - On screens < 640px: reduce `fret-cell` min-width, reduce font sizes in note markers
   - Chord voicing grid: change from a fixed grid to 2-column on mobile
   - Tab panel: make the tab row scroll horizontally if tabs overflow
2. In `ChordExplorer.tsx`, on small screens hide the fret numbers row below diagrams (or move them to a tooltip).
3. Test the full flow on a 375px viewport (iPhone SE size).

**Files to touch:** `src/index.css`, `src/components/ChordExplorer.tsx`.

---

## TIER 3 — Weeks of work (new features with significant logic)

---

### 11. Chord Progression Builder

Given a key and scale, show all diatonic chords. Let the user build a progression and see all voicings.

**Steps:**
1. In `src/music/chords.ts`, add `getDiatonicChords(root: PitchClass, scaleIntervals: number[]): ParsedChord[]`:
   - Build a chord on each degree of the scale
   - Detect chord type (major/minor/diminished) from the intervals at each degree
   - Return 7 `ParsedChord` objects

2. Create `src/components/ProgressionBuilder.tsx`:
   - Key selector + scale selector (reuse from ScaleSelector)
   - A grid of 7 diatonic chord cards (I through VII) with Roman numeral labels
   - Each card shows the chord name, type, and a small diagram of the first voicing
   - Click a chord to add it to the progression sequence (an ordered array at the bottom)
   - Reorder / remove chords in the sequence

3. Add a "Play progression" button that calls `playChord` from the audio player (item 6) for each chord in sequence with a configurable BPM and strumming delay.

4. Add a "Common progressions" library:
   - I–IV–V (blues/rock)
   - I–V–vi–IV (pop)
   - ii–V–I (jazz)
   - I–vi–IV–V (50s)
   - vi–IV–I–V (modern pop minor)

5. Add a new tab `'progression'` in `App.tsx`.

**Files to touch:** `src/music/chords.ts`, `src/components/ProgressionBuilder.tsx` (new), `src/App.tsx`, `src/index.css`.

---

### 12. Practice Mode — Chord Flashcards

Gamified practice that builds chord recognition and recall.

**Steps:**
1. Create `src/components/PracticeMode.tsx`:
   - Mode A (Recognition): Show a chord diagram, user names the chord. Check answer.
   - Mode B (Recall): Show a chord name, user picks the correct diagram from 4 options.
   - Mode C (Random voicing): Show a random chord name, user has to play it — reveals the correct voicing on submit.
2. Track a session score (correct / total) shown live.
3. Weight cards toward chords the user gets wrong more often (spaced repetition, stored in localStorage).
4. Let users choose which chord types to include (e.g. "only major and minor", "all 7ths").

**Files to touch:** `src/components/PracticeMode.tsx` (new), `src/App.tsx`, `src/index.css`.

---

### 13. Save & Share Custom Configurations (Named Presets)

Let users save their own named scale/chord/tuning setups and share them.

**Steps:**
1. Add `savedPresets: SavedPreset[]` to the localStorage schema:
   ```ts
   interface SavedPreset {
     id: string;
     name: string;
     notes: PitchClass[];
     root: PitchClass | null;
     tuning: PitchClass[];
     accidentalPreference: AccidentalPreference;
     createdAt: number;
   }
   ```
2. Add a "Save current setup" button in the controls panel with a name input dialog.
3. Show saved presets in a list with load / delete / copy-link actions.
4. The "copy link" uses the existing shareable URL system (item 2) with the preset's values.

**Files to touch:** `src/App.tsx`, `src/hooks/useLocalStorage.ts`, `src/components/TuningSettings.tsx` or a new `Presets.tsx`, `src/index.css`.

---

### 14. Ear Training Mode

Given audio playback (item 6), add an ear training game: play a chord or scale, user identifies it.

**Steps:**
1. In `src/components/EarTraining.tsx`, build two modes:
   - Chord ID: play a random chord voicing (via audio player), user picks the chord name from a list of 4 options
   - Interval ID: play two notes sequentially, user names the interval
2. Track accuracy per chord type. Show weak spots.
3. Difficulty levels: beginner (major/minor only) → intermediate (7ths) → advanced (all types + inversions).

**Dependencies:** Requires audio playback (item 6) to be complete first.

**Files to touch:** `src/components/EarTraining.tsx` (new), `src/App.tsx`, `src/index.css`.

---

## TIER 4 — Payment (do this last, after the tool is complete)

---

### 15. Freemium Gate + Stripe Integration

Only implement this when the tool is fully built and you are ready to charge.

**Decision to make first:**
- Pricing model: subscription ($8.99/mo, $89/yr) or one-time lifetime ($59–79)
- What is free vs. Pro (define the gate clearly before building it)

**Suggested free/pro split:**
| Free | Pro |
|------|-----|
| Chord Finder (preset shapes only) | Full voicing search across all frets |
| Standard tuning only | All tunings + custom + 7-string |
| Manual note selection | Scale library |
| — | Audio playback |
| — | Chord Progression Builder |
| — | Export to PNG |
| — | Shareable URLs with custom presets |
| — | Practice & Ear Training modes |

**Steps:**
1. Create a Stripe account. Set up products and prices in the Stripe dashboard.
2. Add a minimal backend (a Cloudflare Worker or Vercel Edge Function is enough — no full server needed):
   - `POST /create-checkout-session` → redirect to Stripe Checkout
   - `POST /verify-session` → return a signed token (JWT) confirming payment
3. Store the JWT in localStorage. On load, validate it client-side (check expiry and signature).
4. Create a `useProAccess()` hook that returns `{ isPro: boolean }`.
5. Wrap Pro features with a `<ProGate>` component: renders children if `isPro`, otherwise shows an upgrade prompt with a "Go Pro" button.
6. Add a `/pricing` view or modal with the feature comparison table and Stripe Checkout link.
7. Handle subscription management: link to the Stripe customer portal for cancellation.
8. Add a restore-purchase flow for lifetime buyers.

**Files to touch:** `src/hooks/useProAccess.ts` (new), `src/components/ProGate.tsx` (new), all Pro feature components, a new `/api/` edge function directory.

---

## Quick Reference: Order of Implementation

| # | Feature | Effort |
|---|---------|--------|
| 1 | Scale library | 1–2 days |
| 2 | Shareable URLs | half day |
| 3 | Additional tuning presets | 1 hour |
| 4 | Fret count UI control | 2 hours |
| 5 | Interval / degree labels | half day |
| 6 | Audio playback | 3–5 days |
| 7 | Export chord diagrams as PNG | 1 day |
| 8 | Scale box patterns (CAGED) | 2–3 days |
| 9 | PWA (installable + offline) | 1 day |
| 10 | Mobile layout polish | 1–2 days |
| 11 | Chord Progression Builder | 1–2 weeks |
| 12 | Practice Mode (flashcards) | 1 week |
| 13 | Save & share custom presets | 3–5 days |
| 14 | Ear Training Mode | 1 week |
| 15 | Payment (Stripe + freemium gate) | last |
