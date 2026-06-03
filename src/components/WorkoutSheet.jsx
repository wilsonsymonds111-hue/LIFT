import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceDot, ResponsiveContainer, Dot } from 'recharts';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { RotateCcw, MoreHorizontal, Check, ChevronDown, Trophy, Clock, Share, X } from 'lucide-react';
import ExercisePicker from './ExercisePicker';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';

/* ─── Victory Sound ─────────────────────────────────────────── */


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

/* ─── ProgressGraph ─────────────────────────────────────────── */
const punchDotStyle = `
  @keyframes dotSnapIn {
    0%   { transform: scale(0); opacity: 0; }
    65%  { transform: scale(1.25); opacity: 1; }
    100% { transform: scale(1);    opacity: 1; }
  }
  @keyframes dotRipple {
    0%   { r: 4;  opacity: 0.8; stroke-width: 2; }
    100% { r: 16; opacity: 0;   stroke-width: 0.5; }
  }
  @keyframes dotRetract {
    0%   { transform: scale(1); opacity: 1; }
    30%  { transform: scale(1.2); }
    100% { transform: scale(0); opacity: 0; }
  }
  @keyframes segmentFadeIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes segmentFadeOut { from { opacity: 1; } to { opacity: 0; } }
  .snap-dot    { transform-box: fill-box; transform-origin: center; animation: dotSnapIn  0.4s cubic-bezier(0.34,1.56,0.64,1) forwards !important; animation-iteration-count: 1 !important; }
  .ripple-ring { animation: dotRipple  0.65s ease-out forwards !important; animation-iteration-count: 1 !important; fill: none; stroke: #3b82f6; }
  .retract-dot { transform-box: fill-box; transform-origin: center; animation: dotRetract 0.35s cubic-bezier(0.55,0,1,0.45) forwards !important; animation-iteration-count: 1 !important; }
  .new-seg-in  { animation: segmentFadeIn  0.5s ease forwards; }
  .new-seg-out { animation: segmentFadeOut 0.35s ease forwards; }
`;

function ProgressGraph({ history, animKey, animDir }) {
  const [freshAnim, setFreshAnim] = useState(false);
  const prevAnimKeyRef = useRef(animKey);
  useEffect(() => {
    if (animKey !== prevAnimKeyRef.current) {
      prevAnimKeyRef.current = animKey;
      setFreshAnim(true);
      const t = setTimeout(() => setFreshAnim(false), 650);
      return () => clearTimeout(t);
    }
  }, [animKey]);

  if (!history || history.length === 0) return null;

  const TOTAL_SLOTS = 6;
  const toPoint = (h) => typeof h === 'object' ? h : { kg: h, reps: 8 };
  const realPoints = history.slice(-5).map(toPoint);
  const lastPoint = realPoints[realPoints.length - 1];
  const projectedCount = Math.max(1, TOTAL_SLOTS - realPoints.length);
  const lastRealIdx = realPoints.length - 1;

  // repsStatic: all real points except the newest
  // repsNew: only the last two real points (the new segment)
  const data = realPoints.map((p, i) => ({
    session: i + 1,
    repsStatic: i < lastRealIdx ? p.reps : null,
    repsNew: i >= lastRealIdx - 1 ? p.reps : null,
    projReps: i === lastRealIdx ? p.reps : null,
  }));
  for (let i = 1; i <= projectedCount; i++) {
    data.push({
      session: realPoints.length + i,
      repsStatic: null,
      repsNew: null,
      projReps: lastPoint.reps + i,
      projected: true,
    });
  }

  const StaticDot = (props) => {
    const { cx, cy, value } = props;
    if (value == null) return <g />;
    return <circle cx={cx} cy={cy} r={4} fill="#3b82f6" stroke="white" strokeWidth={2} />;
  };

  const NewDot = (props) => {
    const { cx, cy, index, value } = props;
    if (value == null) return <g />;
    const isNewest = index === lastRealIdx;
    if (isNewest) {
      if (freshAnim && animDir === 'remove') {
        return (
          <circle key={`dot-${animKey}`} cx={cx} cy={cy} r={4}
            fill="#3b82f6" stroke="white" strokeWidth={2}
            className="retract-dot" />
        );
      }
      if (freshAnim && animDir === 'add') {
        return (
          <g key={`dot-${animKey}`}>
            <circle cx={cx} cy={cy} r={4} fill="#3b82f6" stroke="white" strokeWidth={2} className="snap-dot" />
            <circle cx={cx} cy={cy} r={4} className="ripple-ring" />
          </g>
        );
      }
      return <circle key={`dot-static-${animKey}`} cx={cx} cy={cy} r={4} fill="#3b82f6" stroke="white" strokeWidth={2} />;
    }
    // bridge dot — already drawn by static line, hide
    return <g />;
  };

  const GhostDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload?.projected) return <g />;
    return (
      <circle cx={cx} cy={cy} r={5} fill="white" fillOpacity={0.6} stroke="#c4b5fd" strokeWidth={1.5} strokeDasharray="3 2" opacity={0.7} />
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    const reps = d?.projected ? d.projReps : (d?.repsNew ?? d?.repsStatic);
    if (!reps) return null;
    return (
      <div className={`text-xs px-2 py-1 rounded-lg shadow font-semibold ${
        d?.projected ? 'bg-purple-50 text-purple-400 border border-purple-100' : 'bg-white text-gray-700 border border-gray-100'
      }`}>
        {d?.projected ? 'Next: ' : ''}{reps} reps @ {d?.kg ?? lastPoint.kg}kg
      </div>
    );
  };

  return (
    <div className={`mb-2 rounded-xl overflow-hidden ${animDir === 'remove' ? 'new-seg-out' : 'new-seg-in'}`} style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)', padding: '8px 4px 4px' }}>
      <style>{punchDotStyle}</style>
      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest text-center mb-1">Progress</p>
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={data} margin={{ top: 12, right: 16, left: -28, bottom: 4 }}>
          <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 9, fill: '#9ca3af' }} />
          <Tooltip content={<CustomTooltip />} />
          {/* Static line — all historical segments, no animation */}
          <Line
            type="monotone" dataKey="repsStatic"
            stroke="#3b82f6" strokeWidth={2}
            dot={<StaticDot />} activeDot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
          {/* Animated new segment — only last two points */}
          <Line
            key={animKey}
            type="monotone" dataKey="repsNew"
            stroke="#3b82f6" strokeWidth={2}
            dot={<NewDot />} activeDot={false}
            connectNulls={true}
            isAnimationActive={true}
            animationDuration={600}
            animationEasing="ease-out"
          />
          {/* Dashed ghost projection line */}
          <Line
            type="monotone" dataKey="projReps"
            stroke="#c4b5fd" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6}
            dot={<GhostDot />} activeDot={false}
            connectNulls={true}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── SetRow ─────────────────────────────────────────────────── */
function SetRow({ setNum, previous, initialKg, initialReps, onComplete, onDelete, restDuration = 120 }) {
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
          if (s <= 1) { clearInterval(restRef.current); return 0; }
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
    if (next && kg && reps) onComplete?.({ kg: parseFloat(kg), reps: parseInt(reps) });
    else if (!next) onComplete?.(null);
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
          className={`grid grid-cols-[40px_1fr_80px_80px_40px] items-center gap-1 py-1.5 px-1 rounded-lg transition-colors ${done ? 'bg-green-200' : 'bg-white'}`}
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
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${done ? 'bg-green-400 text-white' : 'bg-gray-200 text-gray-400'}`}
          >
            <Check className="w-4 h-4" />
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
}

/* ─── ExerciseSection ────────────────────────────────────────── */
const graphFadeStyle = `@keyframes graphFadeIn { from { opacity: 0.3; transform: scaleY(0.96); } to { opacity: 1; transform: scaleY(1); } }`;

function ExerciseSection({ exercise, onBestSet, dragHandleProps, onDeleteExercise }) {
  const [sets, setSets] = useState([{ id: 1 }]);
  const [completedSets, setCompletedSets] = useState({});
  const [showMenu, setShowMenu] = useState(false);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [restDuration, setRestDuration] = useState(120);
  const [restEnabled, setRestEnabled] = useState(true);
  const [showCustomRest, setShowCustomRest] = useState(false);
  const [customRestInput, setCustomRestInput] = useState('');
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

  return (
    <>
    <style>{graphFadeStyle}</style>
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1 relative">
        <h3 className="text-blue-500 font-semibold text-base select-none cursor-grab active:cursor-grabbing" {...dragHandleProps}>{exercise.name}</h3>
        <div className="flex items-center gap-3 relative">
          <button onClick={() => setShowMenu(m => !m)} className="p-1 rounded-lg hover:bg-gray-100 transition">
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
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
                  onClick={() => { setRestEnabled(true); setRestDuration(120); setShowCustomRest(false); setShowMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 transition ${restEnabled && restDuration === 120 ? 'text-blue-500' : 'text-gray-700'}`}
                >
                  Default (2 min)
                </button>
                <button
                  onClick={() => setShowCustomRest(c => !c)}
                  className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 transition ${restEnabled && restDuration !== 120 ? 'text-blue-500' : 'text-gray-700'}`}
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
      <ProgressGraph history={graphHistory} animKey={graphAnimKey} animDir={animDir} />
      <div className="grid grid-cols-[40px_1fr_80px_80px_40px] text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1 gap-1">
        <span className="text-center">Set</span>
        <span className="text-center">Previous</span>
        <span className="text-center">kg</span>
        <span className="text-center">Reps</span>
        <span></span>
      </div>
      {sets.map((s, i) => (
        <div key={s.id} className={i > 0 ? 'mt-2' : ''}>
        <SetRow setNum={i + 1} previous={i === 0 ? prev : null} initialKg={s.suggestedKg} initialReps={s.suggestedReps} restDuration={restEnabled ? restDuration : 0}
          onComplete={(result) => {
            setCompletedSets(prev => { const next = {...prev}; if (result) next[s.id] = result; else delete next[s.id]; return next; });
            if (result) onBestSet?.(exercise.name, result.kg, result.reps);
          }}
          onDelete={() => {
            setSets(p => p.filter(r => r.id !== s.id));
            setCompletedSets(prev => { const next = {...prev}; delete next[s.id]; return next; });
          }} />
        </div>
      ))}
      <button
        onClick={() => {
          // Prefer last completed set in this session, then fall back to history
          const sessionCompleted = Object.values(completedSets).filter(Boolean);
          let suggestedKg = null, suggestedReps = null;
          if (sessionCompleted.length > 0) {
            const last = sessionCompleted[sessionCompleted.length - 1];
            suggestedKg = last.kg;
            suggestedReps = last.reps;
          } else {
            const lastEntry = exercise.history?.[exercise.history.length - 1];
            if (lastEntry) {
              suggestedKg = typeof lastEntry === 'object' ? lastEntry.kg : lastEntry;
              suggestedReps = typeof lastEntry === 'object' ? lastEntry.reps : 8;
            }
          }
          setSets(p => [...p, { id: Date.now(), suggestedKg, suggestedReps: suggestedReps != null ? suggestedReps + 1 : null }]);
        }}
        className="mt-2 w-full py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 transition"
      >
        + Add Set
      </button>
    </div>
    </>
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
  const [exercises, setExercises] = useState(() => [...(template?.exerciseList || [])]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showRestTimerPicker, setShowRestTimerPicker] = useState(false);
  const { display: timer } = useTimer();
  const bestSetsRef = useRef({});

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  if (!template) return null;

  const handleBestSet = (name, kg, reps) => {
    // Always save the latest reported set so reps are accurate
    bestSetsRef.current[name] = { kg, reps };
  };

  const handleFinish = () => {
    const snapshot = { ...bestSetsRef.current };
    const toKg = (h) => typeof h === 'object' ? h.kg : h;
    const computedPrs = exercises.filter(ex => {
      const best = snapshot[ex.name];
      if (!best || !ex.history || ex.history.length === 0) return false;
      return best.kg >= Math.max(...ex.history.map(toKg));
    }).map(ex => ({ name: ex.name, kg: snapshot[ex.name].kg }));
    setBestSets(snapshot);
    setPrs(computedPrs);
    setFinishTimer(timer);
    onSaveHistory?.(template.id, snapshot, exercises);
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
            <div className="relative flex items-center justify-between px-4 pt-2 pb-2 flex-shrink-0">
              <button onClick={() => setShowRestTimerPicker(true)} className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition">
                <RotateCcw className="w-5 h-5 text-gray-600" />
              </button>
              {showExercisePicker && (
                <ExercisePicker
                  onClose={() => setShowExercisePicker(false)}
                  onAdd={(picked) => {
                    setExercises(prev => {
                      const existing = new Set(prev.map(e => e.name));
                      const newOnes = picked.filter(e => !existing.has(e.name)).map(e => ({ ...e, sets: 1, history: [] }));
                      return [...prev, ...newOnes];
                    });
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
              <input placeholder="Note" className="w-full text-sm text-gray-400 mb-6 focus:outline-none border-b border-transparent focus:border-gray-200 pb-1" />
              {exercises.length === 0 && (
                <div className="flex flex-col gap-3 mt-4">
                  <button
                    onClick={() => setShowExercisePicker(true)}
                    className="w-full py-4 bg-blue-50 hover:bg-blue-100 text-blue-500 font-semibold rounded-xl text-base transition"
                  >
                    Add Exercises
                  </button>
                  <button
                    onClick={onFinish}
                    className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-400 font-semibold rounded-xl text-base transition"
                  >
                    Cancel Workout
                  </button>
                </div>
              )}
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
                              <ExerciseSection exercise={exercise} onBestSet={handleBestSet} dragHandleProps={p.dragHandleProps} onDeleteExercise={() => setExercises(prev => prev.filter((_, i) => i !== idx))} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </>
        )}
      </div>
    </>
  );
}