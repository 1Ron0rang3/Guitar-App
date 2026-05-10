import { useEffect, useMemo, useState } from 'react';
import { ChordExplorer } from './components/ChordExplorer';
import { Fretboard } from './components/Fretboard';
import { NoteSelector } from './components/NoteSelector';
import { ScaleSelector } from './components/ScaleSelector';
import { TuningSettings } from './components/TuningSettings';
import { useLocalStorage } from './hooks/useLocalStorage';
import { CHROMATIC_SHARPS, COMMON_TUNINGS, formatNote, normalizeNoteName } from './music/notes';
import type { AccidentalPreference, PitchClass } from './types';

const STORAGE_KEY = 'guitar-fretboard-scale-generator';
const THEME_KEY = 'guitar-fretboard-theme';
type PanelTab = 'notes' | 'scale' | 'controls' | 'chords';
const DEFAULT_SEVEN_STRING_LOW_NOTE: PitchClass = 'B';

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

interface StoredState {
  version?: number;
  selectedNotes: PitchClass[];
  tuning: PitchClass[];
  fretCount: number;
  showLabels: boolean;
  hideUnselected: boolean;
  accidentalPreference: AccidentalPreference;
  rootNote: PitchClass | null;
}

const defaultState: StoredState = {
  version: 3,
  selectedNotes: ['C', 'E', 'G'],
  tuning: ['E', 'A', 'D', 'G', 'B', 'E'],
  fretCount: 24,
  showLabels: true,
  hideUnselected: false,
  accidentalPreference: 'sharp',
  rootNote: 'C',
};

function App() {
  const [storedState, setStoredState] = useLocalStorage<StoredState>(STORAGE_KEY, defaultState);
  const [selectedNotes, setSelectedNotes] = useState<PitchClass[]>(storedState.selectedNotes);
  const [tuning, setTuning] = useState<PitchClass[]>(storedState.tuning);
  const [fretCount] = useState<number>(
    storedState.version !== defaultState.version ? defaultState.fretCount : storedState.fretCount,
  );
  const [showLabels, setShowLabels] = useState<boolean>(storedState.showLabels);
  const [hideUnselected, setHideUnselected] = useState<boolean>(storedState.hideUnselected);
  const [accidentalPreference, setAccidentalPreference] = useState<AccidentalPreference>(storedState.accidentalPreference);
  const [rootNote, setRootNote] = useState<PitchClass | null>(storedState.rootNote);
  const [activeTab, setActiveTab] = useState<PanelTab>('notes');
  const [activeScaleName, setActiveScaleName] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      const dark = stored !== null ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      return dark;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    try {
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch { /* ignore */ }
  }, [isDark]);

  useEffect(() => {
    setStoredState({
      version: defaultState.version,
      selectedNotes,
      tuning,
      fretCount,
      showLabels,
      hideUnselected,
      accidentalPreference,
      rootNote,
    });
  }, [
    accidentalPreference,
    fretCount,
    hideUnselected,
    rootNote,
    selectedNotes,
    setStoredState,
    showLabels,
    tuning,
  ]);

  const tuningDisplay = useMemo(
    () => tuning.map((note) => formatNote(note, accidentalPreference)).join(' '),
    [accidentalPreference, tuning],
  );
  const isSevenString = tuning.length === 7;

  function handleScaleSelect(notes: PitchClass[], root: PitchClass, scaleName: string) {
    setSelectedNotes(notes);
    setRootNote(root);
    setActiveScaleName(scaleName);
  }

  function toggleSelectedNote(note: PitchClass) {
    setActiveScaleName(null);
    const nextNotes = selectedNotes.includes(note)
      ? selectedNotes.filter((entry) => entry !== note)
      : [...selectedNotes, note];

    setSelectedNotes(nextNotes);

    if (rootNote === note && !nextNotes.includes(note)) {
      setRootNote(nextNotes[0] ?? null);
    }
  }

  function handleTuningStringChange(stringIndex: number, value: string) {
    const normalized = normalizeNoteName(value);
    if (!normalized) {
      return;
    }

    setTuning((current) => current.map((note, index) => (index === stringIndex ? normalized : note)));
  }

  function handlePresetChange(presetId: string) {
    const preset = COMMON_TUNINGS.find((item) => item.id === presetId);
    if (!preset) {
      return;
    }

    setTuning(isSevenString ? [tuning[0] ?? DEFAULT_SEVEN_STRING_LOW_NOTE, ...preset.tuning] : [...preset.tuning]);
  }

  function handleSevenStringToggle(enabled: boolean) {
    setTuning((current) => {
      if (enabled) {
        return current.length === 7 ? current : [DEFAULT_SEVEN_STRING_LOW_NOTE, ...current];
      }

      return current.length === 7 ? current.slice(1) : current;
    });
  }

  function handleSetRoot(note: PitchClass | null) {
    if (note && !selectedNotes.includes(note)) {
      setSelectedNotes((currentNotes) => [...currentNotes, note]);
    }

    setRootNote(note);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1 className="app-title">Fretboard Scale Generator</h1>
          <p className="app-subtitle">Map any scale or chord across the neck</p>
        </div>
        <div className="theme-toggle" role="group" aria-label="Color theme">
          <button
            type="button"
            className={`theme-btn ${!isDark ? 'is-active' : ''}`}
            onClick={() => setIsDark(false)}
            aria-label="Light mode"
          >
            <SunIcon />
          </button>
          <button
            type="button"
            className={`theme-btn ${isDark ? 'is-active' : ''}`}
            onClick={() => setIsDark(true)}
            aria-label="Dark mode"
          >
            <MoonIcon />
          </button>
        </div>
      </header>

      <section className="hero-stats">
        <div className="stat-card">
          <span>{activeScaleName ? 'Active scale' : 'Active notes'}</span>
          <strong>{activeScaleName ?? selectedNotes.length}</strong>
        </div>
        <div className="stat-card">
          <span>Current tuning</span>
          <strong>{tuningDisplay}</strong>
        </div>
        <div className="stat-card">
          <span>Root marker</span>
          <strong>{rootNote ? formatNote(rootNote, accidentalPreference) : 'None'}</strong>
        </div>
      </section>

      <section className="fretboard-stage">
        <div className="fretboard-wrap">
          <Fretboard
            tuning={tuning}
            fretCount={fretCount}
            selectedNotes={selectedNotes}
            rootNote={rootNote}
            showLabels={showLabels}
            hideUnselected={hideUnselected}
            accidentalPreference={accidentalPreference}
          />
        </div>
      </section>

      <section className="tabs-shell">
        <div className="tabs-row" role="tablist" aria-label="Generator settings">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'notes'}
            className={`tab-button ${activeTab === 'notes' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            Note Selection
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'scale'}
            className={`tab-button ${activeTab === 'scale' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('scale')}
          >
            Scale Library
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'controls'}
            className={`tab-button ${activeTab === 'controls' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('controls')}
          >
            Controls
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'chords'}
            className={`tab-button ${activeTab === 'chords' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('chords')}
          >
            Chord Finder
          </button>
        </div>

        <div className="tab-panel">
          {activeTab === 'notes' && (
            <NoteSelector
              selectedNotes={selectedNotes}
              rootNote={rootNote}
              onToggle={toggleSelectedNote}
              onSetRoot={handleSetRoot}
              onClear={() => {
                setSelectedNotes([]);
                setRootNote(null);
                setActiveScaleName(null);
              }}
              onSelectAll={() => {
                setSelectedNotes(CHROMATIC_SHARPS);
                setRootNote(rootNote ?? CHROMATIC_SHARPS[0]);
                setActiveScaleName(null);
              }}
            />
          )}

          {activeTab === 'scale' && (
            <ScaleSelector
              accidentalPreference={accidentalPreference}
              onScaleSelect={handleScaleSelect}
              onClear={() => {
                setSelectedNotes([]);
                setRootNote(null);
                setActiveScaleName(null);
              }}
            />
          )}

          {activeTab === 'controls' && (
            <TuningSettings
              tuning={tuning}
              isSevenString={isSevenString}
              showLabels={showLabels}
              hideUnselected={hideUnselected}
              selectedNotes={selectedNotes}
              accidentalPreference={accidentalPreference}
              onPresetChange={handlePresetChange}
              onStringChange={handleTuningStringChange}
              onSevenStringToggle={handleSevenStringToggle}
              onShowLabelsChange={setShowLabels}
              onHideUnselectedChange={setHideUnselected}
              onAccidentalPreferenceChange={setAccidentalPreference}
            />
          )}

          {activeTab === 'chords' && (
            <ChordExplorer
              tuning={tuning}
              accidentalPreference={accidentalPreference}
            />
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
