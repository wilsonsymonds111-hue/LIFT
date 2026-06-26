import { useState, useEffect, useRef, useMemo, memo, lazy, Suspense } from 'react';
import { MoreHorizontal, Target, Plus } from 'lucide-react';
import { getDefaultRestDuration } from '../../lib/exerciseDefaults';
import { useExerciseGoals } from '../../hooks/useExerciseGoals';
import ProgressGraph from '../ProgressGraph';
import GoalModal from './GoalModal';
import SetRow from './SetRow';
const ExerciseDetailModal = lazy(() => import('../ExerciseDetailModal'));

const ExerciseSection = memo(function ExerciseSection({ exercise, onBestSet, dragHandleProps, onDeleteExercise, exerciseImage }) {
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
  const [showGoalModal, setShowGoalModal] = useState(false);
  const { data: goalsData = {} } = useExerciseGoals();
  const [goal, setGoal] = useState(null);
  useEffect(() => {
    const key = exercise.name.toLowerCase();
    const found = Object.entries(goalsData).find(([k]) => k.toLowerCase() === key)?.[1] || null;
    setGoal(found);
  }, [goalsData, exercise.name]);
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

  const allEntries = [...(exercise.history || []), ...sessionResults];
  const isBodyweight = allEntries.length === 0
    ? false
    : allEntries.every(h => {
        const kg = typeof h === 'object' ? (h.kg ?? 0) : (h ?? 0);
        return kg === 0 || kg == null;
      });
  const repsMaxKg = (() => {
    const kgs = allEntries.map(h => (typeof h === 'object' ? h.kg || 0 : h || 0)).filter(k => k > 0);
    return kgs.length > 0 ? Math.max(...kgs) : 0;
  })();
  const repsWeightLabel = chartView === 'reps' && repsMaxKg > 0 ? `Reps Progress (${repsMaxKg} kg)` : undefined;

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
    <div className="mb-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
      <div className="flex items-center justify-between relative">
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
              decoding="async"
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
                <button
                  onClick={() => { setShowNote(n => !n); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  {showNote ? 'Remove Note' : 'Add Note'}
                </button>
                <div className="border-t border-gray-100 mx-3 my-1" />
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
      <div className="relative flex items-center justify-center mb-2">
        <button
          onClick={() => setShowGoalModal(true)}
          className={`absolute left-0 flex items-center gap-1 h-7 rounded-full transition ${goal ? 'bg-green-500 text-white px-2' : 'bg-green-100 dark:bg-green-900/30 text-green-500 hover:bg-green-200 dark:hover:bg-green-900/50 px-3'}`}
        >
          {goal ? <Target className="w-3.5 h-3.5" /> : <><Plus className="w-3.5 h-3.5" /><span className="text-xs font-semibold">Set a goal</span></>}
        </button>
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
      <ProgressGraph history={displayHistory} animKey={graphAnimKey} animDir={animDir} isBodyweight={displayBodyweight} compact goal={goal} chartView={chartView} labelOverride={repsWeightLabel} repsChartWeight={repsMaxKg} />
      {showGoalModal && (
        <GoalModal
          exerciseName={exercise.name}
          goal={goal}
          onClose={() => setShowGoalModal(false)}
          onSaved={(g) => { setGoal(g); }}
        />
      )}
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
            const wasCompleted = !!completedSets[s.id];
            setCompletedSets(prev => { const next = {...prev}; if (result) next[s.id] = result; else delete next[s.id]; return next; });
            if (result) {
              onBestSet?.(exercise.name, result.kg, result.reps);
              if (!wasCompleted) {
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
      <Suspense fallback={null}>
        <ExerciseDetailModal
          exercise={exercise}
          initialTab={exerciseDetailInitialTab}
          initialHistory={exercise.history}
          initialImage={exerciseImage}
          onClose={() => setShowExerciseDetail(false)}
        />
      </Suspense>
    )}
    </>
  );
});

export default ExerciseSection;