import { useState, useMemo, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { Search } from 'lucide-react';
import { MUSCLES } from '../lib/exercises';
import { getAllExercises } from '../lib/customExercises';
import { base44 } from '@/api/base44Client';
import { getExerciseDetailList } from '../lib/exerciseCache';
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

  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 100);
  }, []);

  const handleSelectExercise = useCallback((ex) => {
    setSelectedExercise(ex);
  }, []);

  useEffect(() => {
    Promise.all([
      base44.entities.Exercise.list('name', 200),
      getExerciseDetailList(),
    ]).then(([exerciseResults, detailResults]) => {
      const historyMap = {};
      (exerciseResults || []).forEach(ex => {
        if (ex.history?.length > 0) {
          historyMap[ex.name] = ex.history
            .map(h => ({ v: h.reps || 0, date: h.date ? new Date(h.date) : null }))
            .sort((a, b) => (a.date || 0) - (b.date || 0));
        }
      });
      setExerciseHistory(historyMap);

      const imageMap = {};
      (detailResults || []).forEach(d => {
        if (d.image_url) imageMap[d.name] = d.image_url;
      });
      setExerciseImages(imageMap);
    });
  }, []);

  const allExercises = useMemo(() => getAllExercises(), []);
  
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return allExercises.filter(ex => {
      const matchSearch = !q || ex.name.toLowerCase().includes(q);
      const matchMuscle = muscleFilter === 'All' || ex.muscle === muscleFilter;
      return matchSearch && matchMuscle;
    });
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



  return (
    <div className="bg-background pb-24">
      {/* Header */}
      <div className="px-4 pb-3 flex items-center justify-between" style={SAFE_AREA_PT}>
        <h1 className="text-3xl font-extrabold text-foreground leading-tight">Exercises</h1>
        <ProfileButton />
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search"
            className="bg-transparent text-sm flex-1 focus:outline-none text-foreground placeholder:text-muted-foreground"
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
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                active
                  ? 'bg-blue-500 text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {m}
            </button>
          );
        })}
      </div>

      <ExerciseList grouped={grouped} exerciseHistory={exerciseHistory} exerciseImages={exerciseImages} onSelectExercise={handleSelectExercise} />

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