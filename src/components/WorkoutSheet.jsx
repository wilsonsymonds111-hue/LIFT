import { useState, useEffect, useRef, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Timer, CalendarDays, Clock } from 'lucide-react';
import { AnimatePresence, motion, useMotionValue, animate as framerAnimate } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import ExercisePicker from './ExercisePicker';
import RestTimerPicker from './RestTimerPicker';
import { RestTimerModal, RestTimerPill } from './RestTimerModal';
import { ensureExerciseDetail } from '../lib/ensureExerciseDetail';
import { getExerciseDetailList } from '../lib/exerciseCache';
import { useExerciseHistory } from '../hooks/useExerciseHistory';
import TimerDisplay from './workout/TimerDisplay';
import { notifyRestComplete } from '../lib/workoutSounds';
import ExerciseSection from './workout/ExerciseSection';
import SummaryScreen from './workout/SummaryScreen';
import { isRestDayToday } from '../lib/restDayCheck';
import { useWorkoutTemplates } from '../hooks/useWorkoutTemplates';
import { saveWorkoutSession, clearWorkoutSession } from '../lib/workoutSession';

const TODAY_STR = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export default function WorkoutSheet({ template, onFinish, onSaveHistory, savedSession }) {
  const [minimized, setMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const yMotion = useMotionValue(0);
  const dragStartYRef = useRef(null);
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef(0);

  const onGrabPointerDown = (e) => {
    dragStartYRef.current = e.clientY;
    draggingRef.current = true;
    setIsDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onGrabPointerMove = (e) => {
    if (!draggingRef.current || dragStartYRef.current === null) return;
    const delta = Math.max(0, e.clientY - dragStartYRef.current);
    dragOffsetRef.current = delta;
    yMotion.set(delta);
  };
  const onGrabPointerUp = () => {
    const shouldMinimize = dragOffsetRef.current > 80;
    draggingRef.current = false;
    dragStartYRef.current = null;
    setIsDragging(false);
    if (shouldMinimize) {
      framerAnimate(yMotion, 0, { duration: 0.35, ease: [0.33, 1, 0.68, 1] });
      setMinimized(true);
    } else {
      framerAnimate(yMotion, 0, { duration: 0.3, ease: [0.33, 1, 0.68, 1] });
    }
    dragOffsetRef.current = 0;
  };
  const [prs, setPrs] = useState([]);
  const [bestSets, setBestSets] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [finishTimer, setFinishTimer] = useState('00:00');
  const [isRestDay, setIsRestDay] = useState(false);
  const { data: allTemplates = [] } = useWorkoutTemplates();
  const startTimeRef = useRef(savedSession?.startTime || Date.now());
  const [exercises, setExercises] = useState(() => {
    if (savedSession?.exercises?.length) return savedSession.exercises;
    return (template?.exerciseList || []).map(ex => ({
      ...ex,
      name: ex.name.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),
    }))
  });
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showRestTimerPicker, setShowRestTimerPicker] = useState(false);
  const [globalRestDuration, setGlobalRestDuration] = useState(120);
  const [restActive, setRestActive] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [restMinimized, setRestMinimized] = useState(false);
  const restIntervalRef = useRef(null);
  const restEndRef = useRef(null);
  const restNotifiedRef = useRef(false);
  const bestSetsRef = useRef(savedSession?.bestSets || {});
  const saveTimeoutRef = useRef(null);
  // Per-exercise state (sets, completedSets, note) for session persistence
  const exerciseStateRef = useRef(savedSession?.exerciseState || {});

  const startRestTimer = (duration) => {
    clearInterval(restIntervalRef.current);
    restNotifiedRef.current = false;
    const end = Date.now() + duration * 1000;
    restEndRef.current = end;
    setRestTotal(duration);
    setRestSeconds(duration);
    setRestActive(true);
    setRestMinimized(false);
    const tick = (silent = false) => {
      const remaining = Math.round((restEndRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(restIntervalRef.current);
        setRestSeconds(0);
        setRestActive(false);
        if (!restNotifiedRef.current) {
          restNotifiedRef.current = true;
          notifyRestComplete(silent);
        }
      } else {
        setRestSeconds(remaining);
      }
    };
    restIntervalRef.current = setInterval(() => tick(false), 250);
  };

  const stopRestTimer = () => {
    clearInterval(restIntervalRef.current);
    restEndRef.current = null;
    setRestActive(false);
    setRestMinimized(false);
  };

  const adjustRestTimer = (delta) => {
    if (restEndRef.current) restEndRef.current += delta * 1000;
    setRestSeconds(s => Math.max(0, s + delta));
    setRestTotal(t => Math.max(0, t + delta));
  };

  useEffect(() => {
    if (!restActive) return;
    const onVisible = () => {
      if (!document.hidden && restEndRef.current) {
        const remaining = Math.round((restEndRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          clearInterval(restIntervalRef.current);
          setRestSeconds(0);
          setRestActive(false);
          if (!restNotifiedRef.current) {
            restNotifiedRef.current = true;
            // Silent on visibility change — don't interrupt Spotify/music
            notifyRestComplete(true);
          }
        } else {
          setRestSeconds(remaining);
        }
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [restActive]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const { data: exerciseHistoryData = {} } = useExerciseHistory();

  const [exerciseImages, setExerciseImages] = useState({});
  useEffect(() => {
    getExerciseDetailList().then(async (results) => {
      const detailByName = {};
      (results || []).forEach(d => {
        if (d.image_url) detailByName[d.name.toLowerCase()] = d.image_url;
      });

      // Set known images immediately — don't block on missing ones
      const map = {};
      const missing = [];
      (template?.exerciseList || []).forEach(ex => {
        const key = ex.name.toLowerCase();
        if (detailByName[key]) {
          map[key] = detailByName[key];
        } else {
          missing.push(ex.name);
        }
      });
      setExerciseImages(map);

      // Generate missing images in background, update as each completes
      missing.forEach(async (name) => {
        try {
          const detail = await ensureExerciseDetail(name);
          if (detail?.image_url) {
            setExerciseImages(prev => ({ ...prev, [name.toLowerCase()]: detail.image_url }));
          }
        } catch {}
      });
    });
  }, [template?.id]);

  useEffect(() => {
    if (Object.keys(exerciseHistoryData).length === 0) return;
    setExercises(prev => {
      const hasChange = prev.some(ex => {
        const newHist = exerciseHistoryData[ex.name] || ex.history || [];
        return newHist !== ex.history;
      });
      if (!hasChange) return prev;
      return prev.map(ex => ({
        ...ex,
        history: exerciseHistoryData[ex.name] || ex.history || [],
      }));
    });
  }, [exerciseHistoryData]);

  const handleBestSet = useCallback((name, kg, reps) => {
    const today = new Date().toISOString().slice(0, 10);
    bestSetsRef.current[name] = { kg, reps, date: today };
  }, []);

  const handleDeleteExercise = useCallback((idx) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  }, []);

  // Persist the live workout session so it survives app kills
  const handleExerciseStateChange = useCallback((name, state) => {
    exerciseStateRef.current[name] = state;
  }, []);

  useEffect(() => {
    if (showSummary) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveWorkoutSession({
        templateId: template?.id,
        templateName: template?.name,
        startTime: startTimeRef.current,
        exercises,
        bestSets: bestSetsRef.current,
        exerciseState: exerciseStateRef.current,
      });
    }, 500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [exercises, showSummary, template?.id, template?.name]);

  const handleFinish = useCallback(async () => {
    const snapshot = { ...bestSetsRef.current };
    const toKg = (h) => typeof h === 'object' ? h.kg : h;
    const toReps = (h) => typeof h === 'object' ? (h.reps ?? 8) : 8;
    const computedPrs = exercises.filter(ex => {
      const best = snapshot[ex.name];
      if (!best) return false;
      if (!ex.history || ex.history.length === 0) return true;
      const isBodyweight = ex.history.every(h => { const k = toKg(h); return k === 0 || k == null; }) && (best.kg === 0 || best.kg == null);
      if (isBodyweight) {
        const maxReps = Math.max(...ex.history.map(toReps));
        return best.reps > maxReps;
      }
      const maxKg = Math.max(...ex.history.map(toKg));
      if (best.kg > maxKg) return true;
      if (best.kg === maxKg) {
        const maxRepsAtMaxKg = Math.max(...ex.history.filter(h => toKg(h) === maxKg).map(toReps));
        return best.reps > maxRepsAtMaxKg;
      }
      return false;
    }).map(ex => ({ name: ex.name, kg: snapshot[ex.name].kg }));
    setBestSets(snapshot);
    setPrs(computedPrs);
    const _elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setFinishTimer(`${String(Math.floor(_elapsed / 60)).padStart(2, '0')}:${String(_elapsed % 60).padStart(2, '0')}`);
    // Collect ALL completed sets (not just the best) for persistence
    const allSets = {};
    for (const ex of exercises) {
      const state = exerciseStateRef.current[ex.name];
      if (state?.completedSets) {
        const completed = Object.values(state.completedSets).filter(Boolean);
        if (completed.length > 0) {
          allSets[ex.name] = completed;
        }
      }
    }
    try {
      await onSaveHistory?.(template.id, allSets, exercises);
    } catch (e) {
      console.error('Save failed:', e);
    }
    setIsRestDay(isRestDayToday(allTemplates));
    setShowSummary(true);
    clearWorkoutSession();
  }, [exercises, onSaveHistory, template?.id, allTemplates]);

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
        isRestDay={isRestDay}
        allTemplates={allTemplates}
      />
    );
  }

  return (
    <motion.div
      className="fixed inset-x-0 z-40 bg-background rounded-t-3xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
      animate={{ 
        height: minimized ? '64px' : 'calc(100vh - 3rem)',
        bottom: minimized ? '90px' : '0px'
      }}
      transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
      style={{ y: yMotion, contain: 'layout style' }}
    >
      {/* Grab bar */}
      <div
        className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        onPointerDown={onGrabPointerDown}
        onPointerMove={onGrabPointerMove}
        onPointerUp={onGrabPointerUp}
        onPointerCancel={onGrabPointerUp}
      >
        <div className="w-10 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600" />
      </div>

      {/* Minimized bar content */}
      <AnimatePresence>
        {minimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between px-5 py-2 flex-shrink-0 cursor-pointer"
            onClick={() => setMinimized(false)}
          >
            <TimerDisplay startTimestamp={startTimeRef.current} className="text-base text-gray-400 dark:text-gray-500 font-display flex-shrink-0" />
            <p className="font-bold text-foreground text-base absolute left-1/2 -translate-x-1/2 truncate max-w-[50%] text-center">{template.name}</p>
            <div className="w-12 flex-shrink-0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full content */}
      <motion.div
        animate={{ opacity: minimized ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        className="flex-1 flex flex-col overflow-hidden"
        style={{ pointerEvents: minimized ? 'none' : 'auto' }}
      >
        <div className="relative flex items-center justify-between px-4 pt-2 pb-2 flex-shrink-0">
              {restActive && restMinimized ? (
                <RestTimerPill
                  seconds={restSeconds}
                  total={restTotal}
                  onClick={() => setRestMinimized(false)}
                />
              ) : (
                <button onClick={() => setShowRestTimerPicker(true)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition">
                  <Timer className="w-4 h-4" strokeWidth={1.5} />
                  Rest Timer
                </button>
              )}

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
              </div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <CalendarDays className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" strokeWidth={1.5} />
                <p className="text-sm text-gray-700 dark:text-gray-200 font-display">{TODAY_STR}</p>
              </div>
              <div className="flex items-center gap-1.5 mb-4">
                <Clock className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" strokeWidth={1.5} />
                <TimerDisplay startTimestamp={startTimeRef.current} className="text-sm text-gray-700 dark:text-gray-200 font-display" />
              </div>
              <textarea placeholder="Note" rows={1} className="w-full text-sm text-blue-500 placeholder-gray-400 dark:placeholder-gray-500 mb-6 focus:outline-none border-b border-transparent focus:border-blue-300 dark:focus:border-blue-500 pb-1 bg-transparent resize-none font-display" />

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
                              <ExerciseSection key={`${exercise.name}-${idx}`} exercise={exercise} onBestSet={handleBestSet} dragHandleProps={p.dragHandleProps} exerciseImage={exerciseImages[exercise.name.toLowerCase()]} onDeleteExercise={() => handleDeleteExercise(idx)} initialState={exerciseStateRef.current[exercise.name]} onStateChange={(state) => handleExerciseStateChange(exercise.name, state)} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={() => setShowExercisePicker(true)}
                  className="w-full py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-500 font-semibold rounded-xl text-base transition"
                >
                  Add Exercises
                </button>
                <button
                  onClick={() => { clearWorkoutSession(); onFinish(); }}
                  className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-400 font-semibold rounded-xl text-base transition"
                >
                  Cancel Workout
                </button>
              </div>
            </div>
      </motion.div>
    </motion.div>
  );
}