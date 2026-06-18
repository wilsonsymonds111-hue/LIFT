import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Search } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { ALL_EXERCISES, MUSCLES, MUSCLE_COLORS } from '../lib/exercises';
import { base44 } from '@/api/base44Client';
import ProfileButton from '../components/ProfileButton';
import ExerciseDetailModal from '../components/ExerciseDetailModal';

const HollowDot = (props) => {
  const { cx, cy } = props;
  return <circle cx={cx} cy={cy} r={3} fill="white" stroke="#3b82b6" strokeWidth={1.5} />;
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const SAFE_AREA_PT = { paddingTop: 'calc(1.25rem + env(safe-area-inset-top))' };

export default function Exercises() {
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('All');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseHistory, setExerciseHistory] = useState({});
  const sectionRefs = useRef({});

  useEffect(() => {
    base44.entities.WorkoutTemplate.list('sort_order', 200).then(results => {
      const map = {};
      (results || []).forEach(t => {
        (t.exerciseList || []).forEach(e => {
          if (e.history?.length > 0) {
            const name = e.name;
            if (!map[name]) map[name] = [];
            e.history.forEach(h => {
              const kg = typeof h === 'object' ? (h.kg || 0) : (h || 0);
              const date = typeof h === 'object' && h.date ? new Date(h.date) : null;
              map[name].push({ v: kg, date });
            });
          }
        });
      });
      // Sort each exercise's history by date
      Object.keys(map).forEach(name => {
        map[name].sort((a, b) => (a.date || 0) - (b.date || 0));
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

  const availableLetters = useMemo(() => grouped.map(([l]) => l), [grouped]);

  const scrollToLetter = useCallback((letter) => {
    const el = sectionRefs.current[letter];
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

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

      {/* Exercise list with side index */}
      <div className="relative">
        <div className="pl-4 pr-10">
          {grouped.map(([letter, exs]) => (
            <div key={letter} ref={el => sectionRefs.current[letter] = el}>
              <div className="py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-background sticky top-0">
                {letter}
              </div>
              {exs.map(ex => {
                const colors = MUSCLE_COLORS[ex.muscle] || MUSCLE_COLORS['Full Body'];
                const historyData = exerciseHistory[ex.name];
                const chartData = historyData?.slice(-6).map(h => ({ v: h.v })) || [];

                return (
                  <div
                    key={ex.name}
                    onClick={() => setSelectedExercise(ex)}
                    className="flex items-center gap-3 py-2.5 border-b border-border/50 cursor-pointer active:bg-muted/50 transition"
                  >
                    {/* Letter avatar */}
                    <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-sm font-bold ${colors.text}`}>{ex.name[0]}</span>
                    </div>

                    {/* Name + muscle */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{ex.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ex.muscle}</p>
                    </div>

                    {/* Mini sparkline — matches workout modal style */}
                    {chartData.length > 0 && (
                      <div className="w-16 h-8 ml-auto flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <Line type="monotone" dataKey="v" stroke="#3b82b6" strokeWidth={2} dot={<HollowDot />} animationDuration={300} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {grouped.length === 0 && (
            <p className="text-center text-muted-foreground text-sm mt-10">No exercises found</p>
          )}
        </div>

        {/* Alphabetical side index */}
        {availableLetters.length > 0 && (
          <div className="fixed right-1 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 z-30">
            {LETTERS.map(l => {
              const exists = availableLetters.includes(l);
              return (
                <button
                  key={l}
                  onClick={() => exists && scrollToLetter(l)}
                  className={`text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-sm transition ${
                    exists
                      ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950'
                      : 'text-muted-foreground/30'
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </div>
  );
}