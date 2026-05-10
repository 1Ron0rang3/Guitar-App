import type { AccidentalPreference, PitchClass, TuningPreset } from '../types';

export const CHROMATIC_SHARPS: PitchClass[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const ENHARMONIC_EQUIVALENTS: Record<string, PitchClass> = {
  C: 'C',
  'B#': 'C',
  'C#': 'C#',
  Db: 'C#',
  D: 'D',
  'D#': 'D#',
  Eb: 'D#',
  E: 'E',
  Fb: 'E',
  'E#': 'F',
  F: 'F',
  'F#': 'F#',
  Gb: 'F#',
  G: 'G',
  'G#': 'G#',
  Ab: 'G#',
  A: 'A',
  'A#': 'A#',
  Bb: 'A#',
  B: 'B',
  Cb: 'B',
};

export const COMMON_TUNINGS: TuningPreset[] = [
  { id: 'standard', label: 'Standard', tuning: ['E', 'A', 'D', 'G', 'B', 'E'] },
  { id: 'drop-d', label: 'Drop D', tuning: ['D', 'A', 'D', 'G', 'B', 'E'] },
  { id: 'd-standard', label: 'D Standard', tuning: ['D', 'G', 'C', 'F', 'A', 'D'] },
  { id: 'open-g', label: 'Open G', tuning: ['D', 'G', 'D', 'G', 'B', 'D'] },
  { id: 'open-d', label: 'Open D', tuning: ['D', 'A', 'D', 'F#', 'A', 'D'] },
];

export const NOTE_BUTTON_ORDER = CHROMATIC_SHARPS;

const FLAT_LABELS: Record<PitchClass, string> = {
  C: 'C',
  'C#': 'Db',
  D: 'D',
  'D#': 'Eb',
  E: 'E',
  F: 'F',
  'F#': 'Gb',
  G: 'G',
  'G#': 'Ab',
  A: 'A',
  'A#': 'Bb',
  B: 'B',
};

const SHARP_FLAT_BUTTON_LABELS: Record<PitchClass, string> = {
  C: 'C',
  'C#': 'C# / Db',
  D: 'D',
  'D#': 'D# / Eb',
  E: 'E',
  F: 'F',
  'F#': 'F# / Gb',
  G: 'G',
  'G#': 'G# / Ab',
  A: 'A',
  'A#': 'A# / Bb',
  B: 'B',
};

export function normalizeNoteName(value: string): PitchClass | null {
  const compact = value.trim();
  if (!compact) {
    return null;
  }

  const normalized = compact.charAt(0).toUpperCase() + compact.slice(1).replace(/[#b]/g, (token) => token);
  return ENHARMONIC_EQUIVALENTS[normalized] ?? null;
}

export function formatNote(note: PitchClass, preference: AccidentalPreference): string {
  if (preference === 'flat') {
    return FLAT_LABELS[note] ?? note;
  }

  return note;
}

export function getButtonLabel(note: PitchClass): string {
  return SHARP_FLAT_BUTTON_LABELS[note] ?? note;
}

export function getNoteIndex(note: PitchClass): number {
  return CHROMATIC_SHARPS.indexOf(note);
}

export function getNoteAtFret(openString: PitchClass, fret: number): PitchClass {
  const startIndex = getNoteIndex(openString);
  // Each fret moves one semitone forward through the 12-note chromatic cycle.
  const nextIndex = (startIndex + fret) % CHROMATIC_SHARPS.length;
  return CHROMATIC_SHARPS[nextIndex];
}

export function parseNoteList(value: string): PitchClass[] {
  const fragments = value.split(/[\s,/-]+/).filter(Boolean);
  const uniqueNotes = new Set<PitchClass>();

  fragments.forEach((fragment) => {
    const normalized = normalizeNoteName(fragment);
    if (normalized) {
      uniqueNotes.add(normalized);
    }
  });

  return [...uniqueNotes];
}

export function isValidTuning(tuning: string[]): boolean {
  return tuning.length > 0 && tuning.every((note) => normalizeNoteName(note) !== null);
}

export function getFretMarkers(fretCount: number): number[] {
  return [3, 5, 7, 9, 12, 15, 17, 19, 21, 24].filter((fret) => fret <= fretCount);
}
