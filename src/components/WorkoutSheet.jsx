import { useState, useEffect, useRef, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Timer, CalendarDays, Clock } from 'lucide-react';
import { AnimatePresence, motion, useMotionValue, useTransform, useMotionTemplate, animate as framerAnimate } from 'framer-motion';
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
import { useQueryClient } from '@tanstack/react-query';

const TODAY_STR = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export default function WorkoutSheet({ template, onFinish, onSaveHistory, savedSession }) {
  const [minimized, setMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const yMotion = useMotionValue(0);
  const dragStartYRef = useRef(null);
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef(0);
  const [morphDistance, setMorphDistance] = useState(() =>
    typeof window !== 'undefined' ? Math.max(window.innerHeight - 210, 200) : 500
  );

  const onGrabPointerDown = (e) => {
    dragStartYRef.current = e.clientY;
    draggingRef.current = true;
    setIsDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onGrabPointerMove = (e) => {
    if (!draggingRef.current || dragStartYRef.current === null) return;
    const delta = Math.max(0, Math.min(e.clientY - dragStartYRef.current, morphDistance));
    dragOffsetRef.current = delta;
    yMotion.set(delta);
  };
  const onGrabPointerUp = () => {
    const shouldMinimize = dragOffsetRef.current > morphDistance / 2;
    draggingRef.current = false;
    dragStartYRef.current = null;
    setIsDragging(false);
    if (shouldMinimize) {
      framerAnimate(yMotion, morphDistance, { type: 'spring', stiffness: 180, damping: 28, mass: 1.1 });
      setMinimized(true);
    } else {
      framerAnimate(yMotion, 0, { type: 'spring', stiffness: 220, damping: 30, mass: 1.0 });
    }
    dragOffsetRef.current = 0;
  };

  const handleBarClick = () => {
    setMinimized(false);
    framerAnimate(yMotion, 0, { type: 'spring', stiffness: 200, damping: 28, mass: 1.1 });
  };

  // --- Real-time morph: all visual properties derive from a single progress value (0=expanded, 1=minimized) ---
  const progress = useTransform(yMotion, [0, morphDistance], [0, 1], { clamp: true });
  const TOP_OFFSET = 0;
  const expandedHeightMV = useMotionValue(typeof window !== 'undefined' ? window.innerHeight - TOP_OFFSET : 800);
  useEffect(() => {
    const update = () => {
      const vh = window.innerHeight;
      expandedHeightMV.set(vh - TOP_OFFSET);
      vhMV.set(vh);
      setMorphDistance(Math.max(vh - 210, 200));
    };
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const height = useTransform([expandedHeightMV, progress], ([eh, p]) => eh + (72 - eh) * p);
  const vhMV = useMotionValue(typeof window !== 'undefined' ? window.innerHeight : 800);
  useEffect(() => { vhMV.set(window.innerHeight); }, []);
  const top = useTransform([vhMV, progress], ([vh, p]) => TOP_OFFSET + (vh - 72 - 90 - TOP_OFFSET) * p);
  const sideMargin = useTransform(progress, p => 12 * p);
  const borderRadius = useTransform(progress, p => 24 + 6 * p);
  const contentOpacity = useTransform(progress, [0, 0.5], [1, 0], { clamp: true });
  const barOpacity = useTransform(progress, [0.5, 0.85], [0, 1], { clamp: true });
  const grabOpacity = useTransform(progress, [0, 0.3], [1, 0], { clamp: true });
  const bgDimOpacity = useTransform(progress, [0, 0.7], [0.72, 0], { clamp: true });
  const shadowY = useTransform(progress, p => -4 + 14 * p);
  const shadowBlur = useTransform(progress, p => 30 + 10 * p);
  const shadowOpacity = useTransform(progress, p => 0.12 + 0.08 * p);
  const insetOpacity = useTransform(progress, p => 0.6 * p);
  const glassBorderOpacity = useTransform(progress, [0, 0.6, 1], [0, 0, 0.5], { clamp: true });
  const blueBorderOpacity = useTransform(progress, [0.4, 1], [0, 1], { clamp: true });
  const boxShadow = useMotionTemplate`0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}), 0 0 0 1px rgba(255,255,255,${glassBorderOpacity}), 0 0 0 2px rgba(59,130,246,${blueBorderOpacity}), inset 0 1px 1px rgba(255,255,255,${insetOpacity})`;
  const bgAlpha = useTransform(progress, [0, 0.5, 1], [1, 1, 0.55], { clamp: true });
  const sheetBg = useMotionTemplate`hsl(var(--background) / ${bgAlpha})`;
  const blurPx = useTransform(progress, [0, 0.4, 1], [0, 20, 60], { clamp: true });
  const sheetBackdrop = useMotionTemplate`blur(${blurPx}px) saturate(160%)`;
  const [prs, setPrs] = useState([]);
  const [bestSets, setBestSets] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [finishTimer, setFinishTimer] = useState('00:00');
  const [isRestDay, setIsRestDay] = useState(false);
  const { data: allTemplates = [] } = useWorkoutTemplates();
  const queryClient = useQueryClient();
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
  const restTimeoutRef = useRef(null);
  const restEndRef = useRef(null);
  const restNotifiedRef = useRef(false);
  const bestSetsRef = useRef(savedSession?.bestSets || {});
  const saveTimeoutRef = useRef(null);
  const cancelledRef = useRef(false);
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

    // Schedule a setTimeout for the exact rest end time — more reliable than
    // setInterval when the app is backgrounded (iOS aggressively throttles intervals).
    // On Android Chrome this fires even in background; on iOS it fires immediately
    // when the app regains focus if the rest has already ended.
    clearTimeout(restTimeoutRef.current);
    restTimeoutRef.current = setTimeout(() => {
      if (!restNotifiedRef.current) {
        restNotifiedRef.current = true;
        clearInterval(restIntervalRef.current);
        setRestSeconds(0);
        setRestActive(false);
        notifyRestComplete(false);
      }
    }, duration * 1000);
  };

  const stopRestTimer = () => {
    clearInterval(restIntervalRef.current);
    clearTimeout(restTimeoutRef.current);
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
            notifyRestComplete(false);
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

  // Clean up all rest timer resources on unmount
  useEffect(() => {
    return () => {
      clearInterval(restIntervalRef.current);
      clearTimeout(restTimeoutRef.current);
    };
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
          // Fuzzy fallback: try matching by stripping common suffixes/qualifiers
          // so "Smith Squat" matches "Smith Machine Squat", "Cable Crunches" matches "Cable Crunch", etc.
          const normalized = key.replace(/\s*\(.*?\)\s*/g, '').replace(/\bmachine\b/gi, ' ').replace(/\s+/g, ' ').replace(/es$/g, '').replace(/s$/g, '').trim();
          const fuzzyKey = Object.keys(detailByName).find(k => {
            const normK = k.replace(/\s*\(.*?\)\s*/g, '').replace(/\bmachine\b/gi, ' ').replace(/\s+/g, ' ').replace(/es$/g, '').replace(/s$/g, '').trim();
            return normK === normalized || k.includes(normalized) || normalized.includes(normK);
          });
          if (fuzzyKey) {
            map[key] = detailByName[fuzzyKey];
          } else {
            missing.push(ex.name);
          }
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
    if (showSummary || cancelledRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (cancelledRef.current) return;
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
    // Save the updated exercise list (swaps, additions, removals) directly to the
    // template so the change is permanent. This runs alongside onSaveHistory
    // (which saves exercise history + lastPerformed) but explicitly persists the
    // exercise composition so it survives the next time the user opens the workout.
    const exerciseListForSave = exercises.map(ex => ({
      name: ex.name,
      sets: ex.sets || 1,
      muscle: ex.muscle || '',
      history: ex.history || [],
    }));
    if (!template.id.startsWith('empty-')) {
      try {
        await base44.entities.WorkoutTemplate.update(template.id, {
          exerciseList: exerciseListForSave,
        });
        // Optimistically update the React Query cache so the UI is immediately correct
        queryClient.setQueryData(['workoutTemplates'], (prev) =>
          (prev || []).map(t =>
            t.id === template.id ? { ...t, exerciseList: exerciseListForSave } : t
          )
        );
      } catch (e) {
        console.error('Exercise list save failed:', e);
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
    window.dispatchEvent(new CustomEvent('workoutSessionChanged'));
  }, [exercises, onSaveHistory, template?.id, allTemplates, queryClient]);

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
    <>
    {/* Dimmed background — covers full screen so no gap shows above during transitions */}
    <motion.div
      className="fixed pointer-events-none"
      style={{ zIndex: 35, top: 0, bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', opacity: bgDimOpacity }}
    />

    <motion.div
      className="fixed z-40 flex flex-col overflow-hidden pointer-events-auto"
      style={{ 
        height,
        top,
        left: sideMargin,
        right: sideMargin,
        contain: 'layout style',
        borderRadius,
        boxShadow,
        background: sheetBg,
        backdropFilter: sheetBackdrop,
        WebkitBackdropFilter: sheetBackdrop,
      }}
    >
      {/* Grab bar — only in expanded view; tap the minimized bar to expand */}
      {!minimized && (
      <div
        className="flex justify-center items-center cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 20px) + 8px)',
          paddingBottom: '14px',
          minHeight: '40px',
          opacity: grabOpacity,
        }}
        onPointerDown={onGrabPointerDown}
        onPointerMove={onGrabPointerMove}
        onPointerUp={onGrabPointerUp}
        onPointerCancel={onGrabPointerUp}
      >
        <div className="w-10 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600" />
      </div>
      )}

      {/* Minimized bar — fades in as it minimizes, anchored to the bottom of the sheet */}
      <div
        className="flex items-center justify-between px-5 absolute inset-x-0 bottom-0"
        style={{ height: 72, opacity: barOpacity, pointerEvents: minimized ? 'auto' : 'none' }}
        onClick={minimized ? handleBarClick : undefined}
      >
        <p className="font-bold text-foreground text-base truncate">{template.name}</p>
        <TimerDisplay startTimestamp={startTimeRef.current} className="text-base text-muted-foreground font-display" />
      </div>

      {/* Full content — fades out as it minimizes */}
      <motion.div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ opacity: contentOpacity, pointerEvents: minimized ? 'none' : 'auto' }}
      >
        <div className="relative flex items-center justify-between px-4 pt-1 pb-2 flex-shrink-0">
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
              <div
                className="flex-1 self-stretch cursor-grab active:cursor-grabbing touch-none min-h-[40px]"
                onPointerDown={onGrabPointerDown}
                onPointerMove={onGrabPointerMove}
                onPointerUp={onGrabPointerUp}
                onPointerCancel={onGrabPointerUp}
              />
              <button onClick={handleFinish} className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition">
                Finish
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pt-2 pb-24">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
              </div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <CalendarDays className="w-4 h-4 text-gray-500 dark:text-gray-400" strokeWidth={1.5} />
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 font-display">{TODAY_STR}</p>
              </div>
              <div className="flex items-center gap-1.5 mb-4">
                <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" strokeWidth={1.5} />
                <TimerDisplay startTimestamp={startTimeRef.current} className="text-sm font-semibold text-gray-500 dark:text-gray-400 font-display" />
              </div>
              <div
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Note…"
                className="w-fit max-w-full text-sm font-semibold text-blue-600 dark:text-blue-400 mb-6 -ml-1 focus:outline-none bg-blue-50 dark:bg-blue-950/40 border border-white rounded-full px-4 py-2 font-display empty:bg-transparent empty:border-transparent empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 dark:empty:before:text-gray-500 empty:before:font-semibold transition-colors"
              />

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
                  onClick={(e) => { e.stopPropagation(); cancelledRef.current = true; clearWorkoutSession(); window.dispatchEvent(new CustomEvent('workoutSessionChanged')); onFinish(); }}
                  className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-400 font-semibold rounded-xl text-base transition relative z-20"
                  style={{ touchAction: 'manipulation' }}
                >
                  Cancel Workout
                </button>
              </div>
            </div>
      </motion.div>
    </motion.div>
    </>
  );
}