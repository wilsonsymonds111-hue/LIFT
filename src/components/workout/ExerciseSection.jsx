import { useState, useEffect, useRef, useMemo, memo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Plus } from 'lucide-react';
import { getDefaultRestDuration } from '../../lib/exerciseDefaults';
import ProgressGraph, { getRepCap } from '../ProgressGraph';
import SetRow from './SetRow';
import RepGoalNotification from './RepGoalNotification';
import RestTimeModal from './RestTimeModal';
import ExerciseShareButton from '../share/ExerciseShareButton';
const ExerciseDetailModal = lazy(() => import('../ExerciseDetailModal'));

const ExerciseSection = memo(function ExerciseSection({ exercise, onBestSet, dragControls, onDeleteExercise, exerciseImage, initialState, onStateChange, isDragging }) {
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

  const lastSessionSets = useMemo(() => {
    const history = exercise.history || [];
    if (history.length === 0) return [];
    const byDate = {};
    history.forEach(h => {
      const entry = typeof h === 'object' ? h : { kg: h, reps: 8 };
      const d = entry.date || '';
      if (!d) return;
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(entry);
    });
    const dates = Object.keys(byDate).sort().reverse();
    if (dates.length === 0) return [];
    return byDate[dates[0]];
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
  const [showRestTimeModal, setShowRestTimeModal] = useState(false);
  const [showExerciseDetail, setShowExerciseDetail] = useState(false);
  const [exerciseDetailInitialTab, setExerciseDetailInitialTab] = useState('Charts');
  const [goalNotification, setGoalNotification] = useState(null);
  const repCap = getRepCap(exercise.name);
  const goalNoteShownRef = useRef(false);
  const lastEntry = useMemo(() => exercise.history?.[exercise.history.length - 1], [exercise.history]);
  const prev = useMemo(() => lastEntry ? (typeof lastEntry === 'object' ? lastEntry : { kg: lastEntry, reps: 8 }) : null, [lastEntry]);
  const sessionResults = useMemo(() => Object.values(completedSets).filter(Boolean), [completedSets]);
  const graphHistory = useMemo(() => sessionResults.length > 0
    ? [...(exercise.history || []), ...sessionResults]
    : exercise.history, [sessionResults, exercise.history]);
  const graphAnimKey = sessionResults.length;
  const prevCountRef = useRef(0);
  const animDir = sessionResults.length >= prevCountRef.current ? 'add' : 'remove';
  useEffect(() => { prevCountRef.current = sessionResults.length; }, [sessionResults.length]);

  useEffect(() => {
    onStateChange?.({ sets, completedSets, note });
  }, [sets, completedSets, note, onStateChange]);

  useEffect(() => { import('../ExerciseDetailModal'); }, []);

  const allEntries = useMemo(() => [...(exercise.history || []), ...sessionResults], [exercise.history, sessionResults]);
  const isBodyweight = useMemo(() => allEntries.length === 0
    ? false
    : allEntries.every(h => {
        const kg = typeof h === 'object' ? (h.kg ?? 0) : (h ?? 0);
        return kg === 0 || kg == null;
      }), [allEntries]);
  const displayHistory = graphHistory;
  const displayBodyweight = isBodyweight;

  return (
    <>
    <motion.div
      animate={{ scale: isDragging ? 1.02 : 1 }}
      transition={isDragging ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 30 }}
      className={`mb-2 bg-white dark:bg-gray-800 rounded-xl p-3 overflow-hidden transition-shadow ${isDragging ? 'ring-2 ring-blue-500 shadow-lg' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0 flex flex-col">
          <h3
            onPointerDown={(e) => dragControls?.start(e)}
            style={{ touchAction: 'none' }}
            className="text-blue-500 font-semibold text-base select-none cursor-grab active:cursor-grabbing leading-snug"
            onClick={() => { setExerciseDetailInitialTab('About'); setShowExerciseDetail(true); }}
          >
            {exercise.name}
          </h3>
          {(
            <div className="relative -ml-1 mt-0.5 flex items-center gap-0.5">
              <ExerciseShareButton exercise={exercise} sessionResults={sessionResults} pr={pr} />
              <button onClick={() => setShowMenu(m => !m)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <MoreHorizontal className="w-4 h-4 text-gray-700 dark:text-gray-200" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute left-0 top-8 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 min-w-[190px]">
                    <button
                      onClick={() => { setShowNote(n => !n); setShowMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 font-medium hover:bg-gray-50 transition"
                    >
                      {showNote ? 'Hide Note' : 'Add a Note'}
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); setShowRestTimeModal(true); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 font-medium hover:bg-gray-50 transition"
                    >
                      Change Default Rest Time
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
          )}
        </div>
        {exerciseImage ? (
          <img
            src={exerciseImage}
            alt={exercise.name}
            className="rounded-xl object-contain cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex-shrink-0 w-28 h-20 hover:scale-105 active:scale-95"
            decoding="async"
            loading="lazy"
            onClick={() => { setExerciseDetailInitialTab('About'); setShowExerciseDetail(true); }}
          />
        ) : (
          <div className="rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] w-28 h-20">
            <span className="text-base font-bold text-gray-400">{exercise.name[0]}</span>
          </div>
        )}
      </div>
      <AnimatePresence initial={false}>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            {showNote && (
              <div
                ref={el => { if (el && document.activeElement !== el && el.textContent !== note) el.textContent = note; }}
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Add a note…"
                onInput={e => setNote(e.currentTarget.textContent)}
                className="w-fit max-w-full text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 focus:outline-none bg-blue-50 dark:bg-blue-950/40 border border-white rounded-full px-4 py-1.5 empty:bg-transparent empty:border-transparent empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 dark:empty:before:text-gray-500 empty:before:font-semibold transition-colors"
              />
            )}
            <ProgressGraph history={displayHistory} animKey={graphAnimKey} animDir={animDir} isBodyweight={displayBodyweight} compact exerciseName={exercise.name} />
            {sets.map((s, i) => {
              const prevSet = i < lastSessionSets.length ? lastSessionSets[i] : null;
              const completedResult = completedSets[s.id];
              const isDone = !!completedResult;
              const suggestedKg = isDone ? completedResult.kg : (s.suggestedKg ?? prevSet?.kg ?? (i === 0 && prev ? prev.kg : null));
              const suggestedReps = isDone ? completedResult.reps : (s.suggestedReps ?? (prevSet ? prevSet.reps + 1 : (i === 0 && prev ? prev.reps + 1 : null)));
              return (
              <div key={s.id} className={i > 0 ? 'mt-2' : ''}>
              <SetRow setNum={i + 1} previous={i === 0 ? (prevSet ?? prev) : null} initialKg={suggestedKg} initialReps={suggestedReps} initialDone={isDone} restDuration={restEnabled ? restDuration : 0} showHeader={i === 0}
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
            );
            })}
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
          </motion.div>
      </AnimatePresence>
    </motion.div>
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
    {showRestTimeModal && (
      <RestTimeModal
        currentSeconds={restDuration}
        onClose={() => setShowRestTimeModal(false)}
        onSelect={(secs) => { setRestDuration(secs); setRestEnabled(true); }}
      />
    )}
    </>
  );
});

export default ExerciseSection;