import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import ExercisePicker from '../components/ExercisePicker';
import { base44 } from '@/api/base44Client';

export default function NewTemplate() {
  const navigate = useNavigate();
  const [name, setName] = useState('New Template');
  const [exerciseList, setExerciseList] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  const handleAddExercises = (exercises) => {
    setExerciseList(prev => {
      const existing = new Set(prev.map(e => e.name));
      const newOnes = exercises.filter(e => !existing.has(e.name)).map(e => ({ ...e, sets: 1, history: [] }));
      return [...prev, ...newOnes];
    });
    setShowPicker(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const template = {
      name: name.trim(),
      exercises: exerciseList.length > 0
        ? exerciseList.map(e => e.name).join(', ') + '...'
        : 'No exercises yet',
      exerciseList,
      lastPerformed: null,
    };
    await base44.entities.WorkoutTemplate.create(template);
    navigate('/', { replace: true });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-white">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-200 hover:bg-gray-300 transition">
            <X className="w-4 h-4 text-gray-700" />
          </button>
          <span className="font-bold text-base text-gray-900">New Template</span>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition"
          >
            Save
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-5">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="text-2xl font-extrabold text-gray-900 bg-transparent focus:outline-none w-full mb-6"
          />

          {exerciseList.map((ex, i) => (
            <div key={ex.name} className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{ex.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{ex.muscle}</p>
              </div>
              <button
                onClick={() => setExerciseList(prev => prev.filter((_, idx) => idx !== i))}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 transition"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          ))}

          <button
            onClick={() => setShowPicker(true)}
            className="mt-4 w-full py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-500 font-semibold rounded-xl text-sm transition"
          >
            Add Exercises
          </button>
        </div>
      </div>

      {showPicker && (
        <ExercisePicker onClose={() => exerciseList.length === 0 ? navigate(-1) : setShowPicker(false)} onAdd={handleAddExercises} />
      )}
    </>
  );
}