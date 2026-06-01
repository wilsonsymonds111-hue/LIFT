import { useState, useEffect, useRef } from 'react';
import { X, RotateCcw, Link2, MoreHorizontal, Check, ChevronDown, Trophy, Clock, Share } from 'lucide-react';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';

/* ─── Victory Sound ─────────────────────────────────────────── */
function playVictorySound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [392, 523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = 'triangle';
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.start(t); osc.stop(t + 0.6);
    });
  } catch (e) { /* ignore */ }
}

/* ─── Timer ──────────────────────────────────────────────────── */
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
  return { display: `${mm}:${ss}` };
}

/* ─── SetRow ─────────────────────────────────────────────────── */
function SetRow({ setNum, previous, onComplete }) {
  const [kg, setKg] = useState(previous?.kg ?? '');
  const [reps, setReps] = useState(previous?.reps ?? '');
  const [done, setDone] = useState(false);

  const notify = (newKg, newReps) => {
    if (newKg && newReps) onComplete?.({ kg: parseFloat(newKg), reps: parseInt(newReps) });
  };

  const handleToggle = () => {
    setDone(d => !d);
    if (kg && reps) onComplete?.({ kg: parseFloat(kg), reps: parseInt(reps) });
  };

  return (
    <div className={`grid grid-cols-[40px_1fr_80px_80px_40px] items-center gap-1 py-2 px-1 rounded-lg transition ${done ? 'bg-green-50' : ''}`}>
      <span className="text-sm font-semibold text-center text-gray-500">{setNum}</span>
      <span className="text-sm text-gray-400 text-center">
        {previous ? `${previous.kg} kg × ${previous.reps}` : '—'}
      </span>
      <input
        type="number" value={kg}
        onChange={e => { setKg(e.target.value); notify(e.target.value, reps); }}
        onBlur={e => notify(e.target.value, reps)}
        placeholder="—"
        className="bg-gray-100 rounded-lg text-center text-sm font-semibold py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <input
        type="number" value={reps}
        onChange={e => { setReps(e.target.value); notify(kg, e.target.value); }}
        onBlur={e => notify(kg, e.target.value)}
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

/* ─── ExerciseSection ────────────────────────────────────────── */
function ExerciseSection({ exercise, onBestSet }) {
  const [sets, setSets] = useState([{ id: 1 }]);
  const prev = exercise.history ? { kg: exercise.history[exercise.history.length - 1], reps: 8 } : null;

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
        <SetRow key={s.id} setNum={i + 1} previous={prev}
          onComplete={(result) => result && onBestSet?.(exercise.name, result.kg, result.reps)} />
      ))}
      <button
        onClick={() => setSets(p => [...p, { id: Date.now() }])}
        className="mt-2 w-full py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-600 transition"
      >
        + Add Set
      </button>
    </div>
  );
}

/* ─── Icons ──────────────────────────────────────────────────── */
function InstagramIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="white" strokeWidth="2" fill="none"/>
      <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="2" fill="none"/>
      <circle cx="17.5" cy="6.5" r="1" fill="white"/>
    </svg>
  );
}

function Star({ size = 24, delay = 0 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"
      className="text-yellow-400 animate-bounce"
      style={{ animationDelay: `${delay}ms`, animationDuration: '0.6s', animationIterationCount: 3 }}>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

/* ─── SummaryScreen ──────────────────────────────────────────── */
function SummaryScreen({ template, prs, bestSets, durationDisplay, onDone }) {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const cardRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [shimmer, setShimmer] = useState(false);

  const prSet = new Set(prs.map(p => p.name));

  useEffect(() => {
    // Victory sound
    playVictorySound();
    // Confetti burst
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: ['#FFD700', '#FFA500', '#fff', '#60a5fa', '#34d399'] });
    setTimeout(() => confetti({ particleCount: 60, spread: 60, origin: { y: 0.5 }, angle: 60, colors: ['#FFD700', '#FFA500', '#fff'] }), 300);
    setTimeout(() => confetti({ particleCount: 60, spread: 60, origin: { y: 0.5 }, angle: 120, colors: ['#FFD700', '#FFA500', '#fff'] }), 500);
    // Shimmer
    setTimeout(() => setShimmer(true), 200);
  }, []);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'workout.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${template.name} Workout`, text: `Just crushed my ${template.name} workout! 💪` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'workout.png'; a.click();
        URL.revokeObjectURL(url);
      }
      setSharing(false);
    }, 'image/png');
  };

  return (
    <>
      <style>{`
        @keyframes goldShimmer {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(300%) skewX(-20deg); }
        }
        .gold-shimmer::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.35) 50%, transparent 100%);
          transform: translateX(-100%) skewX(-20deg);
          animation: goldShimmer 1.2s ease-in-out 0.3s forwards;
          pointer-events: none;
          border-radius: inherit;
          z-index: 1;
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative bg-gray-50 rounded-3xl w-[92%] max-w-sm flex flex-col shadow-2xl overflow-hidden"
          style={{ animation: 'none' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-1 flex-shrink-0">
            <button onClick={onDone} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition">
              <X className="w-4 h-4 text-gray-700" />
            </button>
            <div className="flex items-end gap-1">
              <Star size={22} delay={0} />
              <Star size={30} delay={120} />
              <Star size={22} delay={240} />
            </div>
            <button onClick={handleShare} disabled={sharing} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition">
              <Share className="w-4 h-4 text-gray-700" />
            </button>
          </div>

          {/* Title */}
          <div className="text-center px-4 pb-3 flex-shrink-0">
            <h1 className="text-2xl font-extrabold text-gray-900">Well Done!</h1>
            <p className="text-gray-500 text-sm mt-0.5">You crushed your {template.name} workout!</p>
          </div>

          {/* Gold shimmer summary card */}
          <div ref={cardRef}
            className={`mx-4 mb-4 bg-white rounded-2xl border-2 overflow-hidden relative ${shimmer ? 'gold-shimmer' : ''}`}
            style={{ borderColor: '#FFD700', boxShadow: '0 0 20px rgba(255,215,0,0.3)' }}>

            {/* Card header */}
            <div className="px-4 pt-4 pb-2" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-extrabold text-gray-900 text-lg tracking-wide">{template.name}</h2>
                  <p className="text-gray-500 text-xs mt-0.5">{today}</p>
                </div>
                <div className="text-3xl">🏆</div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{durationDisplay}</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-yellow-600">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>{prs.length} PR{prs.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-yellow-200" />

            {/* Exercise rows */}
            <div className="px-4 py-3 space-y-2">
              {template.exerciseList?.map((ex, i) => {
                const best = bestSets[ex.name];
                const isPR = prSet.has(ex.name);
                return (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs text-gray-700 font-medium leading-snug">{ex.sets} × {ex.name}</span>
                      {isPR && (
                        <span className="flex-shrink-0 text-[10px] font-bold bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full leading-none">PR</span>
                      )}
                    </div>
                    <span className="flex-shrink-0 text-xs text-gray-500 font-semibold">
                      {best ? `${best.kg} kg × ${best.reps}` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-4 pb-5 flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={handleShare} disabled={sharing}
              className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-2xl text-sm transition active:scale-95 shadow-md"
              style={{ background: 'linear-gradient(90deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
            >
              <InstagramIcon size={20} />
              {sharing ? 'Preparing…' : 'Share to Instagram Story'}
            </button>
            <button
              onClick={onDone}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-2xl text-sm transition"
            >
              <Trophy className="w-4 h-4" />
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── WorkoutSheet ───────────────────────────────────────────── */
export default function WorkoutSheet({ template, onFinish, onSaveHistory }) {
  const [minimized, setMinimized] = useState(false);
  const [prs, setPrs] = useState([]);
  const [bestSets, setBestSets] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [finishTimer, setFinishTimer] = useState('00:00');
  const { display: timer } = useTimer();
  const bestSetsRef = useRef({});

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  if (!template) return null;

  const handleBestSet = (name, kg, reps) => {
    const current = bestSetsRef.current[name];
    if (!current || kg > current.kg) {
      bestSetsRef.current[name] = { kg, reps };
    }
  };

  const handleFinish = () => {
    const snapshot = { ...bestSetsRef.current };
    const computedPrs = (template.exerciseList || []).filter(ex => {
      const best = snapshot[ex.name];
      if (!best || !ex.history || ex.history.length === 0) return false;
      return best.kg >= Math.max(...ex.history);
    }).map(ex => ({ name: ex.name, kg: snapshot[ex.name].kg }));
    setBestSets(snapshot);
    setPrs(computedPrs);
    setFinishTimer(timer);
    // Save updated history
    onSaveHistory?.(template.id, snapshot);
    setShowSummary(true);
  };

  if (showSummary) {
    return (
      <SummaryScreen
        template={template}
        prs={prs}
        bestSets={bestSets}
        durationDisplay={finishTimer}
        onDone={onFinish}
      />
    );
  }

  return (
    <>
      <div className={`fixed inset-0 z-30 transition-all duration-500 pointer-events-none ${minimized ? 'bg-black/20' : 'bg-black/50'}`} />
      <div className={`fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-3xl shadow-2xl transition-all duration-500 ease-in-out flex flex-col ${minimized ? 'h-20' : 'h-[95vh]'}`}>
        <div className="flex justify-center pt-3 pb-1 cursor-pointer flex-shrink-0" onClick={() => setMinimized(m => !m)}>
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
              <button onClick={e => { e.stopPropagation(); handleFinish(); }} className="px-4 py-1.5 bg-green-500 text-white text-sm font-semibold rounded-lg">
                Finish
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 pt-2 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={onFinish} className="w-10 h-10 flex items-center justify-center bg-red-100 hover:bg-red-200 rounded-xl transition">
                  <X className="w-5 h-5 text-red-600" />
                </button>
                <button onClick={() => {}} className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition">
                  <RotateCcw className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <button onClick={handleFinish} className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition">
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
              <input placeholder="Note" className="w-full text-sm text-gray-400 mb-6 focus:outline-none border-b border-transparent focus:border-gray-200 pb-1" />
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