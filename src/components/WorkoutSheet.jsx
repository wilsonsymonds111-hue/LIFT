import { useState, useEffect } from 'react';
import { RotateCcw, Link2, MoreHorizontal, Check, ChevronDown } from 'lucide-react';

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

function SetRow({ setNum, previous }) {
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
        onClick={() => setDone(d => !d)}
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

export default function WorkoutSheet({ template, onFinish }) {
  const [minimized, setMinimized] = useState(false);
  const timer = useTimer();
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  if (!template) return null;

  return (
    <>
      {/* Dim overlay behind sheet */}
      <div
        className={`fixed inset-0 z-30 transition-all duration-500 pointer-events-none ${minimized ? 'bg-black/20' : 'bg-black/50'}`}
      />

      {/* Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-3xl shadow-2xl transition-all duration-500 ease-in-out flex flex-col ${
          minimized ? 'h-20' : 'h-[95vh]'
        }`}
      >
        {/* Drag handle / tap to toggle */}
        <div
          className="flex justify-center pt-3 pb-1 cursor-pointer flex-shrink-0"
          onClick={() => setMinimized(m => !m)}
        >
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {minimized ? (
          /* Mini bar */
          <div className="flex items-center justify-between px-5 flex-1" onClick={() => setMinimized(false)}>
            <div>
              <p className="font-bold text-gray-900 text-sm">{template.name}</p>
              <p className="text-xs text-gray-400">{timer}</p>
            </div>
            <div className="flex items-center gap-3">
              <ChevronDown className="w-5 h-5 text-gray-400 rotate-180" />
              <button
                onClick={e => { e.stopPropagation(); onFinish(); }}
                className="px-4 py-1.5 bg-green-500 text-white text-sm font-semibold rounded-lg"
              >
                Finish
              </button>
            </div>
          </div>
        ) : (
          /* Full sheet content */
          <>
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 pt-2 pb-2 flex-shrink-0">
              <button
                onClick={() => setMinimized(true)}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl hover:bg-gray-200 transition"
              >
                <RotateCcw className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={onFinish}
                className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition"
              >
                Finish
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-2 pb-24">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
                <MoreHorizontal className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-sm text-gray-500 mb-0.5">📅 {today}</p>
              <p className="text-sm text-gray-500 mb-4">🕐 {timer}</p>
              <input
                placeholder="Note"
                className="w-full text-sm text-gray-400 mb-6 focus:outline-none border-b border-transparent focus:border-gray-200 pb-1"
              />
              {template.exerciseList?.map((exercise, idx) => (
                <ExerciseSection key={idx} exercise={exercise} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}