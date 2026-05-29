import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RotateCcw, Link2, MoreHorizontal, Check } from 'lucide-react';

function useTimer() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function SetRow({ setNum, previous, onComplete }) {
  const [kg, setKg] = useState(previous?.kg ?? '');
  const [reps, setReps] = useState(previous?.reps ?? '');
  const [done, setDone] = useState(false);

  return (
    <div className={`grid grid-cols-[40px_1fr_80px_80px_40px] items-center gap-1 py-2 px-1 rounded-lg transition ${done ? 'bg-green-50' : ''}`}>
      <span className="text-sm font-semibold text-center text-gray-500">{setNum}</span>
      <span className="text-sm text-gray-400 text-center">
        {previous ? `${previous.kg} kg × ${previous.reps}` : '—'}
      </span>
      <input
        type="number"
        value={kg}
        onChange={e => setKg(e.target.value)}
        placeholder="—"
        className="bg-gray-100 rounded-lg text-center text-sm font-semibold py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <input
        type="number"
        value={reps}
        onChange={e => setReps(e.target.value)}
        placeholder="—"
        className="bg-gray-100 rounded-lg text-center text-sm font-semibold py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button
        onClick={() => { setDone(d => !d); onComplete?.(); }}
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}
      >
        <Check className="w-4 h-4" />
      </button>
    </div>
  );
}

function ExerciseSection({ exercise }) {
  const [sets, setSets] = useState([{ id: 1 }]);

  const prev = exercise.history
    ? { kg: exercise.history[exercise.history.length - 1], reps: 8 }
    : null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-blue-500 font-semibold text-base">{exercise.name}</h3>
        <div className="flex items-center gap-3">
          <Link2 className="w-4 h-4 text-blue-400" />
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[40px_1fr_80px_80px_40px] text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1 gap-1">
        <span className="text-center">Set</span>
        <span className="text-center">Previous</span>
        <span className="text-center">kg</span>
        <span className="text-center">Reps</span>
        <span></span>
      </div>

      {sets.map((s, i) => (
        <SetRow key={s.id} setNum={i + 1} previous={prev} />
      ))}

      <button
        onClick={() => setSets(prev => [...prev, { id: Date.now() }])}
        className="mt-2 w-full py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-600 transition"
      >
        + Add Set
      </button>
    </div>
  );
}

export default function Workout() {
  const location = useLocation();
  const navigate = useNavigate();
  const template = location.state?.template;
  const timer = useTimer();
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  if (!template) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition"
        >
          <RotateCcw className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition"
        >
          Finish
        </button>
      </div>

      <div className="px-4 pt-4">
        {/* Title */}
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
          <MoreHorizontal className="w-5 h-5 text-blue-400" />
        </div>

        {/* Date & Timer */}
        <p className="text-sm text-gray-500 mb-0.5">📅 {today}</p>
        <p className="text-sm text-gray-500 mb-4">🕐 {timer}</p>

        {/* Note */}
        <input
          placeholder="Note"
          className="w-full text-sm text-gray-400 mb-6 focus:outline-none border-b border-transparent focus:border-gray-200 pb-1"
        />

        {/* Exercises */}
        {template.exerciseList?.map((exercise, idx) => (
          <ExerciseSection key={idx} exercise={exercise} />
        ))}
      </div>
    </div>
  );
}