import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { MUSCLES } from '@/lib/exercises';
import { getAllExercises } from '@/lib/customExercises';

export default function NewTemplate() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('All');

  const allExercises = useMemo(() => getAllExercises(), []);

  const filtered = useMemo(() => {
    return allExercises.filter(ex => {
      const matchSearch = !search.trim() || ex.name.toLowerCase().includes(search.toLowerCase());
      const matchMuscle = muscleFilter === 'All' || ex.muscle === muscleFilter;
      return matchSearch && matchMuscle;
    });
  }, [allExercises, search, muscleFilter]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(ex => {
      const letter = ex.name[0].toUpperCase();
      if (!map[letter]) map[letter] = [];
      map[letter].push(ex);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const isSelected = (name) => selected.some(e => e.name === name);

  const toggle = (ex) => {
    setSelected(prev =>
      prev.some(e => e.name === ex.name)
        ? prev.filter(e => e.name !== ex.name)
        : [...prev, ex]
    );
  };

  const handleSave = async () => {
    const templateName = name.trim() || 'New Template';
    const exerciseList = selected.map(e => ({ ...e, sets: 1, history: [] }));
    await base44.entities.WorkoutTemplate.create({
      name: templateName,
      exercises: exerciseList.length > 0 ? exerciseList.map(e => e.name).join(', ') : 'No exercises yet',
      exerciseList,
      lastPerformed: null,
    });
    navigate('/', { replace: true });
  };

  return (
    <div className="flex flex-col bg-background min-h-screen" style={{ paddingTop: 'env(safe-area-inset-top)' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border flex-shrink-0">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-muted hover:bg-muted/80 transition">
          <X className="w-4 h-4 text-gray-700" />
        </button>
        <span className="font-bold text-base text-foreground">New Template</span>
        <button
          onClick={handleSave}
          disabled={selected.length === 0}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition"
        >
          Save{selected.length > 0 ? ` (${selected.length})` : ''}
        </button>
      </div>

      {/* Template name */}
      <div className="px-4 pt-4 pb-1 flex-shrink-0">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Template name…"
          className="text-2xl font-extrabold text-gray-900 bg-transparent focus:outline-none w-full placeholder-gray-300"
        />
      </div>

      {/* Search */}
      <div className="px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search exercises…"
            className="bg-transparent text-sm flex-1 focus:outline-none text-gray-800"
          />
          {search.length > 0 && (
            <button onClick={() => setSearch('')}>
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Muscle chips */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto flex-shrink-0">
        {MUSCLES.map(m => (
          <button
            key={m}
            onClick={() => setMuscleFilter(m)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              muscleFilter === m ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="pb-10">
        {grouped.map(([letter, exs]) => (
          <div key={letter}>
            <div className="px-4 py-1 bg-muted text-xs font-bold text-muted-foreground uppercase tracking-widest sticky top-0">
              {letter}
            </div>
            {exs.map(ex => {
              const sel = isSelected(ex.name);
              return (
                <button
                  key={ex.name}
                  onClick={() => toggle(ex)}
                  className={`w-full flex items-center justify-between px-4 py-3 border-b border-border transition text-left ${sel ? 'bg-blue-50 dark:bg-blue-950' : 'bg-background active:bg-muted'}`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${sel ? 'text-blue-600' : 'text-gray-900'}`}>{ex.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{ex.muscle}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 ${sel ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                    {sel && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-10">No exercises found</p>
        )}
      </div>
    </div>
  );
}