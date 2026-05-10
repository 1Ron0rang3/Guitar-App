import { formatNote, getFretMarkers, getNoteAtFret } from '../music/notes';
import type { AccidentalPreference, PitchClass } from '../types';

interface FretboardProps {
  tuning: PitchClass[];
  fretCount: number;
  selectedNotes: PitchClass[];
  rootNote: PitchClass | null;
  showLabels: boolean;
  hideUnselected: boolean;
  accidentalPreference: AccidentalPreference;
}

export function Fretboard({
  tuning,
  fretCount,
  selectedNotes,
  rootNote,
  showLabels,
  hideUnselected,
  accidentalPreference,
}: FretboardProps) {
  const selectedSet = new Set(selectedNotes);
  const fretMarkers = getFretMarkers(fretCount);
  const frets = Array.from({ length: fretCount + 1 }, (_, index) => index);
  const displayedStrings = tuning.map((openNote, index) => ({ openNote, index })).reverse();

  return (
    <section className="panel fretboard-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Fretboard</p>
          <h2>Every note is calculated from the current tuning and fret position.</h2>
        </div>
      </div>

      <div className="fretboard-scroll">
        <div className="fretboard" style={{ gridTemplateColumns: `repeat(${fretCount + 1}, 1fr)` }}>
          {frets.map((fret) => (
            <div key={`header-${fret}`} className={`fret-header ${fret === 0 ? 'nut-cell' : ''}`}>
              {fret}
            </div>
          ))}

          {displayedStrings.map(({ openNote, index }) => (
            <div className="fretboard-row" key={`string-${index}`}>
              {frets.map((fret) => {
                const note = getNoteAtFret(openNote, fret);
                const isSelected = selectedSet.has(note);
                const isRoot = rootNote === note;
                const shouldHide = hideUnselected && selectedSet.size > 0 && !isSelected;

                return (
                  <div key={`string-${index}-fret-${fret}`} className={`fret-cell ${fret === 0 ? 'nut-cell' : ''}`}>
                    <div className={`string-line ${index === tuning.length - 1 ? 'string-line-top' : ''}`} />
                    <div className={`marker-shell ${shouldHide ? 'is-hidden' : ''}`}>
                      <div
                        className={[
                          'note-marker',
                          isSelected ? 'is-selected' : 'is-muted',
                          isRoot ? 'is-root' : '',
                          fret === 0 ? 'is-open' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {showLabels ? formatNote(note, accidentalPreference) : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="marker-strip">
        <span className="helper-label">Fret markers</span>
        <div className="marker-dots">
          {fretMarkers.map((fret) => (
            <div key={`marker-${fret}`} className="marker-dot-group">
              <span>{fret}</span>
              <div className={`marker-dot ${fret === 12 || fret === 24 ? 'is-double' : ''}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
