import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { History, MoreHorizontal, Check, ChevronDown, Trophy, Clock, Share, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ExercisePicker from './ExercisePicker';
import RestTimerPicker from './RestTimerPicker';
import { RestTimerModal, RestTimerPill } from './RestTimerModal';
import ExerciseDetailModal from './ExerciseDetailModal';
import { getDefaultRestDuration } from '../lib/exerciseDefaults';
import { ensureExerciseDetail } from '../lib/ensureExerciseDetail';
import { getExerciseDetailList } from '../lib/exerciseCache';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import ProgressGraph from './ProgressGraph';

/* ─── Sound Effect ──────────────────────────────────────────── */
const SET_COMPLETE_SOUND = 'https://media.base44.com/files/public/6a16b583ab0ebad6332038a3/87d1fec3a_ScreenRecording_06-16-202607-45-53_12.mp3';

// Preload the audio clip so it plays instantly with zero latency
let _audioEl = null;

function _ensureAudio() {
  if (!_audioEl) {
    _audioEl = new Audio(SET_COMPLETE_SOUND);
    _audioEl.preload = 'auto';
    _audioEl.load();
  }
}
// Start preloading immediately
_ensureAudio();

function playCompleteChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    // Four-tone triumphant arpeggio with a big finish
    const notes = [
      { freq: 523,  start: 0,     peak: 0.06,  end: 0.18 },  // C5
      { freq: 659,  start: 0.06,  peak: 0.12,  end: 0.24 },  // E5
      { freq: 784,  start: 0.12,  peak: 0.18,  end: 0.30 },  // G5
      { freq: 1047, start: 0.18,  peak: 0.25,  end: 0.65 },  // C6 (octave)
    ];

    notes.forEach(({ freq, start, peak, end }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.2, now + peak);
      gain.gain.exponentialRampToValueAtTime(0.001, now + end);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + end);
    });
  } catch (_) {}
}

function playTick() {
  if (!_audioEl) _ensureAudio();
  if (!_audioEl) return;
  _audioEl.currentTime = 0;
  _audioEl.play().catch(() => {});
}

/* ─── Rest timer complete notification ────────────────────────── */
function notifyRestComplete() {
  playTick();
  // Vibrate
  if (navigator.vibrate) {
    try { navigator.vibrate([200, 100, 200]); } catch (_) {}
  }
  // System notification (works when locked on most Android + installed PWA)
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification("Rest's up! 🏋️", {
        body: 'Get back to work',
        tag: 'rest-timer',
        requireInteraction: true,
      });
    } catch (_) {}
  }
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
const SetRow = memo(function SetRow({ setNum, previous, initialKg, initialReps, onComplete, onDelete, restDuration = 120 }) {
  const [kg, setKg] = useState(initialKg ?? previous?.kg ?? '');
  const [reps, setReps] = useState(initialReps ?? previous?.reps ?? '');
  const [done, setDone] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [restSeconds, setRestSeconds] = useState(null);
  const startXRef = useRef(null);
  const hasEdited = useRef(false);
  const restRef = useRef(null);

  useEffect(() => {
    if (done) {
      setRestSeconds(restDuration);
      restRef.current = setInterval(() => {
        setRestSeconds(s => {
          if (s <= 1) { clearInterval(restRef.current); notifyRestComplete(); return 0; }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(restRef.current);
      setRestSeconds(null);
    }
    return () => clearInterval(restRef.current);
  }, [done]);
  const DELETE_THRESHOLD = 80;



  const handleToggle = () => {
    const next = !done;
    setDone(next);
    if (next) {
      if (navigator.vibrate) navigator.vibrate(15);
      playTick();
      onComplete?.({ kg: kg !== '' ? parseFloat(kg) : 0, reps: reps !== '' ? parseInt(reps) : 0 });
    } else {
      onComplete?.(null);
    }
  };

  const onPointerDown = (e) => {
    startXRef.current = e.clientX;
    setSwiping(true);
  };
  const onPointerMove = (e) => {
    if (!swiping || startXRef.current === null) return;
    const dx = Math.min(0, e.clientX - startXRef.current);
    setSwipeX(Math.max(dx, -DELETE_THRESHOLD - 20));
  };
  const onPointerUp = () => {
    if (swipeX < -DELETE_THRESHOLD) {
      onDelete?.();
    } else {
      setSwipeX(0);
    }
    setSwiping(false);
    startXRef.current = null;
  };

  return (
    <div>
      <div className="relative overflow-hidden rounded-lg">
        {/* Red delete background */}
        <div className="absolute inset-y-0 right-0 flex items-center justify-end px-4 bg-red-500 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </div>
        {/* Swipeable row */}
        <div
          className={`grid grid-cols-[40px_1fr_80px_80px_44px] items-center gap-1 py-1.5 px-1 rounded-lg transition-colors ${done ? 'bg-green-200' : 'bg-white'}`}
          style={{ transform: `translateX(${swipeX}px)`, transition: swiping ? 'none' : 'transform 0.2s ease' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <span className="text-sm font-semibold text-center text-gray-500">{setNum}</span>
          <span className="text-sm text-gray-400 text-center">
            {previous ? `${previous.kg} kg × ${previous.reps}` : '—'}
          </span>
          <input
            type="number" value={kg}
            onChange={e => { hasEdited.current = true; setKg(e.target.value); }}
            placeholder="—"
            className={`rounded-lg text-center text-sm font-semibold py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 ${done ? 'bg-green-400 text-white' : 'bg-gray-100'}`}
          />
          <input
            type="number" value={reps}
            onChange={e => { hasEdited.current = true; setReps(e.target.value); }}
            placeholder="—"
            className={`rounded-lg text-center text-sm font-semibold py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 ${done ? 'bg-green-400 text-white' : 'bg-gray-100'}`}
          />
          <button
            onClick={handleToggle}
            className={`w-11 h-11 flex items-center justify-center rounded-lg transition ${done ? 'bg-green-400 text-white' : 'bg-gray-200 text-gray-400'}`}
          >
            <Check className="w-5 h-5" />
          </button>
        </div>
      </div>
      {done && restSeconds !== null && restSeconds > 0 && (
        <div
          className="w-full bg-blue-500 text-white font-bold text-center py-1.5 rounded-xl mt-2 text-base tracking-wider cursor-pointer select-none"
          onClick={() => { clearInterval(restRef.current); setRestSeconds(0); }}
        >
          {String(Math.floor(restSeconds/60)).padStart(2,'0')}:{String(restSeconds%60).padStart(2,'0')}
        </div>
      )}
    </div>
  );
});

/* ─── ExerciseSection ────────────────────────────────────────── */
const graphFadeStyle = `@keyframes graphFadeIn { from { opacity: 0.3; transform: scaleY(0.96); } to { opacity: 1; transform: scaleY(1); } }`;

const ExerciseSection = memo(function ExerciseSection({ exercise, onBestSet, dragHandleProps, onDeleteExercise, exerciseImage }) {
  // Compute PR from exercise history for progression targets
  const pr = useMemo(() => {
    const history = exercise.history || [];
    if (history.length === 0) return null;
    const toKg = (h) => typeof h === 'object' ? (h.kg || 0) : (h || 0);
    const toReps = (h) => typeof h === 'object' ? (h.reps || 8) : 8;
    const isBodyweight = history.every(h => toKg(h) === 0);
    if (isBodyweight) {
      const maxReps = Math.max(...history.map(toReps));
      return { kg: 0, reps: maxReps, bodyweight: true };
    }
    const maxKg = Math.max(...history.map(toKg));
    const entriesAtMaxKg = history.filter(h => toKg(h) === maxKg);
    const maxReps = Math.max(...entriesAtMaxKg.map(toReps));
    return { kg: maxKg, reps: maxReps, bodyweight: false };
  }, [exercise.history]);

  const [sets, setSets] = useState(() => {
    const setCount = Math.max(1, exercise.sets || 1);
    if (!pr) return Array.from({ length: setCount }, (_, i) => ({ id: i + 1, suggestedKg: null, suggestedReps: null }));
    return Array.from({ length: setCount }, (_, i) => ({
      id: i + 1,
      suggestedKg: pr.bodyweight ? null : pr.kg,
      suggestedReps: pr.reps + i + 1,
    }));
  });
  const [completedSets, setCompletedSets] = useState({});
  const [showMenu, setShowMenu] = useState(false);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [restDuration, setRestDuration] = useState(() => getDefaultRestDuration(exercise.name));
  const [restEnabled, setRestEnabled] = useState(true);
  const [showCustomRest, setShowCustomRest] = useState(false);
  const [customRestInput, setCustomRestInput] = useState('');
  const [showExerciseDetail, setShowExerciseDetail] = useState(false);
  const [exerciseDetailInitialTab, setExerciseDetailInitialTab] = useState('Charts');
  const [chartView, setChartView] = useState('weight');
  const lastEntry = exercise.history?.[exercise.history.length - 1];
  const prev = lastEntry ? (typeof lastEntry === 'object' ? lastEntry : { kg: lastEntry, reps: 8 }) : null;
  const sessionResults = Object.values(completedSets).filter(Boolean);
  const graphHistory = sessionResults.length > 0
    ? [...(exercise.history || []), ...sessionResults]
    : exercise.history;
  const graphAnimKey = sessionResults.length;
  const prevCountRef = useRef(0);
  const animDir = sessionResults.length >= prevCountRef.current ? 'add' : 'remove';
  useEffect(() => { prevCountRef.current = sessionResults.length; }, [sessionResults.length]);

  // Bodyweight: no kg in history AND no kg in current session results
  const allEntries = [...(exercise.history || []), ...sessionResults];
  const isBodyweight = allEntries.length === 0
    ? false
    : allEntries.every(h => {
        const kg = typeof h === 'object' ? (h.kg ?? 0) : (h ?? 0);
        return kg === 0 || kg == null;
      });

  // Reps chart: filter to current max weight level
  const repsHistory = (() => {
    const fullHistory = exercise.history || [];
    if (fullHistory.length === 0) return fullHistory;
    const kgs = fullHistory.map(h => (typeof h === 'object' ? h.kg || 0 : h || 0)).filter(k => k > 0);
    const maxKg = kgs.length > 0 ? Math.max(...kgs) : 0;
    const filtered = maxKg > 0
      ? fullHistory.filter(h => ((typeof h === 'object' ? h.kg || 0 : h || 0)) === maxKg)
      : fullHistory;
    return filtered.map(h => (typeof h === 'object' ? { ...h, kg: 0 } : { kg: 0, reps: h, date: null }));
  })();

  const displayHistory = chartView === 'reps' ? (sessionResults.length > 0 ? [...repsHistory, ...sessionResults.map(s => ({ ...s, kg: 0 }))] : repsHistory) : graphHistory;
  const displayBodyweight = chartView === 'reps' ? true : isBodyweight;

  return (
    <>
    <style>{graphFadeStyle}</style>
    <div className="mb-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
      <div className="flex items-start justify-between mb-1 relative">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h3 className="text-blue-500 font-semibold text-base select-none cursor-grab active:cursor-grabbing truncate" {...dragHandleProps}>{exercise.name}</h3>
          <button onClick={() => setShowMenu(m => !m)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition flex-shrink-0">
            <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
        <div className="flex items-center gap-3 relative flex-shrink-0">
          {exerciseImage ? (
            <img
              src={exerciseImage}
              alt={exercise.name}
              className="w-16 h-14 rounded-lg object-contain cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              onClick={() => { setExerciseDetailInitialTab('About'); setShowExerciseDetail(true); }}
            />
          ) : (
            <div className="w-16 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-400">{exercise.name[0]}</span>
            </div>
          )}
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-7 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[190px]">
                {/* Note toggle */}
                <button
                  onClick={() => { setShowNote(n => !n); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  {showNote ? 'Remove Note' : 'Add Note'}
                </button>
                <div className="border-t border-gray-100 mx-3 my-1" />
                {/* Rest timer options */}
                <p className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rest Timer</p>
                <button
                  onClick={() => { setRestEnabled(true); setRestDuration(getDefaultRestDuration(exercise.name)); setShowCustomRest(false); setShowMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 transition ${restEnabled && restDuration === getDefaultRestDuration(exercise.name) ? 'text-blue-500' : 'text-gray-700'}`}
                >
                  Default ({getDefaultRestDuration(exercise.name) / 60} min)
                </button>
                <button
                  onClick={() => setShowCustomRest(c => !c)}
                  className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 transition ${restEnabled && restDuration !== getDefaultRestDuration(exercise.name) ? 'text-blue-500' : 'text-gray-700'}`}
                >
                  Custom…
                </button>
                {showCustomRest && (
                  <div className="px-4 pb-2 flex items-center gap-2">
                    <input
                      type="number"
                      value={customRestInput}
                      onChange={e => setCustomRestInput(e.target.value)}
                      placeholder="sec"
                      className="w-16 text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                      onClick={() => {
                        const s = parseInt(customRestInput);
                        if (s > 0) { setRestDuration(s); setRestEnabled(true); }
                        setShowCustomRest(false); setShowMenu(false);
                      }}
                      className="text-xs bg-blue-500 text-white px-2 py-1 rounded-lg font-semibold"
                    >Set</button>
                  </div>
                )}
                <button
                  onClick={() => { setRestEnabled(false); setShowMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 transition ${!restEnabled ? 'text-blue-500' : 'text-gray-700'}`}
                >
                  Off
                </button>
                <div className="border-t border-gray-100 mx-3 my-1" />
                <button
                  onClick={() => { setExerciseDetailInitialTab('Charts'); setShowMenu(false); setShowExerciseDetail(true); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  View Exercise Details
                </button>
                <button
                  onClick={() => { setShowMenu(false); onDeleteExercise?.(); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 font-medium hover:bg-red-50 transition"
                >
                  Remove Exercise
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {showNote && (
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note…"
          rows={2}
          className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
        />
      )}
      <div className="flex justify-center mb-2">
        <div className="inline-flex bg-muted rounded-full p-0.5">
          <button
            onClick={() => setChartView('weight')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${chartView === 'weight' ? 'bg-white dark:bg-gray-600 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Weight
          </button>
          <button
            onClick={() => setChartView('reps')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${chartView === 'reps' ? 'bg-white dark:bg-gray-600 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Reps
          </button>
        </div>
      </div>
      <ProgressGraph history={displayHistory} animKey={graphAnimKey} animDir={animDir} isBodyweight={displayBodyweight} compact />
      <div className="grid grid-cols-[40px_1fr_80px_80px_44px] text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1 gap-1">
        <span className="text-center">Set</span>
        <span className="text-center">Previous</span>
        <span className="text-center">kg</span>
        <span className="text-center">Reps</span>
        <span></span>
      </div>
      {sets.map((s, i) => (
        <div key={s.id} className={i > 0 ? 'mt-2' : ''}>
        <SetRow setNum={i + 1} previous={i === 0 ? prev : null} initialKg={s.suggestedKg ?? (i === 0 && prev ? prev.kg : null)} initialReps={s.suggestedReps ?? (i === 0 && prev ? prev.reps + 1 : null)} restDuration={restEnabled ? restDuration : 0}
          onComplete={(result) => {
            const setIndex = sets.findIndex(r => r.id === s.id);
            setCompletedSets(prev => { const next = {...prev}; if (result) next[s.id] = result; else delete next[s.id]; return next; });
            if (result) {
              onBestSet?.(exercise.name, result.kg, result.reps);
              // Dynamic progression: if current set failed its target, adjust the next set
              const currentSet = sets[setIndex];
              const targetReps = currentSet.suggestedReps;
              const achieved = targetReps != null && result.reps >= targetReps;
              if (!achieved && setIndex < sets.length - 1 && targetReps != null) {
                setSets(prev => prev.map((r, i) => {
                  if (i <= setIndex) return r;
                  return { ...r, suggestedReps: targetReps };
                }));
              }
            }
          }}
          onDelete={() => {
            setSets(p => p.filter(r => r.id !== s.id));
            setCompletedSets(prev => { const next = {...prev}; delete next[s.id]; return next; });
          }} />
        </div>
      ))}
      <button
        onClick={() => {
          const sessionCompleted = Object.values(completedSets).filter(Boolean);
          let suggestedKg = null, suggestedReps = null;
          if (sessionCompleted.length > 0) {
            const last = sessionCompleted[sessionCompleted.length - 1];
            suggestedKg = last.kg;
            suggestedReps = last.reps + 1;
          } else if (pr) {
            suggestedKg = pr.bodyweight ? null : pr.kg;
            suggestedReps = pr.reps + sets.length + 1;
          } else {
            const lastEntry = exercise.history?.[exercise.history.length - 1];
            if (lastEntry) {
              suggestedKg = typeof lastEntry === 'object' ? lastEntry.kg : lastEntry;
              suggestedReps = (typeof lastEntry === 'object' ? lastEntry.reps : 8) + 1;
            }
          }
          setSets(p => [...p, { id: Date.now(), suggestedKg, suggestedReps }]);
        }}
        className="mt-2 w-full py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 transition"
      >
        + Add Set
      </button>
    </div>
    {showExerciseDetail && (
      <ExerciseDetailModal
        exercise={exercise}
        initialTab={exerciseDetailInitialTab}
        onClose={() => setShowExerciseDetail(false)}
      />
    )}
    </>
    );
    });

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
function SummaryScreen({ template, exercises, prs, bestSets, durationDisplay, onDone }) {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const cardRef = useRef(null);
  const igStickerRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [igSharing, setIgSharing] = useState(false);
  const [shimmer, setShimmer] = useState(false);

  const prSet = new Set(prs.map(p => p.name));

  useEffect(() => {
    setTimeout(() => setShimmer(true), 200);
    playCompleteChime();
  }, []);

  // Top-right share button — shares the gold card
  const handleShare = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: null, logging: false });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'workout.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: `${template.name} Workout` });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = 'workout.png'; a.click();
          URL.revokeObjectURL(url);
        }
        setSharing(false);
      }, 'image/png');
    } catch { setSharing(false); }
  };

  // Instagram story button — captures the full-screen sticker overlay
  const handleInstagramShare = async () => {
    if (!igStickerRef.current) return;
    setIgSharing(true);
    try {
      const canvas = await html2canvas(igStickerRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
        width: 390,
        height: 844,
      });
      canvas.toBlob(async (blob) => {
        const file = new File([blob], 'workout-story.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: `${template.name} Workout` });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = 'workout-story.png'; a.click();
          URL.revokeObjectURL(url);
        }
        setIgSharing(false);
      }, 'image/png');
    } catch { setIgSharing(false); }
  };

  return (
    <>
      <style>{`
        @keyframes goldShimmer {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(300%) skewX(-15deg); }
        }
        .gold-shimmer::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.6) 40%, rgba(255,255,255,0.5) 50%, rgba(255,215,0,0.6) 60%, transparent 100%);
          transform: translateX(-100%) skewX(-15deg);
          animation: goldShimmer 2s ease-in-out 0.3s forwards;
          pointer-events: none;
          border-radius: inherit;
          z-index: 1;
        }
      `}</style>

      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative bg-gray-50 rounded-3xl w-[92%] max-w-sm flex flex-col shadow-2xl overflow-hidden"
          style={{ animation: 'none' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-1 flex-shrink-0">
            <button onClick={onDone} className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition">
              <X className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-end gap-1">
              <Star size={22} delay={0} />
              <Star size={30} delay={120} />
              <Star size={22} delay={240} />
            </div>
            <button onClick={handleShare} disabled={sharing} className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition">
              <Share className="w-5 h-5 text-gray-700" />
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
              {exercises.map((ex, i) => {
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
                      {best ? (best.kg ? `${best.kg} kg × ${best.reps}` : `${best.reps} reps`) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-4 pb-5 flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={handleInstagramShare}
              disabled={igSharing}
              className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-2xl text-sm transition active:scale-95 shadow-md"
              style={{ background: 'linear-gradient(90deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
            >
              <InstagramIcon size={20} />
              {igSharing ? 'Preparing…' : 'Share to Instagram Story'}
            </button>
            <button
              onClick={onDone}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-2xl text-sm transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* ── Hidden Instagram Story Sticker (9:16, captured by html2canvas) ── */}
      <div
        ref={igStickerRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '390px',
          height: '844px',
          background: 'rgba(0,0,0,0.82)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 28px 50px',
          boxSizing: 'border-box',
        }}
      >
        {/* Top: workout name */}
        <div>
          {template.name.split(' ').map((word, wi) => (
            <div key={wi} style={{
              fontSize: '56px',
              fontWeight: '900',
              lineHeight: 1.05,
              letterSpacing: '-1px',
              color: wi % 2 === 1 ? '#FFD700' : '#ffffff',
              textTransform: 'uppercase',
            }}>{word}</div>
          ))}
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#aaaaaa', letterSpacing: '4px', textTransform: 'uppercase', marginTop: '6px' }}>WORKOUT</div>

          {/* Date / duration / PR row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '6px 10px' }}>
              <span style={{ fontSize: '13px', color: '#ccc' }}>📅</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{today}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '6px 10px' }}>
              <span style={{ fontSize: '13px', color: '#ccc' }}>⏱</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{durationDisplay}</span>
            </div>
            {prs.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFD700', borderRadius: '10px', padding: '6px 10px' }}>
                <span style={{ fontSize: '13px' }}>🏆</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#000' }}>{prs.length} PR</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.15)', margin: '24px 0' }} />

          {/* Exercise list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {exercises.map((ex, i) => {
              const best = bestSets[ex.name];
              const isPR = prSet.has(ex.name);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '16px' }}>💪</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', lineHeight: 1.3 }}>{ex.sets} × {ex.name}</div>
                    </div>
                    {isPR && (
                      <div style={{ background: '#FFD700', borderRadius: '6px', padding: '2px 7px', flexShrink: 0 }}>
                        <span style={{ fontSize: '10px', fontWeight: '900', color: '#000' }}>PR</span>
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '13px', color: '#aaa', fontWeight: '600', flexShrink: 0, marginLeft: '8px' }}>
                    {best ? (best.kg ? `${best.kg} kg × ${best.reps}` : `${best.reps} reps`) : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom stats bar */}
        <div style={{ display: 'flex', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
          {[
            { label: 'DURATION', value: durationDisplay, emoji: '⏱' },
            { label: "PR'S HIT", value: prs.length, emoji: '🏆' },
            { label: 'EXERCISES', value: exercises.length, emoji: '🏋️' },
          ].map((stat, i) => (
            <div key={i} style={{
              flex: 1,
              padding: '14px 8px',
              textAlign: 'center',
              borderRight: i < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none',
            }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#888', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>{stat.label}</div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#FFD700' }}>{stat.value}</div>
            </div>
          ))}
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
  const [exercises, setExercises] = useState(() =>
    (template?.exerciseList || []).map(ex => ({
      ...ex,
      name: ex.name.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),
    }))
  );
  const [exerciseHistory, setExerciseHistory] = useState({});
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showRestTimerPicker, setShowRestTimerPicker] = useState(false);
  const [globalRestDuration, setGlobalRestDuration] = useState(120);
  // Active rest timer state
  const [restActive, setRestActive] = useState(false);       // timer running
  const [restSeconds, setRestSeconds] = useState(0);         // current countdown
  const [restTotal, setRestTotal] = useState(0);             // original duration
  const [restMinimized, setRestMinimized] = useState(false); // pill vs modal
  const restIntervalRef = useRef(null);
  const { display: timer } = useTimer();
  const bestSetsRef = useRef({});

  // Start the rest countdown
  const startRestTimer = (duration) => {
    clearInterval(restIntervalRef.current);
    setRestTotal(duration);
    setRestSeconds(duration);
    setRestActive(true);
    setRestMinimized(false);
    restIntervalRef.current = setInterval(() => {
      setRestSeconds(s => {
        if (s <= 1) { clearInterval(restIntervalRef.current); setRestActive(false); notifyRestComplete(); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const stopRestTimer = () => {
    clearInterval(restIntervalRef.current);
    setRestActive(false);
    setRestMinimized(false);
  };

  const adjustRestTimer = (delta) => {
    setRestSeconds(s => Math.max(0, s + delta));
    setRestTotal(t => Math.max(0, t + delta));
  };

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Request notification permission for rest timer alerts
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Load Exercise entity history (shared across all splits)
  useEffect(() => {
    getExerciseDetailList().then(() => {}); // warm cache on mount for dual-purpose
    base44.entities.Exercise.list('name', 200).then(results => {
      const map = {};
      (results || []).forEach(ex => {
        map[ex.name] = ex.history || [];
      });
      setExerciseHistory(map);
    });
  }, []);

  // Load exercise images from ExerciseDetail, generating missing ones on the fly
  const [exerciseImages, setExerciseImages] = useState({});
  useEffect(() => {
    getExerciseDetailList().then(async (results) => {
      // Case-insensitive map — template exercises may use different casing than ExerciseDetail
      const detailByName = {};
      (results || []).forEach(d => {
        if (d.image_url) detailByName[d.name.toLowerCase()] = d.image_url;
      });

      const map = {};
      const templateExercises = template?.exerciseList || [];
      const missing = [];

      templateExercises.forEach(ex => {
        const key = ex.name.toLowerCase();
        if (detailByName[key]) {
          map[key] = detailByName[key];
        } else {
          missing.push(ex);
        }
      });

      if (missing.length > 0) {
        const generated = await Promise.all(missing.map(ex => ensureExerciseDetail(ex.name)));
        missing.forEach((ex, i) => {
          if (generated[i]?.image_url) map[ex.name.toLowerCase()] = generated[i].image_url;
        });
      }

      // Also populate the map for names that aren't in the template but exist in ExerciseDetail
      (results || []).forEach(d => {
        if (d.image_url && !Object.values(map).includes(d.image_url)) {
          map[d.name.toLowerCase()] = d.image_url;
        }
      });

      setExerciseImages(map);
    });
  }, [template?.id]);

  // Merge Exercise entity history into exercises
  useEffect(() => {
    if (Object.keys(exerciseHistory).length === 0) return;
    setExercises(prev => prev.map(ex => ({
      ...ex,
      history: exerciseHistory[ex.name] || ex.history || [],
    })));
  }, [exerciseHistory]);

  const handleBestSet = useCallback((name, kg, reps) => {
    const today = new Date().toISOString().slice(0, 10);
    bestSetsRef.current[name] = { kg, reps, date: today };
  }, []);

  const handleDeleteExercise = useCallback((idx) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleFinish = useCallback(async () => {
    const snapshot = { ...bestSetsRef.current };
    const toKg = (h) => typeof h === 'object' ? h.kg : h;
    const toReps = (h) => typeof h === 'object' ? (h.reps ?? 8) : 8;
    const computedPrs = exercises.filter(ex => {
      const best = snapshot[ex.name];
      if (!best) return false;
      // Brand new exercise with no history — first recorded set is always a PR
      if (!ex.history || ex.history.length === 0) return true;
      // Bodyweight exercise (kg is 0 or null) — PR is purely reps-based
      const isBodyweight = ex.history.every(h => { const k = toKg(h); return k === 0 || k == null; }) && (best.kg === 0 || best.kg == null);
      if (isBodyweight) {
        const maxReps = Math.max(...ex.history.map(toReps));
        return best.reps > maxReps;
      }
      const maxKg = Math.max(...ex.history.map(toKg));
      if (best.kg > maxKg) return true;
      // Same weight but more reps = PR
      if (best.kg === maxKg) {
        const maxRepsAtMaxKg = Math.max(...ex.history.filter(h => toKg(h) === maxKg).map(toReps));
        return best.reps > maxRepsAtMaxKg;
      }
      return false;
    }).map(ex => ({ name: ex.name, kg: snapshot[ex.name].kg }));
    setBestSets(snapshot);
    setPrs(computedPrs);
    setFinishTimer(timer);
    try {
      await onSaveHistory?.(template.id, snapshot, exercises);
    } catch (e) {
      console.error('Save failed:', e);
    }
    setShowSummary(true);
  }, [exercises, timer, onSaveHistory, template?.id]);

  if (!template) return null;

  if (showSummary) {
    return (
      <SummaryScreen
        template={template}
        exercises={exercises}
        prs={prs}
        bestSets={bestSets}
        durationDisplay={finishTimer}
        onDone={onFinish}
      />
    );
  }

  return (
    <>
      {/* Overlay — only when fully open */}
      {!minimized && <div className="fixed inset-0 z-30 bg-black/50 pointer-events-none" />}

      {/* Minimized Spotify-style strip */}
      {minimized && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 bg-gray-900 flex items-center justify-between px-4 py-3 shadow-2xl cursor-pointer"
          onClick={() => setMinimized(false)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{template.name.slice(0, 2)}</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-sm truncate">{template.name}</p>
              <p className="text-xs text-gray-400">{timer}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={e => { e.stopPropagation(); handleFinish(); }}
              className="px-4 py-1.5 bg-green-500 text-white text-sm font-semibold rounded-lg"
            >
              Finish
            </button>
          </div>
        </div>
      )}

      {/* Full sheet */}
      <div className={`fixed inset-x-0 bottom-0 z-40 bg-background rounded-t-3xl shadow-2xl transition-all duration-300 ease-in-out flex flex-col ${minimized ? 'h-0 overflow-hidden' : 'h-[95vh]'}`}
        style={!minimized ? { paddingTop: 'env(safe-area-inset-top)' } : undefined}
      >
        <div className="flex justify-center pt-3 pb-1 cursor-pointer flex-shrink-0" onClick={() => setMinimized(true)}>
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <>
            <div className="relative flex items-center justify-between px-4 pt-2 pb-2 flex-shrink-0">
              {/* Rest timer pill (minimized) or icon button */}
              {restActive && restMinimized ? (
                <RestTimerPill
                  seconds={restSeconds}
                  total={restTotal}
                  onClick={() => setRestMinimized(false)}
                />
              ) : (
                <button onClick={() => setShowRestTimerPicker(true)} className="w-11 h-11 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition">
                  <History className="w-5 h-5 text-gray-600" />
                </button>
              )}

              {/* Full rest timer modal */}
              {restActive && !restMinimized && (
                <RestTimerModal
                  seconds={restSeconds}
                  total={restTotal}
                  onSkip={stopRestTimer}
                  onMinimize={() => setRestMinimized(true)}
                  onAdjust={adjustRestTimer}
                />
              )}

              {showRestTimerPicker && (
                <RestTimerPicker
                  current={globalRestDuration}
                  onSelect={(s) => { setGlobalRestDuration(s); startRestTimer(s); }}
                  onClose={() => setShowRestTimerPicker(false)}
                />
              )}
              {showExercisePicker && (
                <ExercisePicker
                  onClose={() => setShowExercisePicker(false)}
                  onAdd={async (picked) => {
                    setExercises(prev => {
                      const existing = new Set(prev.map(e => e.name));
                      const newOnes = picked.filter(e => !existing.has(e.name)).map(e => ({ ...e, sets: 1, history: [] }));
                      return [...prev, ...newOnes];
                    });
                    // Load images for newly added exercises in parallel
                    const newNames = picked.filter(e => !exerciseImages[e.name.toLowerCase()]).map(e => e.name);
                    if (newNames.length > 0) {
                      const results = await Promise.all(newNames.map(name => ensureExerciseDetail(name)));
                      const generated = {};
                      newNames.forEach((name, i) => {
                        if (results[i]?.image_url) generated[name.toLowerCase()] = results[i].image_url;
                      });
                      setExerciseImages(prev => ({ ...prev, ...generated }));
                    }
                    setShowExercisePicker(false);
                  }}
                />
              )}
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
              <textarea placeholder="Note" rows={1} className="w-full text-sm text-gray-800 placeholder-gray-400 mb-6 focus:outline-none border-b border-transparent focus:border-gray-200 pb-1 bg-transparent resize-none [font-family:inherit] [font-weight:inherit] [letter-spacing:inherit]" />

              <DragDropContext onDragEnd={({ source, destination }) => {
                if (!destination) return;
                const next = [...exercises];
                const [moved] = next.splice(source.index, 1);
                next.splice(destination.index, 0, moved);
                setExercises(next);
              }}>
                <Droppable droppableId="exercises">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {exercises.map((exercise, idx) => (
                        <Draggable key={exercise.name + idx} draggableId={exercise.name + idx} index={idx}>
                          {(p) => (
                            <div ref={p.innerRef} {...p.draggableProps}>
                              <ExerciseSection key={`${exercise.name}-${(exercise.history || []).length}`} exercise={exercise} onBestSet={handleBestSet} dragHandleProps={p.dragHandleProps} exerciseImage={exerciseImages[exercise.name.toLowerCase()]} onDeleteExercise={() => handleDeleteExercise(idx)} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {/* Bottom buttons - scroll to see */}
              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={() => setShowExercisePicker(true)}
                  className="w-full py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-500 font-semibold rounded-xl text-base transition"
                >
                  Add Exercises
                </button>
                <button
                  onClick={onFinish}
                  className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-400 font-semibold rounded-xl text-base transition"
                >
                  Cancel Workout
                </button>
              </div>
            </div>
          </>
      </div>
    </>
  );
}