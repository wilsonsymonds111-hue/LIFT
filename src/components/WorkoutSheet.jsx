import { useState, useEffect, useRef } from 'react';
import { X, RotateCcw, Link2, MoreHorizontal, Check, ChevronDown, Trophy, Clock, User, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';

function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const ref = useRef(seconds);
  ref.current = seconds;
  useEffect(() => {
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return { display: `${mm}:${ss}`, getSeconds: () => ref.current };
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

  const prev = exercise.history
    ? { kg: exercise.history[exercise.history.length - 1], reps: 8 }
    : null;

  const handleSetComplete = (result) => {
    if (result) {
      onBestSet?.(exercise.name, result.kg, result.reps, exercise.history);
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

// Decorative star SVG
function Star({ size = 24, opacity = 1, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} style={{ opacity }}>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

function SummaryScreen({ template, prs, bestSets, totalVolume, durationDisplay, onDone }) {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const cardRef = useRef(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: '#f9fafb' });
    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'workout.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `${template.name} Workout`, text: `Just crushed my ${template.name} workout! 💪` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'workout.png';
        a.click();
        URL.revokeObjectURL(url);
      }
      setSharing(false);
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal card */}
      <div className="relative bg-gray-50 rounded-3xl w-[92%] max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header row: X, title, Share */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <button
            onClick={onDone}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
          <div className="flex items-end gap-1.5">
            <Star size={28} className="text-yellow-400 mb-0.5" />
            <Star size={36} className="text-yellow-400" />
            <Star size={28} className="text-yellow-400 mb-0.5" />
          </div>
          <button
            onClick={handleShare}
            disabled={sharing}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition"
          >
            <Share2 className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        {/* Title */}
        <div className="text-center px-4 pb-3 flex-shrink-0">
          <h1 className="text-2xl font-extrabold text-gray-900">Well Done!</h1>
          <p className="text-gray-500 text-sm mt-0.5">Great job finishing your {template.name} workout!</p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* Summary card */}
          <div ref={cardRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 pt-4 pb-4">
              <h2 className="font-extrabold text-gray-900 text-base">{template.name}</h2>
              <p className="text-gray-500 text-sm mt-0.5">{today}</p>

              {/* Stats row - time + PRs only */}
              <div className="flex items-center gap-5 mt-3">
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>{durationDisplay}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Trophy className="w-4 h-4 text-gray-500" />
                  <span>{prs.length} PRs</span>
                </div>
              </div>

              <div className="border-t border-gray-100 mt-4 mb-3" />

              {/* Exercise table */}
              <div className="grid grid-cols-2 gap-x-4 mb-2">
                <span className="text-xs font-bold text-gray-700">Exercise</span>
                <span className="text-xs font-bold text-gray-700">Best Set</span>
              </div>
              {template.exerciseList?.map((ex, i) => {
                const best = bestSets[ex.name];
                return (
                  <div key={i} className="grid grid-cols-2 gap-x-4 py-1.5">
                    <span className="text-sm text-gray-700">{ex.sets} × {ex.name}</span>
                    <span className="text-sm text-gray-600">
                      {best ? `${best.kg} kg × ${best.reps}` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="px-4 pb-4 flex-shrink-0 flex flex-col gap-3">
          <button
            onClick={handleShare}
            disabled={sharing}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white font-bold py-4 rounded-2xl text-base transition active:scale-95 shadow-md"
          >
            <Share2 className="w-5 h-5" />
            {sharing ? 'Preparing...' : 'Share to Instagram Story'}
          </button>
          <button
            onClick={onDone}
            className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-2xl text-base transition"
          >
            <Trophy className="w-5 h-5" />
            {prs.length} Personal Record{prs.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorkoutSheet({ template, onFinish }) {
  const [minimized, setMinimized] = useState(false);
  const [prs, setPrs] = useState([]);
  const [bestSets, setBestSets] = useState({});
  const [totalVolume, setTotalVolume] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [finishTimer, setFinishTimer] = useState('00:00');
  const { display: timer, getSeconds } = useTimer();

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  if (!template) return null;

  const handleBestSet = (name, kg, reps, history) => {
    setBestSets(prev => {
      const current = prev[name];
      if (!current || kg > current.kg) {
        return { ...prev, [name]: { kg, reps } };
      }
      return prev;
    });
    setTotalVolume(v => v + kg * reps);
    if (history) {
      const prevBest = Math.max(...history);
      if (kg > prevBest) {
        setPrs(prev => {
          const existing = prev.find(p => p.name === name);
          if (existing) return prev.map(p => p.name === name ? { ...p, kg } : p);
          return [...prev, { name, kg, prev: prevBest }];
        });
      }
    }
  };

  const handleFinish = () => {
    setFinishTimer(timer);
    setShowSummary(true);
  };

  if (showSummary) {
    return (
      <SummaryScreen
        template={template}
        prs={prs}
        bestSets={bestSets}
        totalVolume={totalVolume}
        durationDisplay={finishTimer}
        onDone={onFinish}
      />
    );
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