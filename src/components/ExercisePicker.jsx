import { useState, useMemo, useEffect } from 'react';
import { X, Search, Plus, Dumbbell } from 'lucide-react';
import { getAllExercises, saveCustomExercise } from '../lib/customExercises';
import { ALL_EXERCISES, EXERCISE_ALIASES } from '../lib/exercises';
import { getExerciseDetailList } from '../lib/exerciseCache';
import ExerciseDetailModal from './ExerciseDetailModal';

// Tracks the visible viewport height — shrinks when the mobile keyboard opens
function useVisualViewportHeight() {
  const [height, setHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setHeight(vv.height);
    vv.addEventListener('resize', update);
    return () => vv.removeEventListener('resize', update);
  }, []);
  return height;
}

const MUSCLES = ['All', 'Arms', 'Back', 'Chest', 'Core', 'Full Body', 'Legs', 'Shoulders', 'Other'];

// Auto-detect muscle from exercise name via keyword matching
function detectMuscle(name) {
  const lower = name.toLowerCase();
  if (/\b(chest|pec|fly|press)(?=\b|$)/.test(lower)) return 'Chest';
  if (/\b(back|row|lats?|pulldown|pull.?up|chin.?up|deadlift|good.?morning)\b/.test(lower)) return 'Back';
  if (/\b(shoulder|delt|raise|upright|arnold|face.?pull)\b/.test(lower)) return 'Shoulders';
  if (/\b(leg|squat|lunge|curl|extension|calf|glute|hip|step.?up|sissy)\b/.test(lower)) return 'Legs';
  if (/\b(bicep|tricep|curl|arm|skull|crusher|dip|pushdown|hammer|wrist|zottman|jm.?press)\b/.test(lower)) return 'Arms';
  if (/\b(core|ab|cruch|plank|sit.?up|leg.?raise|dead.?bug|hollow|pallof|russian|v.?up)\b/.test(lower)) return 'Core';
  if (/\b(burpee|clean|snatch|thruster|swing|sled|battle|farmer|turkish)\b/.test(lower)) return 'Full Body';
  return 'Other';
}

export default function ExercisePicker({ onClose, onAdd }) {
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('All');
  const [selected, setSelected] = useState([]);
  // Show built-in exercises instantly — custom exercises merge in when loaded
  const [exercises, setExercises] = useState(ALL_EXERCISES);
  const [imageMap, setImageMap] = useState({});
  const [detailExercise, setDetailExercise] = useState(null);
  const viewportHeight = useVisualViewportHeight();

  // Fetch built-in + custom exercises AND library details (ExerciseDetail) in
  // parallel, then merge into a single list. Doing both in one effect avoids a
  // race condition where getAllExercises() resolves last and overwrites the
  // library exercises merged by the detail fetch.
  useEffect(() => {
    Promise.all([
      getAllExercises(),
      getExerciseDetailList().catch(() => []),
    ]).then(([all, details]) => {
      const map = {};
      (details || []).forEach(d => {
        if (d.image_url) map[d.name.toLowerCase()] = d.image_url;
      });
      setImageMap(map);

      const existing = new Set(all.map(e => e.name.toLowerCase()));
      const fromDetails = (details || [])
        .filter(d => !existing.has(d.name.toLowerCase()))
        .map(d => ({ name: d.name, muscle: detectMuscle(d.name) }));
      setExercises(fromDetails.length ? [...all, ...fromDetails] : all);
    });
  }, []);

  const filtered = useMemo(() => {
    return exercises.filter(ex => {
      const nameLower = ex.name.toLowerCase();
      const alias = EXERCISE_ALIASES[nameLower]?.toLowerCase() || '';
      const searchLower = search.toLowerCase();
      const matchesSearch = nameLower.includes(searchLower) || alias.includes(searchLower);
      const matchesMuscle = muscleFilter === 'All' || ex.muscle === muscleFilter;
      return matchesSearch && matchesMuscle;
    });
  }, [search, muscleFilter, exercises]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(ex => {
      const letter = ex.name[0].toUpperCase();
      if (!map[letter]) map[letter] = [];
      map[letter].push(ex);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const toggle = (name) => {
    setSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const handleAdd = () => {
    const toAdd = exercises.filter(ex => selected.includes(ex.name));
    onAdd(toAdd);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-t-3xl w-full flex flex-col shadow-2xl" style={{ maxHeight: `${viewportHeight * 0.9}px`, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
            <X className="w-4 h-4 text-foreground" />
          </button>
          <span className="font-bold text-foreground">Add Exercises</span>
          <button
            onClick={handleAdd}
            disabled={selected.length === 0}
            className={`px-4 py-1.5 rounded-xl text-sm font-bold transition ${selected.length > 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}
          >
            Add{selected.length > 0 ? ` (${selected.length})` : ''}
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search"
              className="bg-transparent text-sm flex-1 focus:outline-none text-foreground"
            />
          </div>
        </div>

        {/* Muscle Filter */}
        <div className="px-4 py-3 flex gap-2 overflow-x-auto flex-shrink-0" style={{scrollbarWidth:'none', msOverflowStyle:'none'}}>
          {MUSCLES.map(m => (
            <button
              key={m}
              onClick={() => setMuscleFilter(m)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                muscleFilter === m
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-card text-foreground border-border'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto pb-24">
          {grouped.map(([letter, exercises]) => (
            <div key={letter}>
              <div className="px-4 py-1 bg-muted text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {letter}
              </div>
              {exercises.map((ex) => {
                const isSelected = selected.includes(ex.name);
                return (
                  <button
                    key={ex.name}
                    onClick={() => toggle(ex.name)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border transition ${isSelected ? 'bg-blue-50 dark:bg-blue-950' : 'bg-card'}`}
                  >
                    <div className="flex items-center gap-3 text-left flex-1 min-w-0">
                      <div
                        onClick={(e) => { e.stopPropagation(); setDetailExercise(ex); }}
                        className="w-11 h-11 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0 cursor-pointer"
                      >
                        {imageMap[ex.name.toLowerCase()] ? (
                          <img src={imageMap[ex.name.toLowerCase()]} alt={ex.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <Dumbbell className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-600' : 'text-foreground'}`}>{ex.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{ex.muscle}</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-[11px] font-extrabold transition ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 text-transparent'}`}>
                      {selected.indexOf(ex.name) + 1}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}

          {/* Create custom exercise when no results found */}
          {search.trim().length > 0 && filtered.length === 0 && (
            <div className="px-4 pt-4 pb-2">
              <p className="text-sm text-gray-400 text-center mb-3">No results for "{search}"</p>
              <button
                onClick={async () => {
                  const titleName = search.trim().replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
                  const newEx = { name: titleName, muscle: detectMuscle(titleName) };
                  await saveCustomExercise(newEx);
                  setExercises(await getAllExercises());
                  onAdd([newEx]);
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl transition"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-blue-600">Create "{search.trim()}"</p>
                  <p className="text-xs text-blue-400">Add as a new exercise</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {detailExercise && (
        <ExerciseDetailModal
          exercise={detailExercise}
          initialImage={imageMap[detailExercise.name.toLowerCase()]}
          onClose={() => setDetailExercise(null)}
        />
      )}
    </div>
  );
}