import { useEffect, useMemo, useRef, useState } from 'react';
import { CHROMATIC_SHARPS, formatNote, normalizeNoteName } from '../music/notes';
import { SCALE_CATEGORIES, SCALES, getScaleNotes } from '../music/scales';
import type { AccidentalPreference, PitchClass } from '../types';

interface ScaleSelectorProps {
  accidentalPreference: AccidentalPreference;
  onScaleSelect: (notes: PitchClass[], root: PitchClass, scaleName: string, scaleId: string) => void;
  onClear: () => void;
  initialRoot?: PitchClass;
  initialScaleId?: string;
}

interface QuickPick {
  label: string;
  root: PitchClass;
  scaleId: string;
}

const QUICK_PICKS: QuickPick[] = [
  { label: 'A Min Pent',  root: 'A', scaleId: 'minor-pentatonic' },
  { label: 'E Min Pent',  root: 'E', scaleId: 'minor-pentatonic' },
  { label: 'C Major',     root: 'C', scaleId: 'major' },
  { label: 'G Major',     root: 'G', scaleId: 'major' },
  { label: 'D Blues',     root: 'D', scaleId: 'blues' },
  { label: 'A Dorian',   root: 'A', scaleId: 'dorian' },
  { label: 'B Locrian',  root: 'B', scaleId: 'locrian' },
  { label: 'E Phrygian', root: 'E', scaleId: 'phrygian' },
];

const SCALE_CATEGORY_MAP = new Map<string, string>(
  SCALE_CATEGORIES.flatMap((cat) => cat.scales.map((s) => [s.id, cat.label])),
);

// Short aliases for common scale names so "pent", "min", "harm", etc. all work
const SCALE_ALIASES: Record<string, string[]> = {
  'major':            ['maj', 'ionian'],
  'natural-minor':    ['minor', 'min', 'aeolian', 'nat minor'],
  'harmonic-minor':   ['harm', 'harmonic'],
  'melodic-minor':    ['mel', 'melodic'],
  'dorian':           ['dor'],
  'phrygian':         ['phryg'],
  'lydian':           ['lyd'],
  'mixolydian':       ['mix', 'mixo'],
  'locrian':          ['loc'],
  'phrygian-dom':     ['phryg dom', 'spanish', 'phryg dominant'],
  'major-pentatonic': ['major pent', 'maj pent', 'pent major'],
  'minor-pentatonic': ['pent', 'pentatonic', 'minor pent', 'min pent', 'pent minor'],
  'blues':            ['blue'],
  'major-blues':      ['maj blues'],
  'whole-tone':       ['whole'],
  'dim-hw':           ['diminished', 'dim', 'half whole'],
  'dim-wh':           ['whole half'],
  'hungarian-minor':  ['hungarian', 'hung'],
  'double-harmonic':  ['byzantine', 'double harm'],
  'neapolitan-minor': ['neapolitan'],
};

function scaleMatchesQuery(scaleId: string, label: string, q: string): boolean {
  const tokens = q.split(/\s+/).filter(Boolean);
  const lLabel = label.toLowerCase();
  const aliases = (SCALE_ALIASES[scaleId] ?? []).map((a) => a.toLowerCase());
  // Every token must appear in the label or in at least one alias
  return tokens.every((token) => lLabel.includes(token) || aliases.some((a) => a.includes(token)));
}

export function ScaleSelector({ accidentalPreference, onScaleSelect, onClear, initialRoot, initialScaleId }: ScaleSelectorProps) {
  const [selectedRoot, setSelectedRoot] = useState<PitchClass | ''>(initialRoot ?? '');
  const [selectedScaleId, setSelectedScaleId] = useState(initialScaleId ?? '');
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedScale = useMemo(
    () => SCALES.find((s) => s.id === selectedScaleId) ?? null,
    [selectedScaleId],
  );

  const scaleNotes = useMemo(() => {
    if (!selectedRoot || !selectedScale) return [];
    return getScaleNotes(selectedRoot as PitchClass, selectedScale.intervals);
  }, [selectedRoot, selectedScale]);

  // Splits "C# pentatonic" → { root: 'C#', scalePart: 'pentatonic' }
  // Falls back to { root: null, scalePart: fullQuery } when no root is detected
  const parsedQuery = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return null;
    const m = q.match(/^([A-Ga-g][#b]?)\s+(.+)/);
    if (m) {
      const root = normalizeNoteName(m[1]!);
      const scalePart = m[2]!.trim();
      if (root) return { root, scalePart };
    }
    return { root: null, scalePart: q };
  }, [searchQuery]);

  const searchResults = useMemo(() => {
    if (!parsedQuery) return [];
    const q = parsedQuery.scalePart.toLowerCase();
    if (!q) return [];
    return SCALES.filter((s) => scaleMatchesQuery(s.id, s.label, q));
  }, [parsedQuery]);

  const isSearching = searchQuery.trim() !== '';
  const isActive = selectedRoot !== '' && selectedScaleId !== '';

  // What Enter would apply: first result + best available root
  const enterPreview = useMemo(() => {
    if (!isSearching || searchResults.length === 0) return null;
    const scale = searchResults[0]!;
    const root = parsedQuery?.root ?? (selectedRoot || null);
    if (!root) return null;
    return { scale, root };
  }, [isSearching, searchResults, parsedQuery, selectedRoot]);

  function applyScale(root: PitchClass, scaleId: string) {
    const scale = SCALES.find((s) => s.id === scaleId);
    if (!scale) return;
    const notes = getScaleNotes(root, scale.intervals);
    const name = `${formatNote(root, accidentalPreference)} ${scale.label}`;
    onScaleSelect(notes, root, name, scaleId);
  }

  // Fire onScaleSelect once on mount when seeded from a URL so App.tsx gets
  // activeScale populated without the user having to touch the dropdowns.
  useEffect(() => {
    if (initialRoot && initialScaleId) applyScale(initialRoot, initialScaleId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRootChange(value: string) {
    setSelectedRoot(value as PitchClass | '');
    if (value && selectedScaleId) applyScale(value as PitchClass, selectedScaleId);
  }

  function handleScaleChange(value: string) {
    setSelectedScaleId(value);
    if (selectedRoot && value) applyScale(selectedRoot as PitchClass, value);
  }

  function handleSearchSelect(scaleId: string, root?: PitchClass) {
    const effectiveRoot = root ?? (selectedRoot as PitchClass | '') as PitchClass | undefined;
    setSelectedScaleId(scaleId);
    if (root) setSelectedRoot(root);
    setSearchQuery('');
    if (effectiveRoot) applyScale(effectiveRoot, scaleId);
    searchRef.current?.blur();
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && enterPreview) {
      e.preventDefault();
      handleSearchSelect(enterPreview.scale.id, enterPreview.root);
    }
    if (e.key === 'Escape') {
      setSearchQuery('');
      searchRef.current?.blur();
    }
  }

  function handleQuickPick(pick: QuickPick) {
    setSelectedRoot(pick.root);
    setSelectedScaleId(pick.scaleId);
    applyScale(pick.root, pick.scaleId);
  }

  function handleClear() {
    setSelectedRoot('');
    setSelectedScaleId('');
    setSearchQuery('');
    onClear();
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Scale Library</p>
          <h2>Pick a root and scale type to highlight every note across the fretboard.</h2>
        </div>
      </div>

      {/* Search */}
      <div className="scale-search-wrap">
        <input
          ref={searchRef}
          className="scale-search-input"
          type="text"
          placeholder='Search — try "A pentatonic", "C# dorian", "blues"…'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="none"
        />
        {isSearching && (
          <button
            type="button"
            className="scale-search-clear"
            onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Enter-to-apply hint */}
      {enterPreview && (
        <p className="scale-enter-hint">
          Press <kbd>Enter</kbd> to apply{' '}
          <strong>
            {formatNote(enterPreview.root, accidentalPreference)} {enterPreview.scale.label}
          </strong>
        </p>
      )}

      {/* Search results */}
      {isSearching && (
        <div className="scale-search-results">
          {searchResults.length === 0 ? (
            <p className="scale-search-empty helper-text">
              No scales match "{parsedQuery?.scalePart}"
              {!parsedQuery?.root && selectedRoot === '' && ' — try prefixing with a root note, e.g. "A blues"'}
            </p>
          ) : (
            searchResults.map((scale) => (
              <button
                key={scale.id}
                type="button"
                className={`scale-search-result ${selectedScaleId === scale.id ? 'is-selected' : ''}`}
                onClick={() => handleSearchSelect(scale.id, parsedQuery?.root ?? undefined)}
              >
                <span className="scale-result-name">{scale.label}</span>
                <span className="scale-result-category">{SCALE_CATEGORY_MAP.get(scale.id)}</span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Dropdowns */}
      <div className="scale-controls">
        <label className="field">
          <span>Root note</span>
          <select value={selectedRoot} onChange={(e) => handleRootChange(e.target.value)}>
            <option value="" disabled>Root…</option>
            {CHROMATIC_SHARPS.map((note) => (
              <option key={note} value={note}>
                {formatNote(note, accidentalPreference)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Scale</span>
          <select value={selectedScaleId} onChange={(e) => handleScaleChange(e.target.value)}>
            <option value="" disabled>Select scale…</option>
            {SCALE_CATEGORIES.map((cat) => (
              <optgroup key={cat.label} label={cat.label}>
                {cat.scales.map((scale) => (
                  <option key={scale.id} value={scale.id}>
                    {scale.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      {/* Active scale preview */}
      {isActive && selectedScale && (
        <div className="scale-preview">
          <span className="scale-preview-name">
            {formatNote(selectedRoot as PitchClass, accidentalPreference)} {selectedScale.label}
          </span>
          <span className="scale-preview-count">{scaleNotes.length} notes</span>
          <div className="scale-preview-notes">
            {scaleNotes.map((note, i) => (
              <span key={note} className={`chord-info-note ${i === 0 ? 'is-root' : ''}`}>
                {formatNote(note, accidentalPreference)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick picks (hidden while searching) */}
      {!isSearching && (
        <div className="scale-quick-section">
          <span className="helper-text">Quick select:</span>
          <div className="scale-quick-picks">
            {QUICK_PICKS.map((pick) => {
              const active = selectedRoot === pick.root && selectedScaleId === pick.scaleId;
              return (
                <button
                  key={pick.label}
                  type="button"
                  className={`chord-pill ${active ? 'is-active' : ''}`}
                  onClick={() => handleQuickPick(pick)}
                >
                  {pick.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="scale-action-row">
        <button
          type="button"
          className="ghost-button"
          onClick={handleClear}
          disabled={!isActive && !isSearching}
        >
          Clear scale
        </button>
        <p className="helper-text">
          {isActive
            ? `${scaleNotes.length} notes highlighted on the fretboard.`
            : 'Select a root note and scale type above.'}
        </p>
      </div>
    </section>
  );
}
