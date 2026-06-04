import { useState, useMemo } from 'react';
import { X, Search, Plus } from 'lucide-react';

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
  { name: 'Farmer\'s Walk', muscle: 'Full Body' },
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

export default function ExercisePicker({ onClose, onAdd }) {
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('All');
  const [selected, setSelected] = useState([]);

  const filtered = useMemo(() => {
    return ALL_EXERCISES.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      const matchesMuscle = muscleFilter === 'All' || ex.muscle === muscleFilter;
      return matchesSearch && matchesMuscle;
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

  const toggle = (name) => {
    setSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const handleAdd = () => {
    const exercises = ALL_EXERCISES.filter(ex => selected.includes(ex.name));
    onAdd(exercises);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">
            <X className="w-4 h-4 text-gray-700" />
          </button>
          <span className="font-bold text-gray-900">Add Exercises</span>
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
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search"
              className="bg-transparent text-sm flex-1 focus:outline-none text-gray-700"
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
                  : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto pb-6">
          {grouped.map(([letter, exercises]) => (
            <div key={letter}>
              <div className="px-4 py-1 bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-widest">
                {letter}
              </div>
              {exercises.map((ex) => {
                const isSelected = selected.includes(ex.name);
                return (
                  <button
                    key={ex.name}
                    onClick={() => toggle(ex.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 transition ${isSelected ? 'bg-blue-50' : 'bg-white'}`}
                  >
                    <div className="text-left">
                      <p className={`text-sm font-semibold ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>{ex.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{ex.muscle}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
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
                onClick={() => onAdd([{ name: search.trim(), muscle: 'Other' }])}
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
    </div>
  );
}