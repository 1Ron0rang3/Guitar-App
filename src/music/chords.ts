import { CHROMATIC_SHARPS, getNoteAtFret, getNoteIndex } from './notes';
import type { PitchClass } from '../types';

export interface ChordType {
  id: string;
  label: string;
  symbol: string;
  intervals: number[];
}

export const CHORD_TYPES: ChordType[] = [
  { id: 'maj',   label: 'Major',           symbol: '',        intervals: [0, 4, 7] },
  { id: 'min',   label: 'Minor',           symbol: 'm',       intervals: [0, 3, 7] },
  { id: '5',     label: 'Power Chord',     symbol: '5',       intervals: [0, 7] },
  { id: '7',     label: 'Dominant 7th',    symbol: '7',       intervals: [0, 4, 7, 10] },
  { id: 'maj7',  label: 'Major 7th',       symbol: 'maj7',    intervals: [0, 4, 7, 11] },
  { id: 'm7',    label: 'Minor 7th',       symbol: 'm7',      intervals: [0, 3, 7, 10] },
  { id: 'mmaj7', label: 'Minor maj7',      symbol: 'm(maj7)', intervals: [0, 3, 7, 11] },
  { id: 'dim',   label: 'Diminished',      symbol: '°',       intervals: [0, 3, 6] },
  { id: 'dim7',  label: 'Diminished 7th',  symbol: '°7',      intervals: [0, 3, 6, 9] },
  { id: 'm7b5',  label: 'Half-Diminished', symbol: 'ø',       intervals: [0, 3, 6, 10] },
  { id: 'aug',   label: 'Augmented',       symbol: '+',       intervals: [0, 4, 8] },
  { id: 'aug7',  label: 'Augmented 7th',   symbol: '7+',      intervals: [0, 4, 8, 10] },
  { id: 'sus2',  label: 'Suspended 2nd',   symbol: 'sus2',    intervals: [0, 2, 7] },
  { id: 'sus4',  label: 'Suspended 4th',   symbol: 'sus4',    intervals: [0, 5, 7] },
  { id: '7sus4', label: 'Dom 7 sus4',      symbol: '7sus4',   intervals: [0, 5, 7, 10] },
  { id: 'add9',  label: 'Add 9',           symbol: 'add9',    intervals: [0, 2, 4, 7] },
  { id: 'madd9', label: 'Minor add9',      symbol: 'm(add9)', intervals: [0, 2, 3, 7] },
  { id: '9',     label: 'Dominant 9th',    symbol: '9',       intervals: [0, 2, 4, 7, 10] },
  { id: 'maj9',  label: 'Major 9th',       symbol: 'maj9',    intervals: [0, 2, 4, 7, 11] },
  { id: 'm9',    label: 'Minor 9th',       symbol: 'm9',      intervals: [0, 2, 3, 7, 10] },
  { id: '6',     label: 'Major 6th',       symbol: '6',       intervals: [0, 4, 7, 9] },
  { id: 'm6',    label: 'Minor 6th',       symbol: 'm6',      intervals: [0, 3, 7, 9] },
];

// Sorted longest-match-first to avoid short patterns shadowing long ones.
// M7 (uppercase) is kept as a separate case-sensitive entry so it does not
// shadow m7 (minor 7th) when an i-flag pattern would otherwise swallow it.
const SUFFIX_PATTERNS: Array<[RegExp, string]> = [
  [/^(maj9|Maj9|MA9|Δ9|triangle9)$/i, 'maj9'],
  [/^(maj7|Maj7|MA7|Δ7|Δ|triangle7|triangle)$/i, 'maj7'],
  [/^M7$/, 'maj7'],
  [/^(maj|Maj|MA|Major)$/, 'maj'],
  [/^(m7b5|m7♭5|min7b5|min7♭5|ø7|ø|-7b5|half-?dim7?)$/i, 'm7b5'],
  // mmaj7 must precede m7 to avoid shadowing
  [/^(mmaj7|mMaj7|m\(maj7\)|minmaj7|min\(maj7\)|mM7|-maj7|mΔ7)$/, 'mmaj7'],
  [/^(m7|min7|-7)$/i, 'm7'],
  [/^(m9|min9|-9)$/i, 'm9'],
  [/^(m6|min6|-6)$/i, 'm6'],
  [/^(dim7|°7|o7)$/i, 'dim7'],
  [/^(dim|°|o)$/i, 'dim'],
  // aug7 before aug so "aug7" suffix doesn't stop at "aug"
  [/^(aug7|7\+|7#5|7\+5)$/i, 'aug7'],
  [/^(aug|augmented|\+)$/i, 'aug'],
  [/^(sus2)$/i, 'sus2'],
  // 7sus4 before sus4 and before bare "7"
  [/^(7sus4|dom7sus4)$/i, '7sus4'],
  [/^(sus4|sus)$/i, 'sus4'],
  [/^(add9|addb9)$/i, 'add9'],
  // m(add9) before bare "m" so the suffix isn't swallowed early
  [/^(m\(add9\)|madd9|min\(add9\)|minadd9)$/i, 'madd9'],
  [/^(m|min|minor|-)$/i, 'min'],
  [/^(9)$/, '9'],
  [/^(7)$/, '7'],
  [/^(6)$/, '6'],
  [/^(5|pow|power)$/i, '5'],
  [/^$/, 'maj'],
];

const ENHARMONIC: Record<string, PitchClass> = {
  C: 'C', 'B#': 'C', 'C#': 'C#', Db: 'C#',
  D: 'D', 'D#': 'D#', Eb: 'D#',
  E: 'E', Fb: 'E', 'E#': 'F',
  F: 'F', 'F#': 'F#', Gb: 'F#',
  G: 'G', 'G#': 'G#', Ab: 'G#',
  A: 'A', 'A#': 'A#', Bb: 'A#',
  B: 'B', Cb: 'B',
};

export interface ParsedChord {
  root: PitchClass;
  rootDisplay: string;
  type: ChordType;
  displayName: string;
}

export function parseChordName(input: string): ParsedChord | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const m = trimmed.match(/^([A-Ga-g][#b]?)(.*)/);
  if (!m) return null;

  const rawRoot = m[1]!;
  const suffix = m[2] ?? '';
  const rootKey = rawRoot.charAt(0).toUpperCase() + rawRoot.slice(1);
  const root = ENHARMONIC[rootKey];
  if (!root) return null;

  let typeId: string | null = null;
  for (const [pattern, id] of SUFFIX_PATTERNS) {
    if (pattern.test(suffix)) {
      typeId = id;
      break;
    }
  }
  if (!typeId) return null;

  const type = CHORD_TYPES.find((t) => t.id === typeId);
  if (!type) return null;

  return {
    root,
    rootDisplay: rootKey,
    type,
    displayName: `${rootKey}${type.symbol}`,
  };
}

export function getChordNotes(root: PitchClass, intervals: number[]): PitchClass[] {
  const idx = getNoteIndex(root);
  return intervals.map((s) => CHROMATIC_SHARPS[(idx + s) % 12]!);
}

export interface ChordVoicing {
  id: string;
  // frets[0] = String 6 (lowest/thickest). null = muted.
  // Matches tuning[] index convention: tuning[0] = lowest string.
  frets: (number | null)[];
  minFret: number;
  bassNote: PitchClass;
  notesPlayed: PitchClass[];
  inversionLabel: string;
}

const INVERSION_LABELS = ['Root pos.', '1st inv.', '2nd inv.', '3rd inv.'];

function buildVoicing(
  frets: (number | null)[],
  tuning: PitchClass[],
  chord: ParsedChord,
  key: string,
): ChordVoicing {
  const chordIntervals = chord.type.intervals;

  const playedFrets = frets.filter((f): f is number => f !== null && f > 0);
  const minFret = playedFrets.length > 0 ? Math.min(...playedFrets) : 0;

  const notesPlayed: PitchClass[] = frets
    .map((f, s) => (f !== null ? getNoteAtFret(tuning[s]!, f) : null))
    .filter((n): n is PitchClass => n !== null);

  // Bass note = lowest played string (lowest index = thickest string)
  let bassNote: PitchClass = chord.root;
  for (let s = 0; s < frets.length; s++) {
    const f = frets[s];
    if (f !== null) {
      bassNote = getNoteAtFret(tuning[s]!, f);
      break;
    }
  }

  const rootIdx = getNoteIndex(chord.root);
  const bassInterval = (getNoteIndex(bassNote) - rootIdx + 12) % 12;
  const invIdx = chordIntervals.indexOf(bassInterval);
  const inversionLabel = invIdx >= 0 ? (INVERSION_LABELS[invIdx] ?? 'Root pos.') : 'Root pos.';

  return { id: key, frets, minFret, bassNote, notesPlayed, inversionLabel };
}

export function findVoicings(tuning: PitchClass[], chord: ParsedChord, maxFret = 16): ChordVoicing[] {
  // tuning[0] = lowest string (String 6 / low E in standard)
  // frets[i] corresponds to tuning[i]
  const chordNotes = getChordNotes(chord.root, chord.type.intervals);
  const chordNoteSet = new Set<PitchClass>(chordNotes);

  const results: ChordVoicing[] = [];
  const seen = new Set<string>();

  function tryVoicing(frets: (number | null)[]) {
    // Span check: fretted (non-zero) frets must span ≤ 4
    const frettedOnly = frets.filter((f): f is number => f !== null && f > 0);
    if (frettedOnly.length > 0) {
      const span = Math.max(...frettedOnly) - Math.min(...frettedOnly);
      if (span > 4) return;
    }

    // Coverage check
    const playedNoteSet = new Set(
      frets.map((f, s) => (f !== null ? getNoteAtFret(tuning[s]!, f) : null)).filter(Boolean),
    );
    if (!chordNotes.every((n) => playedNoteSet.has(n))) return;

    // Min 3 strings
    if (frets.filter((f) => f !== null).length < 3) return;

    const key = frets.map((f) => (f === null ? 'x' : f)).join(',');
    if (seen.has(key)) return;
    seen.add(key);

    results.push(buildVoicing(frets, tuning, chord, key));
  }

  // Power chords iterate over every window of exactly 3 consecutive strings so
  // that open chord tones on higher strings (e.g. open B or high-E for E5) are
  // never pulled into the voicing. Other chords use all strings as normal.
  const isPowerChord = chord.type.id === '5';
  const stringWindows: Set<number>[] | null = isPowerChord
    ? Array.from({ length: tuning.length - 2 }, (_, i) => new Set([i, i + 1, i + 2]))
    : null;

  for (let ws = 0; ws <= maxFret; ws++) {
    const lo = ws;
    const hi = ws + 3;

    // Per string: frets within window, plus open string if it's a chord tone
    const baseOptions: number[][] = tuning.map((openNote) => {
      const avail: number[] = [];
      if (chordNoteSet.has(getNoteAtFret(openNote, 0))) avail.push(0);
      for (let f = Math.max(lo, 1); f <= Math.min(hi, maxFret); f++) {
        if (chordNoteSet.has(getNoteAtFret(openNote, f))) avail.push(f);
      }
      return avail;
    });

    const windows = stringWindows ?? [null];
    for (const active of windows) {
      // Mask out strings outside the active window (power chord only)
      const options = active
        ? baseOptions.map((opts, s) => (active.has(s) ? opts : []))
        : baseOptions;

      // Strategy A: lowest fret per string (incl. open)
      const stratA: (number | null)[] = options.map((opts) => opts[0] ?? null);
      tryVoicing(stratA);

      // Strategy B: prefer frets within the window (position-specific, no open)
      const stratB: (number | null)[] = options.map((opts) => {
        const inWindow = opts.filter((f) => f >= lo && f <= hi);
        return inWindow.length > 0 ? (inWindow[0] ?? null) : null;
      });
      tryVoicing(stratB);

      // Strategy C: highest fret per string in window (different inversions)
      const stratC: (number | null)[] = options.map((opts) => {
        const inWindow = opts.filter((f) => f >= lo && f <= hi);
        return inWindow.length > 0 ? (inWindow[inWindow.length - 1] ?? null) : null;
      });
      tryVoicing(stratC);
    }
  }

  return results.sort((a, b) => a.minFret - b.minFret);
}

// ── Preset chord shapes (standard tuning, low E → high e) ──────────────────

export const STANDARD_TUNING: PitchClass[] = ['E', 'A', 'D', 'G', 'B', 'E'];

export interface PresetShape {
  name: string;
  chordQuery: string;
  frets: (number | null)[];
  root: PitchClass;
}

export interface PresetCategory {
  label: string;
  shapes: PresetShape[];
}

export const PRESET_CATEGORIES: PresetCategory[] = [
  {
    label: 'Open Major',
    shapes: [
      { name: 'E', chordQuery: 'E', root: 'E', frets: [0, 2, 2, 1, 0, 0] },
      { name: 'A', chordQuery: 'A', root: 'A', frets: [null, 0, 2, 2, 2, 0] },
      { name: 'D', chordQuery: 'D', root: 'D', frets: [null, null, 0, 2, 3, 2] },
      { name: 'G', chordQuery: 'G', root: 'G', frets: [3, 2, 0, 0, 3, 3] },
      { name: 'C', chordQuery: 'C', root: 'C', frets: [null, 3, 2, 0, 1, 0] },
    ],
  },
  {
    label: 'Open Minor',
    shapes: [
      { name: 'Em', chordQuery: 'Em', root: 'E', frets: [0, 2, 2, 0, 0, 0] },
      { name: 'Am', chordQuery: 'Am', root: 'A', frets: [null, 0, 2, 2, 1, 0] },
      { name: 'Dm', chordQuery: 'Dm', root: 'D', frets: [null, null, 0, 2, 3, 1] },
    ],
  },
  {
    label: 'Dominant 7th',
    shapes: [
      { name: 'E7', chordQuery: 'E7', root: 'E', frets: [0, 2, 0, 1, 0, 0] },
      { name: 'A7', chordQuery: 'A7', root: 'A', frets: [null, 0, 2, 0, 2, 0] },
      { name: 'D7', chordQuery: 'D7', root: 'D', frets: [null, null, 0, 2, 1, 2] },
      { name: 'G7', chordQuery: 'G7', root: 'G', frets: [3, 2, 0, 0, 0, 1] },
      { name: 'C7', chordQuery: 'C7', root: 'C', frets: [null, 3, 2, 3, 1, 0] },
      { name: 'B7', chordQuery: 'B7', root: 'B', frets: [null, 2, 1, 2, 0, 2] },
    ],
  },
  {
    label: 'Minor 7th',
    shapes: [
      { name: 'Em7', chordQuery: 'Em7', root: 'E', frets: [0, 2, 2, 0, 3, 0] },
      { name: 'Am7', chordQuery: 'Am7', root: 'A', frets: [null, 0, 2, 0, 1, 0] },
      { name: 'Dm7', chordQuery: 'Dm7', root: 'D', frets: [null, null, 0, 2, 1, 1] },
    ],
  },
  {
    label: 'Suspended',
    shapes: [
      { name: 'Asus2', chordQuery: 'Asus2', root: 'A', frets: [null, 0, 2, 2, 0, 0] },
      { name: 'Dsus2', chordQuery: 'Dsus2', root: 'D', frets: [null, null, 0, 2, 3, 0] },
      { name: 'Asus4', chordQuery: 'Asus4', root: 'A', frets: [null, 0, 2, 2, 3, 0] },
      { name: 'Dsus4', chordQuery: 'Dsus4', root: 'D', frets: [null, null, 0, 2, 3, 3] },
      { name: 'Esus4', chordQuery: 'Esus4', root: 'E', frets: [0, 2, 2, 2, 0, 0] },
    ],
  },
  {
    label: 'Barre',
    shapes: [
      { name: 'F',  chordQuery: 'F',  root: 'F', frets: [1, 3, 3, 2, 1, 1] },
      { name: 'Fm', chordQuery: 'Fm', root: 'F', frets: [1, 3, 3, 1, 1, 1] },
      { name: 'Bm', chordQuery: 'Bm', root: 'B', frets: [null, 2, 4, 4, 3, 2] },
    ],
  },
  {
    label: 'Power Chords',
    shapes: [
      { name: 'E5', chordQuery: 'E5', root: 'E', frets: [0, 2, 2, null, null, null] },
      { name: 'A5', chordQuery: 'A5', root: 'A', frets: [null, 0, 2, 2, null, null] },
      { name: 'D5', chordQuery: 'D5', root: 'D', frets: [null, null, 0, 2, 3, null] },
      { name: 'G5', chordQuery: 'G5', root: 'G', frets: [3, 5, 5, null, null, null] },
      { name: 'B5', chordQuery: 'B5', root: 'B', frets: [null, 2, 4, 4, null, null] },
      { name: 'C5', chordQuery: 'C5', root: 'C', frets: [null, 3, 5, 5, null, null] },
    ],
  },
];
