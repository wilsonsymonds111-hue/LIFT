import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ALL_EXERCISES = [
  { name: 'Ab Wheel', muscle: 'Core' },
  { name: 'Arnold Press (Dumbbell)', muscle: 'Shoulders' },
  { name: 'Around the World', muscle: 'Chest' },
  { name: 'Back Extension', muscle: 'Back' },
  { name: 'Back Extension (Machine)', muscle: 'Back' },
  { name: 'Ball Slams', muscle: 'Full Body' },
  { name: 'Barbell Row', muscle: 'Back' },
  { name: 'Bench Press (Barbell)', muscle: 'Chest' },
  { name: 'Bench Press (Dumbbell)', muscle: 'Chest' },
  { name: 'Bicep Curl (Barbell)', muscle: 'Arms' },
  { name: 'Bicep Curl (Dumbbell)', muscle: 'Arms' },
  { name: 'Box Jump', muscle: 'Legs' },
  { name: 'Bulgarian Split Squat', muscle: 'Legs' },
  { name: 'Cable Fly', muscle: 'Chest' },
  { name: 'Cable Row', muscle: 'Back' },
  { name: 'Calf Raise (Machine)', muscle: 'Legs' },
  { name: 'Chest Dip', muscle: 'Chest' },
  { name: 'Chin Up', muscle: 'Back' },
  { name: 'Clean and Press', muscle: 'Full Body' },
  { name: 'Close Grip Bench Press', muscle: 'Arms' },
  { name: 'Crunch', muscle: 'Core' },
  { name: 'Dead Bug', muscle: 'Core' },
  { name: 'Deadlift (Barbell)', muscle: 'Back' },
  { name: 'Decline Bench Press', muscle: 'Chest' },
  { name: 'Dumbbell Fly', muscle: 'Chest' },
  { name: 'Face Pull', muscle: 'Shoulders' },
  { name: "Farmer's Walk", muscle: 'Full Body' },
  { name: 'Front Raise', muscle: 'Shoulders' },
  { name: 'Front Squat', muscle: 'Legs' },
  { name: 'Glute Bridge', muscle: 'Legs' },
  { name: 'Goblet Squat', muscle: 'Legs' },
  { name: 'Good Morning', muscle: 'Back' },
  { name: 'Hack Squat', muscle: 'Legs' },
  { name: 'Hammer Curl', muscle: 'Arms' },
  { name: 'Hang Clean', muscle: 'Full Body' },
  { name: 'Hip Thrust (Barbell)', muscle: 'Legs' },
  { name: 'Incline Bench Press (Barbell)', muscle: 'Chest' },
  { name: 'Incline Bench Press (Dumbbell)', muscle: 'Chest' },
  { name: 'Incline Curl', muscle: 'Arms' },
  { name: 'Iso-Lateral Row (Machine)', muscle: 'Back' },
  { name: 'Jump Squat', muscle: 'Legs' },
  { name: 'Kettlebell Swing', muscle: 'Full Body' },
  { name: 'Lat Pulldown', muscle: 'Back' },
  { name: 'Lateral Raise (Dumbbell)', muscle: 'Shoulders' },
  { name: 'Lateral Raise (Machine)', muscle: 'Shoulders' },
  { name: 'Leg Curl (Machine)', muscle: 'Legs' },
  { name: 'Leg Extension (Machine)', muscle: 'Legs' },
  { name: 'Leg Press', muscle: 'Legs' },
  { name: 'Lunge (Barbell)', muscle: 'Legs' },
  { name: 'Lunge (Dumbbell)', muscle: 'Legs' },
  { name: 'Mountain Climber', muscle: 'Core' },
  { name: 'Overhead Press (Barbell)', muscle: 'Shoulders' },
  { name: 'Overhead Press (Dumbbell)', muscle: 'Shoulders' },
  { name: 'Pec Deck (Machine)', muscle: 'Chest' },
  { name: 'Plank', muscle: 'Core' },
  { name: 'Pull Up', muscle: 'Back' },
  { name: 'Pullover (Machine)', muscle: 'Back' },
  { name: 'Push Up', muscle: 'Chest' },
  { name: 'Rear Delt Fly', muscle: 'Shoulders' },
  { name: 'Romanian Deadlift (Barbell)', muscle: 'Legs' },
  { name: 'Romanian Deadlift (Dumbbell)', muscle: 'Legs' },
  { name: 'Russian Twist', muscle: 'Core' },
  { name: 'Seated Row (Machine)', muscle: 'Back' },
  { name: 'Shrug (Barbell)', muscle: 'Shoulders' },
  { name: 'Shrug (Dumbbell)', muscle: 'Shoulders' },
  { name: 'Side Lateral Raise', muscle: 'Shoulders' },
  { name: 'Single Arm Overhead Cable Extension', muscle: 'Arms' },
  { name: 'Skull Crusher', muscle: 'Arms' },
  { name: 'Smith Squat', muscle: 'Legs' },
  { name: 'Squat (Barbell)', muscle: 'Legs' },
  { name: 'Squat (Dumbbell)', muscle: 'Legs' },
  { name: 'Standing Calf Raise (Machine)', muscle: 'Legs' },
  { name: 'Standing Press', muscle: 'Shoulders' },
  { name: 'Step Up', muscle: 'Legs' },
  { name: 'Straight Arm Pulldown', muscle: 'Back' },
  { name: 'Sumo Deadlift', muscle: 'Legs' },
  { name: 'T-Bar Row', muscle: 'Back' },
  { name: 'Tricep Dip', muscle: 'Arms' },
  { name: 'Tricep Pushdown (Cable)', muscle: 'Arms' },
  { name: 'Tricep Single Arm Extension', muscle: 'Arms' },
  { name: 'Upright Row', muscle: 'Shoulders' },
  { name: 'V-Up', muscle: 'Core' },
  { name: 'Wide Grip Pull Up', muscle: 'Back' },
  { name: 'Wrist Curl', muscle: 'Arms' },
  { name: 'Zottman Curl', muscle: 'Arms' },
];

const MUSCLES = ['All', 'Arms', 'Back', 'Chest', 'Core', 'Full Body', 'Legs', 'Shoulders'];

export default function NewTemplate() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('All');

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
    <div className="fixed inset-0 flex flex-col bg-white overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top)' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-200 hover:bg-gray-300 transition">
          <X className="w-4 h-4 text-gray-700" />
        </button>
        <span className="font-bold text-base text-gray-900">New Template</span>
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
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
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
      <div className="flex-1 overflow-y-auto min-h-0">
        {grouped.map(([letter, exs]) => (
          <div key={letter}>
            <div className="px-4 py-1 bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-widest sticky top-0">
              {letter}
            </div>
            {exs.map(ex => {
              const sel = isSelected(ex.name);
              return (
                <button
                  key={ex.name}
                  onClick={() => toggle(ex)}
                  className={`w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 transition text-left ${sel ? 'bg-blue-50' : 'bg-white active:bg-gray-50'}`}
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