import { useMemo, useState } from 'react';
import { PRESET_CATEGORIES, findVoicings, getChordNotes, parseChordName } from '../music/chords';
import { COMMON_TUNINGS, formatNote, getNoteAtFret } from '../music/notes';
import type { AccidentalPreference, PitchClass } from '../types';
import type { ChordVoicing } from '../music/chords';

interface ChordExplorerProps {
  tuning: PitchClass[];
  accidentalPreference: AccidentalPreference;
}

// frets[0] = lowest string = leftmost in diagram
// stringTuning[i] matches frets[i] (low-to-high)
interface DiagramProps {
  frets: (number | null)[];
  stringTuning: PitchClass[];
  root: PitchClass;
}

function ChordDiagram({ frets, stringTuning, root }: DiagramProps) {
  const stringCount = frets.length;

  const frettedFrets = frets.filter((f): f is number => f !== null && f > 0);
  const rawMin = frettedFrets.length > 0 ? Math.min(...frettedFrets) : 0;
  // Display start: if min fret is 1 or 2, show from 1 (treat as open area)
  const hasOpenString = frets.some((f) => f === 0);
  const isOpenPosition = (hasOpenString && rawMin <= 4) || rawMin <= 1;
  const displayStart = isOpenPosition ? 1 : rawMin;

  const STRING_SPACING = 20;
  const FRET_SPACING = 20;
  const FRETS_SHOWN = 4;
  const DOT_R = 7.5;
  const PAD_TOP = 26;
  const PAD_LEFT = isOpenPosition ? 8 : 22;
  const PAD_RIGHT = 8;
  const PAD_BOTTOM = 8;

  const W = PAD_LEFT + (stringCount - 1) * STRING_SPACING + PAD_RIGHT;
  const H = PAD_TOP + FRETS_SHOWN * FRET_SPACING + PAD_BOTTOM;

  const sx = (s: number) => PAD_LEFT + s * STRING_SPACING;
  const fy = (f: number) => PAD_TOP + (f - displayStart + 0.5) * FRET_SPACING;

  // Detect barre: 2+ strings at the min fret, where the barre starts from
  // the lowest played string and has no muted/open strings within its span.
  const fretCounts = new Map<number, number[]>();
  frets.forEach((f, s) => {
    if (f !== null && f > 0) {
      const arr = fretCounts.get(f) ?? [];
      arr.push(s);
      fretCounts.set(f, arr);
    }
  });
  const barreData = (() => {
    if (frettedFrets.length === 0) return null;
    const bf = Math.min(...frettedFrets);
    const barreStrings = fretCounts.get(bf) ?? [];
    if (barreStrings.length < 2) return null;

    // Barre must begin at the lowest played (non-null) string
    const lowestPlayedIdx = frets.findIndex((f) => f !== null);
    if (Math.min(...barreStrings) !== lowestPlayedIdx) return null;

    // No open or muted strings within the barre span
    const minS = Math.min(...barreStrings);
    const maxS = Math.max(...barreStrings);
    for (let s = minS; s <= maxS; s++) {
      const f = frets[s];
      if (f === null || f === 0) return null;
    }

    return { fret: bf, strings: barreStrings };
  })();

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      className="chord-diagram-svg"
    >
      {/* Fret number label (non-open position) — sits above the grid to avoid barre overlap */}
      {!isOpenPosition && (
        <text
          x={PAD_LEFT / 2}
          y={PAD_TOP - 8}
          textAnchor="middle"
          className="diagram-label"
          fontSize={9}
          fontWeight={700}
        >
          {displayStart}fr
        </text>
      )}

      {/* Nut bar (open position only) */}
      {isOpenPosition && (
        <rect
          x={PAD_LEFT}
          y={PAD_TOP - 3}
          width={(stringCount - 1) * STRING_SPACING}
          height={3}
          rx={1}
          className="diagram-nut"
        />
      )}

      {/* Fret lines */}
      {Array.from({ length: FRETS_SHOWN + 1 }).map((_, i) => (
        <line
          key={i}
          x1={PAD_LEFT}
          y1={PAD_TOP + i * FRET_SPACING}
          x2={PAD_LEFT + (stringCount - 1) * STRING_SPACING}
          y2={PAD_TOP + i * FRET_SPACING}
          className="diagram-grid"
        />
      ))}

      {/* String lines */}
      {Array.from({ length: stringCount }).map((_, s) => (
        <line
          key={s}
          x1={sx(s)}
          y1={PAD_TOP}
          x2={sx(s)}
          y2={PAD_TOP + FRETS_SHOWN * FRET_SPACING}
          className="diagram-grid"
        />
      ))}

      {/* Barre bar */}
      {barreData && barreData.strings.length >= 2 && (
        <rect
          x={sx(Math.min(...barreData.strings)) - DOT_R}
          y={fy(barreData.fret) - DOT_R}
          width={
            sx(Math.max(...barreData.strings)) -
            sx(Math.min(...barreData.strings)) +
            DOT_R * 2
          }
          height={DOT_R * 2}
          rx={DOT_R}
          className="diagram-barre"
        />
      )}

      {/* Per-string indicators */}
      {frets.map((fret, s) => {
        if (fret === null) {
          return (
            <text
              key={s}
              x={sx(s)}
              y={PAD_TOP - 8}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              className="diagram-mute"
            >
              ×
            </text>
          );
        }

        if (fret === 0) {
          return (
            <circle
              key={s}
              cx={sx(s)}
              cy={PAD_TOP - 9}
              r={5}
              className="diagram-open-circle"
            />
          );
        }

        if (fret < displayStart || fret > displayStart + FRETS_SHOWN - 1) return null;

        const note = getNoteAtFret(stringTuning[s]!, fret);
        const isRoot = note === root;
        const isBarre = barreData?.fret === fret && (barreData.strings ?? []).includes(s);

        return (
          <circle
            key={s}
            cx={sx(s)}
            cy={fy(fret)}
            r={DOT_R}
            className={isRoot ? 'diagram-dot is-root' : isBarre ? 'diagram-dot is-barre' : 'diagram-dot'}
          />
        );
      })}
    </svg>
  );
}

const EXAMPLE_CHORDS = ['Cmaj7', 'Am', 'G', 'Dm7', 'F', 'Em7', 'Bm', 'D'];

export function ChordExplorer({ tuning, accidentalPreference }: ChordExplorerProps) {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [filterRoot, setFilterRoot] = useState(false);

  const parsed = useMemo(() => parseChordName(submitted), [submitted]);

  const voicings = useMemo(() => {
    if (!parsed) return [];
    return findVoicings(tuning, parsed);
  }, [tuning, parsed]);

  const chordNotes = useMemo(
    () => (parsed ? getChordNotes(parsed.root, parsed.type.intervals) : []),
    [parsed],
  );

  const filtered = useMemo(
    () => (filterRoot ? voicings.filter((v) => v.bassNote === parsed?.root) : voicings),
    [voicings, filterRoot, parsed],
  );

  // Does this chord have a named preset? Used to show the "Standard Shape" badge on the first result.
  const hasStandardShape = useMemo(
    () => parsed
      ? PRESET_CATEGORIES.some((c) => c.shapes.some((s) => s.chordQuery === parsed.displayName))
      : false,
    [parsed],
  );

  function handleSubmit() {
    setFilterRoot(false);
    setSubmitted(query.trim());
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit();
  }

  function handleExample(name: string) {
    setFilterRoot(false);
    setQuery(name);
    setSubmitted(name);
  }

  const parseError = submitted && !parsed;

  return (
    <section className="panel chord-explorer-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Chord Explorer</p>
          <h2>Find every playable position for any chord across the neck.</h2>
        </div>
      </div>

      {/* Input row */}
      <div className="chord-input-row">
        <div className="chord-input-wrap">
          <input
            className={`chord-input ${parseError ? 'has-error' : ''}`}
            type="text"
            placeholder="e.g. Cmaj7, Am, G7, F#m…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="none"
          />
          {parseError && <span className="chord-input-error">Unrecognised chord name</span>}
        </div>
        <button type="button" className="solid-button chord-search-btn" onClick={handleSubmit}>
          Find
        </button>
      </div>

      {/* Chord type reference pills */}
      <div className="chord-type-pills">
        <span className="helper-text">Quick select:</span>
        {EXAMPLE_CHORDS.map((name) => (
          <button
            key={name}
            type="button"
            className={`chord-pill ${submitted === name ? 'is-active' : ''}`}
            onClick={() => handleExample(name)}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Chord info strip */}
      {parsed && (
        <div className="chord-info-strip">
          <span className="chord-info-name">{parsed.displayName}</span>
          <span className="chord-info-label">{parsed.type.label}</span>
          <div className="chord-info-notes">
            {chordNotes.map((note, i) => (
              <span
                key={note}
                className={`chord-info-note ${i === 0 ? 'is-root' : ''}`}
              >
                {formatNote(note, accidentalPreference)}
              </span>
            ))}
          </div>
          <label className="chord-filter-toggle">
            <input
              type="checkbox"
              checked={filterRoot}
              onChange={(e) => setFilterRoot(e.target.checked)}
            />
            <span>Root in bass only</span>
          </label>
        </div>
      )}

      {/* Results */}
      {parsed && (
        <div className="chord-results-area">
          {filtered.length === 0 ? (
            <p className="helper-text chord-empty">
              No playable voicings found{filterRoot ? ' with root in bass' : ''} in this tuning.
            </p>
          ) : (
            <>
              <p className="helper-text chord-count">
                {filtered.length} voicing{filtered.length !== 1 ? 's' : ''} found
                {filterRoot ? ' · root-position bass' : ' · all inversions'}
              </p>
              <div className="chord-voicing-grid">
                {filtered.map((v, idx) => (
                  <VoicingCard
                    key={v.id}
                    voicing={v}
                    tuning={tuning}
                    root={parsed.root}
                    accidentalPreference={accidentalPreference}
                    isStandard={idx === 0 && hasStandardShape}
                    isPowerChord={parsed.type.id === '5'}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Common shapes library — always visible when no search is active */}
      {!parsed && (
        <CommonShapes activeQuery={submitted} onSelect={handleExample} />
      )}
    </section>
  );
}

// ── Common Shapes library ────────────────────────────────────────────────────

interface CommonShapesProps {
  activeQuery: string;
  onSelect: (name: string) => void;
}

const STANDARD_TUNING = COMMON_TUNINGS[0]!.tuning;

function CommonShapes({ activeQuery, onSelect }: CommonShapesProps) {
  return (
    <div className="common-shapes">
      <div className="common-shapes-header">
        <p className="eyebrow">Common Chord Shapes</p>
        <span className="helper-text">Standard open &amp; barre shapes · click any shape to explore all positions</span>
      </div>
      {PRESET_CATEGORIES.map((cat) => (
        <div key={cat.label} className="preset-category">
          <span className="preset-category-label">{cat.label}</span>
          <div className="preset-shape-row">
            {cat.shapes.map((shape) => (
              <button
                key={shape.name}
                type="button"
                className={`preset-shape-card ${activeQuery === shape.chordQuery ? 'is-active' : ''}`}
                onClick={() => onSelect(shape.chordQuery)}
                title={shape.name}
              >
                <div className="preset-diagram">
                  <ChordDiagram frets={shape.frets} stringTuning={STANDARD_TUNING} root={shape.root} />
                </div>
                <span className="preset-shape-name">{shape.name}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Voicing card ─────────────────────────────────────────────────────────────

interface VoicingCardProps {
  voicing: ChordVoicing;
  tuning: PitchClass[];
  root: PitchClass;
  accidentalPreference: AccidentalPreference;
  isStandard?: boolean;
  isPowerChord?: boolean;
}

function VoicingCard({ voicing, tuning, root, accidentalPreference, isStandard, isPowerChord }: VoicingCardProps) {
  const posLabel = voicing.frets.some((f) => f === 0) ? 'Open' : `Fr. ${voicing.minFret}`;
  const uniqueNotes = [...new Set(voicing.notesPlayed)];

  return (
    <div className={`voicing-card${isStandard ? ' voicing-card-standard' : ''}`}>
      <div className="voicing-diagram">
        <ChordDiagram
          frets={voicing.frets}
          stringTuning={tuning}
          root={root}
        />
      </div>
      <div className="voicing-meta">
        {isStandard
          ? <span className="voicing-standard-label">Standard Shape</span>
          : isPowerChord
            ? <span className="voicing-power-label">Power Chord</span>
            : <><span className="voicing-pos">{posLabel}</span><span className="voicing-inv">{voicing.inversionLabel}</span></>
        }
      </div>
      <div className="voicing-notes">
        {uniqueNotes.map((note) => (
          <span
            key={note}
            className={`voicing-note-pill ${note === root ? 'is-root' : ''}`}
          >
            {formatNote(note, accidentalPreference)}
          </span>
        ))}
      </div>
      <div className="voicing-fret-numbers">
        {voicing.frets.map((f, i) => (
          <span key={i} className="voicing-fret-num">
            {f === null ? '×' : f === 0 ? 'o' : f}
          </span>
        ))}
      </div>
    </div>
  );
}
