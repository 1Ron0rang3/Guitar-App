export type PitchClass = string;

export type AccidentalPreference = 'sharp' | 'flat';

export interface TuningPreset {
  id: string;
  label: string;
  tuning: PitchClass[];
}

export interface FretNote {
  fret: number;
  note: PitchClass;
  isSelected: boolean;
  isRoot: boolean;
}
