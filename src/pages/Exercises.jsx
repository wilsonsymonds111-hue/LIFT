import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
import { Search } from 'lucide-react';
import { ALL_EXERCISES, MUSCLES } from '../lib/exercises';
import { base44 } from '@/api/base44Client';
import ProfileButton from '../components/ProfileButton';
import ExerciseList from '../components/ExerciseList';

const ExerciseDetailModal = lazy(() => import('../components/ExerciseDetailModal'));

const SAFE_AREA_PT = { paddingTop: 'calc(1.25rem + env(safe-area-inset-top))' };

export default function Exercises() {
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('All');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseHistory, setExerciseHistory] = useState({});

  const handleSelectExercise = useCallback((ex) => {
    setSelectedExercise(ex);
  }, []);

  useEffect(() => {
    base44.entities.Exercise.list('name', 500).then(results => {
      const map = {};
      (results || []).forEach(ex => {
        if (ex.history?.length > 0) {
          map[ex.name] = ex.history
            .map(h => ({ v: h.reps || 0, date: h.date ? new Date(h.date) : null }))
            .sort((a, b) => (a.date || 0) - (b.date || 0));
        }
      });
      setExerciseHistory(map);
    });
  }, []);

  const filtered = useMemo(() => {
    return ALL_EXERCISES.filter(ex => {
      const matchSearch = !search.trim() || ex.name.toLowerCase().includes(search.toLowerCase());
      const matchMuscle = muscleFilter === 'All' || ex.muscle === muscleFilter;
      return matchSearch && matchMuscle;
    });
  }, [search, muscleFilter]);

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
    <div className="min-h-screen bg-background pb-24">
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
            onChange={e => setSearch(e.target.value)}
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

      <ExerciseList grouped={grouped} exerciseHistory={exerciseHistory} onSelectExercise={handleSelectExercise} />

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