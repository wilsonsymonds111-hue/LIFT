import { useState, useEffect, useRef, useMemo, memo, lazy, Suspense } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import { getDefaultRestDuration } from '../../lib/exerciseDefaults';
import ProgressGraph, { getRepCap } from '../ProgressGraph';
import SetRow from './SetRow';
import RepGoalNotification from './RepGoalNotification';
const ExerciseDetailModal = lazy(() => import('../ExerciseDetailModal'));

const ExerciseSection = memo(function ExerciseSection({ exercise, onBestSet, dragHandleProps, onDeleteExercise, exerciseImage, initialState, onStateChange }) {
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
    if (initialState?.sets) return initialState.sets;
    const setCount = Math.max(2, exercise.sets || 2);
    if (!pr) return Array.from({ length: setCount }, (_, i) => ({ id: i + 1, suggestedKg: null, suggestedReps: null }));
    return Array.from({ length: setCount }, (_, i) => ({
      id: i + 1,
      suggestedKg: pr.bodyweight ? null : pr.kg,
      suggestedReps: pr.reps + i + 1,
    }));
  });
  const [completedSets, setCompletedSets] = useState(() => initialState?.completedSets || {});
  const [showMenu, setShowMenu] = useState(false);
  const [note, setNote] = useState(() => initialState?.note || '');
  const [showNote, setShowNote] = useState(false);
  const [restDuration, setRestDuration] = useState(() => getDefaultRestDuration(exercise.name));
  const [restEnabled, setRestEnabled] = useState(true);
  const [showCustomRest, setShowCustomRest] = useState(false);
  const [customRestInput, setCustomRestInput] = useState('');
  const [showExerciseDetail, setShowExerciseDetail] = useState(false);
  const [exerciseDetailInitialTab, setExerciseDetailInitialTab] = useState('Charts');
  const [goalNotification, setGoalNotification] = useState(null);
  const repCap = getRepCap(exercise.name);
  const goalNoteShownRef = useRef(false);
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

  // Report state changes to parent for session persistence
  useEffect(() => {
    onStateChange?.({ sets, completedSets, note });
  }, [sets, completedSets, note, onStateChange]);

  // Preload the detail modal chunk so it opens instantly when the image is clicked
  useEffect(() => { import('../ExerciseDetailModal'); }, []);

  const allEntries = [...(exercise.history || []), ...sessionResults];
  const isBodyweight = allEntries.length === 0
    ? false
    : allEntries.every(h => {
        const kg = typeof h === 'object' ? (h.kg ?? 0) : (h ?? 0);
        return kg === 0 || kg == null;
      });
  const displayHistory = graphHistory;
  const displayBodyweight = isBodyweight;

  return (
    <>
    <div className="mb-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
      <div className="relative flex items-start gap-3">
        <h3 className="text-blue-500 font-semibold text-sm select-none cursor-grab active:cursor-grabbing flex-1 leading-snug pr-7" {...dragHandleProps} onClick={() => { setExerciseDetailInitialTab('About'); setShowExerciseDetail(true); }}>{exercise.name}</h3>
        {exerciseImage ? (
          <img
            src={exerciseImage}
            alt={exercise.name}
            className="w-28 h-20 rounded-xl object-contain cursor-pointer hover:scale-105 active:scale-95 transition-transform flex-shrink-0"
            decoding="async"
            onClick={() => { setExerciseDetailInitialTab('About'); setShowExerciseDetail(true); }}
          />
        ) : (
          <div className="w-28 h-20 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
            <span className="text-base font-bold text-gray-400">{exercise.name[0]}</span>
          </div>
        )}
        <button onClick={() => setShowMenu(m => !m)} className="absolute top-0 left-0 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition z-20">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute left-0 top-6 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 min-w-[190px]">
              <button
                onClick={() => { setShowNote(n => !n); setShowMenu(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                {showNote ? 'Hide Note' : 'Add a Note'}
              </button>
              <button
                onClick={() => setShowCustomRest(c => !c)}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Change Default Rest Time
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
                onClick={() => { setShowMenu(false); onDeleteExercise?.(); }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-500 font-medium hover:bg-red-50 transition"
              >
                Remove Exercise
              </button>
            </div>
          </>
        )}
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
      <ProgressGraph history={displayHistory} animKey={graphAnimKey} animDir={animDir} isBodyweight={displayBodyweight} compact exerciseName={exercise.name} />
      <div className="h-3" />
      {sets.map((s, i) => (
        <div key={s.id} className={i > 0 ? 'mt-2' : ''}>
        <SetRow setNum={i + 1} previous={i === 0 ? prev : null} initialKg={s.suggestedKg ?? (i === 0 && prev ? prev.kg : null)} initialReps={s.suggestedReps ?? (i === 0 && prev ? prev.reps + 1 : null)} restDuration={restEnabled ? restDuration : 0} showHeader={i === 0}
          onComplete={(result) => {
            const setIndex = sets.findIndex(r => r.id === s.id);
            const wasCompleted = !!completedSets[s.id];
            setCompletedSets(prev => { const next = {...prev}; if (result) next[s.id] = result; else delete next[s.id]; return next; });
            if (result) {
              onBestSet?.(exercise.name, result.kg, result.reps);
              if (result.reps >= repCap && !goalNoteShownRef.current) {
                goalNoteShownRef.current = true;
                setGoalNotification(`Great work hitting ${repCap} reps! Time to move up to a heavier weight for maximum muscle growth.`);
              }
              if (!wasCompleted && setIndex < sets.length - 1) {
                setSets(prev => prev.map((r, i) => {
                  if (i <= setIndex) return r;
                  if (i === setIndex + 1) {
                    return {
                      ...r,
                      suggestedKg: result.kg || r.suggestedKg,
                      suggestedReps: result.reps + 1
                    };
                  }
                  return r;
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
      <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"><div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" /></div>}>
        <ExerciseDetailModal
          exercise={exercise}
          initialTab={exerciseDetailInitialTab}
          initialHistory={exercise.history}
          initialImage={exerciseImage}
          onClose={() => setShowExerciseDetail(false)}
        />
      </Suspense>
    )}
    {goalNotification && (
      <RepGoalNotification
        message={goalNotification}
        onDismiss={() => setGoalNotification(null)}
      />
    )}
    </>
  );
});

export default ExerciseSection;