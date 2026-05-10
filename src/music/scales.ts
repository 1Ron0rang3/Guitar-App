import { CHROMATIC_SHARPS, getNoteIndex } from './notes';
import type { PitchClass } from '../types';

export interface ScaleType {
  id: string;
  label: string;
  intervals: number[];
}

export interface ScaleCategory {
  label: string;
  scales: ScaleType[];
}

export const SCALE_CATEGORIES: ScaleCategory[] = [
  {
    label: 'Major & Minor',
    scales: [
      { id: 'major',          label: 'Major',          intervals: [0, 2, 4, 5, 7, 9, 11] },
      { id: 'natural-minor',  label: 'Natural Minor',  intervals: [0, 2, 3, 5, 7, 8, 10] },
      { id: 'harmonic-minor', label: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11] },
      { id: 'melodic-minor',  label: 'Melodic Minor',  intervals: [0, 2, 3, 5, 7, 9, 11] },
    ],
  },
  {
    label: 'Modes',
    scales: [
      { id: 'dorian',       label: 'Dorian',            intervals: [0, 2, 3, 5, 7, 9, 10] },
      { id: 'phrygian',     label: 'Phrygian',          intervals: [0, 1, 3, 5, 7, 8, 10] },
      { id: 'lydian',       label: 'Lydian',            intervals: [0, 2, 4, 6, 7, 9, 11] },
      { id: 'mixolydian',   label: 'Mixolydian',        intervals: [0, 2, 4, 5, 7, 9, 10] },
      { id: 'locrian',      label: 'Locrian',           intervals: [0, 1, 3, 5, 6, 8, 10] },
      { id: 'phrygian-dom', label: 'Phrygian Dominant', intervals: [0, 1, 4, 5, 7, 8, 10] },
    ],
  },
  {
    label: 'Pentatonic & Blues',
    scales: [
      { id: 'major-pentatonic', label: 'Major Pentatonic', intervals: [0, 2, 4, 7, 9] },
      { id: 'minor-pentatonic', label: 'Minor Pentatonic', intervals: [0, 3, 5, 7, 10] },
      { id: 'blues',            label: 'Blues',            intervals: [0, 3, 5, 6, 7, 10] },
      { id: 'major-blues',      label: 'Major Blues',      intervals: [0, 2, 3, 4, 7, 9] },
    ],
  },
  {
    label: 'Symmetric',
    scales: [
      { id: 'whole-tone', label: 'Whole Tone',       intervals: [0, 2, 4, 6, 8, 10] },
      { id: 'dim-hw',     label: 'Diminished (H-W)', intervals: [0, 1, 3, 4, 6, 7, 9, 10] },
      { id: 'dim-wh',     label: 'Diminished (W-H)', intervals: [0, 2, 3, 5, 6, 8, 9, 11] },
    ],
  },
  {
    label: 'Exotic',
    scales: [
      { id: 'hungarian-minor',  label: 'Hungarian Minor',  intervals: [0, 2, 3, 6, 7, 8, 11] },
      { id: 'double-harmonic',  label: 'Double Harmonic',  intervals: [0, 1, 4, 5, 7, 8, 11] },
      { id: 'persian',          label: 'Persian',          intervals: [0, 1, 4, 5, 6, 8, 11] },
      { id: 'neapolitan-minor', label: 'Neapolitan Minor', intervals: [0, 1, 3, 5, 7, 8, 11] },
    ],
  },
];

export const SCALES: ScaleType[] = SCALE_CATEGORIES.flatMap((c) => c.scales);

export function getScaleNotes(root: PitchClass, intervals: number[]): PitchClass[] {
  const idx = getNoteIndex(root);
  return intervals.map((s) => CHROMATIC_SHARPS[(idx + s) % 12]!);
}

export function detectScale(notes: PitchClass[], root: PitchClass): ScaleType | null {
  if (notes.length === 0) return null;
  const rootIdx = getNoteIndex(root);
  const intervalSet = new Set(notes.map((n) => (getNoteIndex(n) - rootIdx + 12) % 12));
  return (
    SCALES.find(
      (s) => s.intervals.length === notes.length && s.intervals.every((i) => intervalSet.has(i)),
    ) ?? null
  );
}
