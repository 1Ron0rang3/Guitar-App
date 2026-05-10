import type { AccidentalPreference, PitchClass } from '../types';

interface ControlsPanelProps {
  noteInput: string;
  showLabels: boolean;
  hideUnselected: boolean;
  accidentalPreference: AccidentalPreference;
  selectedNotes: PitchClass[];
  onNoteInputChange: (value: string) => void;
  onShowLabelsChange: (value: boolean) => void;
  onHideUnselectedChange: (value: boolean) => void;
  onAccidentalPreferenceChange: (value: AccidentalPreference) => void;
  onClear: () => void;
  onSelectAll: () => void;
}

export function ControlsPanel({
  noteInput,
  showLabels,
  hideUnselected,
  accidentalPreference,
  selectedNotes,
  onNoteInputChange,
  onShowLabelsChange,
  onHideUnselectedChange,
  onAccidentalPreferenceChange,
  onClear,
  onSelectAll,
}: ControlsPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Controls</p>
          <h2>Adjust display options and quick note entry.</h2>
        </div>
      </div>

      <div className="control-stack">
        <label className="field">
          <span>Type notes</span>
          <input
            value={noteInput}
            onChange={(event) => onNoteInputChange(event.target.value)}
            placeholder="Example: C D# F G A"
          />
        </label>

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
              checked={showLabels}
              onChange={(event) => onShowLabelsChange(event.target.checked)}
            />
            <span>Show note labels on markers</span>
          </label>

          <label className="toggle">
            <input
              type="checkbox"
              checked={hideUnselected}
              onChange={(event) => onHideUnselectedChange(event.target.checked)}
            />
            <span>Hide non-selected notes</span>
          </label>
        </div>

        <div className="button-row">
          <button type="button" className="ghost-button" onClick={onClear}>
            Clear notes
          </button>
          <button type="button" className="solid-button" onClick={onSelectAll}>
            Select all 12 notes
          </button>
        </div>

        <p className="helper-text">{selectedNotes.length} notes active. Typing valid note names updates the selection instantly.</p>
      </div>
    </section>
  );
}
