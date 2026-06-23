import { useState, useMemo, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { Search } from 'lucide-react';
import { MUSCLES } from '../lib/exercises';
import { getAllExercises, saveCustomExercise } from '../lib/customExercises';
import { findSimilarExercise, tokenMatchesName } from '../lib/exerciseSearch';
import NoResultsSuggestion from '../components/exercises/NoResultsSuggestion';
import CreateExerciseModal from '../components/exercises/CreateExerciseModal';
import { Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getExerciseDetailList } from '../lib/exerciseCache';
import { useExerciseHistory } from '../hooks/useExerciseHistory';
import ProfileButton from '../components/ProfileButton';
import ExerciseList from '../components/ExerciseList';

const ExerciseDetailModal = lazy(() => import('../components/ExerciseDetailModal'));

const SAFE_AREA_PT = { paddingTop: 'calc(1.25rem + env(safe-area-inset-top))' };

export default function Exercises() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef(null);
  const [muscleFilter, setMuscleFilter] = useState('All');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseHistory, setExerciseHistory] = useState({});
  const [exerciseImages, setExerciseImages] = useState({});
  const [customExercisesVersion, setCustomExercisesVersion] = useState(0);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 100);
  }, []);

  const handleSelectExercise = useCallback((ex) => {
    setSelectedExercise(ex);
  }, []);

  const { data: exerciseHistoryData = {} } = useExerciseHistory();

  useEffect(() => {
    const historyMap = {};
    Object.entries(exerciseHistoryData).forEach(([name, history]) => {
      if (history?.length > 0) {
        historyMap[name] = history
          .map(h => ({ v: h.reps || 0, kg: h.kg || 0, reps: h.reps || 0, date: h.date ? new Date(h.date) : null }))
          .sort((a, b) => (a.date || 0) - (b.date || 0));
      }
    });
    setExerciseHistory(historyMap);
  }, [exerciseHistoryData]);

  useEffect(() => {
    getExerciseDetailList().then(detailResults => {
      const imageMap = {};
      (detailResults || []).forEach(d => {
        if (d.image_url) imageMap[d.name] = d.image_url;
      });
      setExerciseImages(imageMap);
    });
  }, []);

  const allExercises = useMemo(() => getAllExercises(), [customExercisesVersion]);
  
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) {
      return allExercises.filter(ex => muscleFilter === 'All' || ex.muscle === muscleFilter);
    }
    // Token-based fuzzy search: every query word must match the exercise name.
    // Handles typos like "dumbell" → "dumbbell" via Levenshtein distance.
    // When searching, ignore the muscle filter so all matching exercises appear
    const queryTokens = q.split(/\s+/).filter(Boolean);
    return allExercises.filter(ex =>
      queryTokens.every(token => tokenMatchesName(token, ex.name))
    );
  }, [allExercises, debouncedSearch, muscleFilter]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(ex => {
      const letter = ex.name[0].toUpperCase();
      if (!map[letter]) map[letter] = [];
      map[letter].push(ex);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const suggestion = useMemo(() => {
    if (filtered.length > 0 || !debouncedSearch.trim()) return null;
    return findSimilarExercise(debouncedSearch, allExercises);
  }, [filtered.length, debouncedSearch, allExercises]);

  const handleSelectSuggestion = useCallback((ex) => {
    setSelectedExercise(ex);
  }, []);

  const handleCreateCustom = useCallback(async () => {
    const raw = debouncedSearch.trim();
    if (!raw) return;
    const capitalizedName = raw.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    setCreating(true);
    try {
      let muscle = 'Full Body';
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `What primary muscle group does the exercise "${capitalizedName}" target? Respond with exactly one word from: Arms, Back, Chest, Core, Full Body, Legs, Shoulders`,
          response_json_schema: {
            type: 'object',
            properties: { muscle: { type: 'string', enum: ['Arms', 'Back', 'Chest', 'Core', 'Full Body', 'Legs', 'Shoulders'] } },
            required: ['muscle'],
          },
        });
        muscle = res?.muscle || 'Full Body';
      } catch {}
      saveCustomExercise({ name: capitalizedName, muscle });
      setCustomExercisesVersion(v => v + 1);
      setSearch('');
      setDebouncedSearch('');
      setSelectedExercise({ name: capitalizedName, muscle });
    } catch (e) {
      console.error('Failed to create custom exercise:', e);
    } finally {
      setCreating(false);
    }
  }, [debouncedSearch]);

  const handleCreateFromModal = useCallback(async (rawName) => {
    const capitalizedName = rawName.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    setCreating(true);
    try {
      let muscle = 'Full Body';
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `What primary muscle group does the exercise "${capitalizedName}" target? Respond with exactly one word from: Arms, Back, Chest, Core, Full Body, Legs, Shoulders`,
          response_json_schema: {
            type: 'object',
            properties: { muscle: { type: 'string', enum: ['Arms', 'Back', 'Chest', 'Core', 'Full Body', 'Legs', 'Shoulders'] } },
            required: ['muscle'],
          },
        });
        muscle = res?.muscle || 'Full Body';
      } catch {}
      saveCustomExercise({ name: capitalizedName, muscle });
      setCustomExercisesVersion(v => v + 1);
      setShowCreateModal(false);
      setSelectedExercise({ name: capitalizedName, muscle });
    } catch (e) {
      console.error('Failed to create custom exercise:', e);
    } finally {
      setCreating(false);
    }
  }, []);

  return (
    <div className="health-gradient pb-24">
      {/* Header */}
      <div className="px-4 pb-3 flex items-center justify-between" style={SAFE_AREA_PT}>
        <h1 className="text-3xl font-extrabold text-foreground leading-tight">Exercises</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-card text-blue-500 dark:text-blue-400 hover:scale-105 active:scale-95 transition-all duration-150 border border-gray-200/70 dark:border-border flex-shrink-0"
          >
            <Plus className="w-5 h-5" />
          </button>
          <ProfileButton />
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2.5 bg-white dark:bg-card rounded-2xl px-4 py-3 shadow-sm">
          <Search className="w-4 h-4 text-[#8e8e93] flex-shrink-0" strokeWidth={2} />
          <input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search exercises"
            className="bg-transparent text-sm flex-1 focus:outline-none text-foreground placeholder:text-[#8e8e93]"
          />
        </div>
      </div>

      {/* Muscle filter pills */}
      <div className="pl-4 pr-10 pb-3 flex gap-2 overflow-x-auto">
        {MUSCLES.map(m => {
          const active = muscleFilter === m;
          return (
            <button
              key={m}
              onClick={() => setMuscleFilter(m)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition border ${
                active
                  ? 'bg-white text-blue-500 border-blue-500 shadow-sm'
                  : 'bg-[#eef0f2] text-black border-transparent hover:bg-[#e4e6e8]'
              }`}
            >
              {m}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && debouncedSearch.trim() ? (
        <NoResultsSuggestion
          query={debouncedSearch}
          suggestion={suggestion}
          onSelectSuggestion={handleSelectSuggestion}
          onCreateCustom={handleCreateCustom}
          creating={creating}
        />
      ) : (
        <ExerciseList grouped={grouped} exerciseHistory={exerciseHistory} exerciseImages={exerciseImages} onSelectExercise={handleSelectExercise} />
      )}

      {showCreateModal && (
        <CreateExerciseModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateFromModal}
        />
      )}

      {selectedExercise && (
        <Suspense fallback={null}>
          <ExerciseDetailModal
            exercise={selectedExercise}
            onClose={() => setSelectedExercise(null)}
          />
        </Suspense>
      )}
    </div>
  );
}