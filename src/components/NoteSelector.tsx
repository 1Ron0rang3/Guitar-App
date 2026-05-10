import { NOTE_BUTTON_ORDER, getButtonLabel } from '../music/notes';
import type { PitchClass } from '../types';

interface NoteSelectorProps {
  selectedNotes: PitchClass[];
  rootNote: PitchClass | null;
  onToggle: (note: PitchClass) => void;
  onSetRoot: (note: PitchClass | null) => void;
  onClear: () => void;
  onSelectAll: () => void;
}

export function NoteSelector({ selectedNotes, rootNote, onToggle, onSetRoot, onClear, onSelectAll }: NoteSelectorProps) {
  const selectedSet = new Set(selectedNotes);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Note Selection</p>
          <h2>Select any pitch classes to map them across the neck.</h2>
        </div>
      </div>
      <div className="note-grid">
        {NOTE_BUTTON_ORDER.map((note) => {
          const active = selectedSet.has(note);
          const isRoot = rootNote === note;

          return (
            <div key={note} className="note-card">
              <button
                type="button"
                className={`note-button ${active ? 'is-active' : ''} ${isRoot ? 'is-root' : ''}`}
                onClick={() => onToggle(note)}
                aria-pressed={active}
              >
                <span>{getButtonLabel(note)}</span>
              </button>
              <button
                type="button"
                className={`root-button ${isRoot ? 'is-root' : ''}`}
                onClick={() => onSetRoot(isRoot ? null : note)}
              >
                {isRoot ? 'Root note' : 'Set root'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="button-row note-actions">
        <button type="button" className="ghost-button" onClick={onClear}>
          Clear notes
        </button>
        <button type="button" className="solid-button" onClick={onSelectAll}>
          Select all 12 notes
        </button>
      </div>
    </section>
  );
}
