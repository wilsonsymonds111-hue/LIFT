import { useState, useEffect } from 'react';
import { X, RotateCcw, Link2, MoreHorizontal, Check, ChevronDown, Trophy } from 'lucide-react';

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

  const handleToggle = () => {
    const next = !done;
    setDone(next);
    if (next && kg && reps) {
      onComplete?.({ kg: parseFloat(kg), reps: parseInt(reps) });
    } else {
      onComplete?.(null);
    }
  };

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
        onClick={handleToggle}
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}
      >
        <Check className="w-4 h-4" />
      </button>
    </div>
  );
}

function ExerciseSection({ exercise, onBestSet }) {
  const [sets, setSets] = useState([{ id: 1 }]);
  const [bestKg, setBestKg] = useState(null);

  const prev = exercise.history
    ? { kg: exercise.history[exercise.history.length - 1], reps: 8 }
    : null;

  const handleSetComplete = (result) => {
    if (result && (!bestKg || result.kg > bestKg)) {
      setBestKg(result.kg);
      onBestSet?.(exercise.name, result.kg, exercise.history);
    }
  };

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
        <SetRow key={s.id} setNum={i + 1} previous={prev} onComplete={handleSetComplete} />
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

function SummaryScreen({ template, prs, onDone }) {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-start overflow-y-auto pb-12">
      {/* Big green checkmark */}
      <div className="w-full bg-green-500 flex flex-col items-center justify-center pt-16 pb-10">
        <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-4">
          <Check className="w-14 h-14 text-white stroke-[3]" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Workout Complete!</h1>
        <p className="text-green-100 mt-2 text-base">Great job finishing {template.name}!</p>
      </div>

      <div className="w-full max-w-md px-6 pt-8">
        {prs.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-bold text-gray-900">Personal Records 🎉</h2>
            </div>
            <div className="space-y-3">
              {prs.map((pr, i) => (
                <div key={i} className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{pr.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Previous best: {pr.prev} kg</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-yellow-600">{pr.kg} kg</p>
                    <p className="text-xs text-green-600 font-semibold">+{(pr.kg - pr.prev).toFixed(1)} kg</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">No new PRs this session — keep pushing!</p>
          </div>
        )}

        <button
          onClick={onDone}
          className="mt-10 w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl text-base transition"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export default function WorkoutSheet({ template, onFinish }) {
  const [minimized, setMinimized] = useState(false);
  const [prs, setPrs] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const timer = useTimer();
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  if (!template) return null;

  const handleBestSet = (name, kg, history) => {
    if (!history) return;
    const prevBest = Math.max(...history);
    if (kg > prevBest) {
      setPrs(prev => {
        const existing = prev.find(p => p.name === name);
        if (existing) {
          return prev.map(p => p.name === name ? { ...p, kg } : p);
        }
        return [...prev, { name, kg, prev: prevBest }];
      });
    }
  };

  const handleFinish = () => {
    setShowSummary(true);
  };

  if (showSummary) {
    return <SummaryScreen template={template} prs={prs} onDone={onFinish} />;
  }

  return (
    <>
      <div className={`fixed inset-0 z-30 transition-all duration-500 pointer-events-none ${minimized ? 'bg-black/20' : 'bg-black/50'}`} />

      <div
        className={`fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-3xl shadow-2xl transition-all duration-500 ease-in-out flex flex-col ${
          minimized ? 'h-20' : 'h-[95vh]'
        }`}
      >
        <div
          className="flex justify-center pt-3 pb-1 cursor-pointer flex-shrink-0"
          onClick={() => setMinimized(m => !m)}
        >
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {minimized ? (
          <div className="flex items-center justify-between px-5 flex-1" onClick={() => setMinimized(false)}>
            <div>
              <p className="font-bold text-gray-900 text-sm">{template.name}</p>
              <p className="text-xs text-gray-400">{timer}</p>
            </div>
            <div className="flex items-center gap-3">
              <ChevronDown className="w-5 h-5 text-gray-400 rotate-180" />
              <button
                onClick={e => { e.stopPropagation(); handleFinish(); }}
                className="px-4 py-1.5 bg-green-500 text-white text-sm font-semibold rounded-lg"
              >
                Finish
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 pt-2 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={onFinish}
                  className="w-10 h-10 flex items-center justify-center bg-red-100 hover:bg-red-200 rounded-xl transition"
                >
                  <X className="w-5 h-5 text-red-600" />
                </button>
                <button
                  onClick={() => {}}
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  <RotateCcw className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <button
                onClick={handleFinish}
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
                <ExerciseSection key={idx} exercise={exercise} onBestSet={handleBestSet} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}