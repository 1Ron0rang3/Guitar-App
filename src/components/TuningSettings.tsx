import { useEffect, useState } from 'react';
import { COMMON_TUNINGS, formatNote, normalizeNoteName } from '../music/notes';
import type { AccidentalPreference, PitchClass } from '../types';

interface TuningSettingsProps {
  tuning: PitchClass[];
  isSevenString: boolean;
  showLabels: boolean;
  hideUnselected: boolean;
  selectedNotes: PitchClass[];
  accidentalPreference: AccidentalPreference;
  onPresetChange: (presetId: string) => void;
  onStringChange: (stringIndex: number, value: string) => void;
  onSevenStringToggle: (value: boolean) => void;
  onShowLabelsChange: (value: boolean) => void;
  onHideUnselectedChange: (value: boolean) => void;
  onAccidentalPreferenceChange: (value: AccidentalPreference) => void;
}

export function TuningSettings({
  tuning,
  isSevenString,
  showLabels,
  hideUnselected,
  selectedNotes,
  accidentalPreference,
  onPresetChange,
  onStringChange,
  onSevenStringToggle,
  onShowLabelsChange,
  onHideUnselectedChange,
  onAccidentalPreferenceChange,
}: TuningSettingsProps) {
  const [draftTuning, setDraftTuning] = useState<string[]>(() =>
    tuning.map((note) => formatNote(note, accidentalPreference)),
  );
  const [inputMessage, setInputMessage] = useState<string | null>(null);

  useEffect(() => {
    setDraftTuning(tuning.map((note) => formatNote(note, accidentalPreference)));
  }, [accidentalPreference, tuning]);

  function handleDraftChange(stringIndex: number, value: string) {
    setDraftTuning((current) => current.map((entry, index) => (index === stringIndex ? value : entry)));
    if (inputMessage) {
      setInputMessage(null);
    }
  }

  function commitDraft(stringIndex: number) {
    const draftValue = draftTuning[stringIndex] ?? '';
    const normalized = normalizeNoteName(draftValue);

    if (draftValue.trim() === '') {
      setDraftTuning((current) =>
        current.map((entry, index) =>
          index === stringIndex ? formatNote(tuning[stringIndex], accidentalPreference) : entry,
        ),
      );
      setInputMessage(null);
      return;
    }

    if (!normalized) {
      setDraftTuning((current) =>
        current.map((entry, index) =>
          index === stringIndex ? formatNote(tuning[stringIndex], accidentalPreference) : entry,
        ),
      );
      setInputMessage(`String ${tuning.length - stringIndex} must be a valid note name.`);
      return;
    }

    setInputMessage(null);
    onStringChange(stringIndex, normalized);
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Controls</p>
          <h2>Change tuning and adjust how the fretboard is displayed.</h2>
        </div>
      </div>

      <div className="control-stack">
        <div className="single-field-row">
          <label className="field">
            <span>Label style</span>
            <select
              value={accidentalPreference}
              onChange={(event) => onAccidentalPreferenceChange(event.target.value as AccidentalPreference)}
            >
              <option value="sharp">Sharps</option>
              <option value="flat">Flats</option>
            </select>
          </label>
        </div>

        <div className="toggle-row">
          <label className="toggle">
            <input
              type="checkbox"
              checked={isSevenString}
              onChange={(event) => onSevenStringToggle(event.target.checked)}
            />
            <span>Add 7th bottom string</span>
          </label>

          <label className="toggle">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(event) => onShowLabelsChange(event.target.checked)}
            />
            <span>Show note labels on markers</span>
          </label>

        </div>

        <div className="toggle-row">
          <label className="toggle">
            <input
              type="checkbox"
              checked={hideUnselected}
              onChange={(event) => onHideUnselectedChange(event.target.checked)}
            />
            <span>Hide non-selected notes</span>
          </label>
        </div>

        <label className="field">
          <span>Preset tunings</span>
          <select value="" onChange={(event) => onPresetChange(event.target.value)}>
            <option value="" disabled>
              Choose a preset
            </option>
            {COMMON_TUNINGS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label} ({preset.tuning.map((note) => formatNote(note, accidentalPreference)).join(' ')})
              </option>
            ))}
          </select>
        </label>

        <div className="tuning-grid">
          {tuning.map((note, index) => (
            <label key={`${index}-${note}`} className="field">
              <span>String {tuning.length - index}</span>
              <input
                value={draftTuning[index] ?? ''}
                onChange={(event) => handleDraftChange(index, event.target.value)}
                onBlur={() => commitDraft(index)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur();
                  }
                }}
              />
            </label>
          ))}
        </div>

        {inputMessage ? (
          <div className="warning-box">
            <p>{inputMessage}</p>
          </div>
        ) : (
          <p className="helper-text">
            {selectedNotes.length} notes active. Supports sharps and flats for tuning input, like F#, Bb, or E.
          </p>
        )}
      </div>
    </section>
  );
}
