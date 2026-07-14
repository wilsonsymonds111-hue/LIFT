import { useState, useEffect, useRef, useCallback } from 'react';
import ReorderableExercise from './workout/ReorderableExercise';
import { Timer, CalendarDays, Clock } from 'lucide-react';
import { AnimatePresence, motion, useMotionValue, useTransform, useMotionTemplate, animate as framerAnimate } from 'framer-motion';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import ExercisePicker from './ExercisePicker';
import RestTimerPicker from './RestTimerPicker';
import { RestTimerModal, RestTimerPill } from './RestTimerModal';
import { ensureExerciseDetail } from '../lib/ensureExerciseDetail';
import { getExerciseDetailList, getCachedImageMap, saveCachedImageMap } from '../lib/exerciseCache';
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
  const [noteFocused, setNoteFocused] = useState(false);
  const [exerciseDragActive, setExerciseDragActive] = useState(false);
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
  // Compute initial exercises + migrated state once.
  // When restoring a saved session, exercise names are refreshed from the
  // current template (by index) so renames propagate to in-progress workouts.
  // exerciseState/bestSets keys are migrated from old names to new names.
  const initialWorkoutRef = useRef(null);
  if (initialWorkoutRef.current === null) {
    const capitalize = (s) => s.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    const templateExs = template?.exerciseList || [];
    let initialExercises;
    const nameMap = {}; // old saved name → new template name

    if (savedSession?.exercises?.length && savedSession.templateId === template?.id) {
      initialExercises = savedSession.exercises.map((savedEx, idx) => {
        const tEx = templateExs[idx];
        const newName = tEx ? capitalize(tEx.name) : capitalize(savedEx.name);
        if (tEx && capitalize(tEx.name) !== capitalize(savedEx.name)) {
          nameMap[capitalize(savedEx.name)] = newName;
        }
        return tEx
          ? { ...savedEx, name: newName, muscle: tEx.muscle || savedEx.muscle, history: tEx.history?.length ? tEx.history : savedEx.history }
          : { ...savedEx, name: newName };
      });
    } else {
      initialExercises = templateExs.map(ex => ({ ...ex, name: capitalize(ex.name) }));
    }

    const migratedState = {};
    Object.entries(savedSession?.exerciseState || {}).forEach(([key, val]) => {
      migratedState[nameMap[key] || key] = val;
    });
    const migratedBestSets = {};
    Object.entries(savedSession?.bestSets || {}).forEach(([key, val]) => {
      migratedBestSets[nameMap[key] || key] = val;
    });

    initialWorkoutRef.current = { initialExercises, migratedState, migratedBestSets };
  }

  const startTimeRef = useRef(savedSession?.startTime || Date.now());
  const [exercises, setExercises] = useState(initialWorkoutRef.current.initialExercises);
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
  const bestSetsRef = useRef(initialWorkoutRef.current.migratedBestSets);
  const saveTimeoutRef = useRef(null);
  const cancelledRef = useRef(false);
  // Per-exercise state (sets, completedSets, note) for session persistence
  const exerciseStateRef = useRef(initialWorkoutRef.current.migratedState);
  // Refs for session saving inside stable callbacks
  const exercisesRef = useRef(exercises);
  exercisesRef.current = exercises;
  const templateRef = useRef(template);
  templateRef.current = template;

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

  // Clean up all rest timer resources on unmount
  useEffect(() => {
    return () => {
      clearInterval(restIntervalRef.current);
      clearTimeout(restTimeoutRef.current);
    };
  }, []);

  const { data: exerciseHistoryData = { history: {}, notes: {} } } = useExerciseHistory();

  const [exerciseImages, setExerciseImages] = useState({});

  // Build the name→image_url map from a detail list, with fuzzy fallback.
  const buildImageMap = useCallback((results, exerciseList) => {
    const detailByName = {};
    (results || []).forEach(d => {
      if (d.image_url) detailByName[d.name.toLowerCase()] = d.image_url;
    });
    const map = {};
    const missing = [];
    (exerciseList || []).forEach(ex => {
      const key = ex.name.toLowerCase();
      if (detailByName[key]) {
        map[key] = detailByName[key];
      } else {
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
    return { map, missing };
  }, []);

  // Preload actual image files so the <img> tags render instantly
  const preloadImages = useCallback((map) => {
    Object.values(map).forEach(url => {
      if (url) { const img = new Image(); img.src = url; }
    });
  }, []);

  useEffect(() => {
    const exerciseList = template?.exerciseList || [];

    // 1. Show cached images immediately from localStorage (instant on repeat opens)
    const cachedMap = getCachedImageMap();
    if (cachedMap) {
      const { map } = buildImageMap(
        Object.entries(cachedMap).map(([name, url]) => ({ name, image_url: url })),
        exerciseList
      );
      setExerciseImages(map);
      preloadImages(map);
    }

    // 2. Fetch fresh data in background — updates if anything changed
    getExerciseDetailList().then(async (results) => {
      const { map, missing } = buildImageMap(results, exerciseList);
      setExerciseImages(map);
      preloadImages(map);

      // Persist the full detail map for instant loads next time
      const detailByName = {};
      (results || []).forEach(d => {
        if (d.image_url) detailByName[d.name.toLowerCase()] = d.image_url;
      });
      saveCachedImageMap(detailByName);

      // Resolve missing images in background
      missing.forEach(async (name) => {
        try {
          const detail = await ensureExerciseDetail(name);
          if (detail?.image_url) {
            setExerciseImages(prev => ({ ...prev, [name.toLowerCase()]: detail.image_url }));
          }
        } catch {}
      });
    });
  }, [template?.id, buildImageMap, preloadImages]);

  // Sync exercise names + metadata when the template prop updates (e.g. after
  // a React Query background refetch delivers fresh data with renamed exercises).
  // Without this, stale cached names persist forever in the workout state.
  useEffect(() => {
    if (!template?.exerciseList) return;
    const capitalize = (s) => s.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    setExercises(prev => {
      let changed = false;
      const next = prev.map((ex, idx) => {
        const tEx = template.exerciseList[idx];
        if (!tEx) return ex;
        const newName = capitalize(tEx.name);
        const newNote = tEx.note ?? '';
        if (ex.name === newName && (ex.note ?? '') === newNote) return ex;
        changed = true;
        // Migrate per-exercise state from old name → new name
        const oldState = exerciseStateRef.current[ex.name];
        if (oldState) { delete exerciseStateRef.current[ex.name]; exerciseStateRef.current[newName] = oldState; }
        const oldBest = bestSetsRef.current[ex.name];
        if (oldBest) { delete bestSetsRef.current[ex.name]; bestSetsRef.current[newName] = oldBest; }
        return { ...ex, name: newName, muscle: tEx.muscle || ex.muscle, note: newNote || ex.note };
      });
      return changed ? next : prev;
    });
  }, [template]);

  useEffect(() => {
    const { history: historyMap = {}, notes: notesMap = {} } = exerciseHistoryData;
    if (Object.keys(historyMap).length === 0 && Object.keys(notesMap).length === 0) return;
    // Case-insensitive lookups — the maps are keyed by DB name casing,
    // but workout exercise names are title-cased, so they may differ
    const lowerHistory = {};
    const lowerNotes = {};
    Object.entries(historyMap).forEach(([k, v]) => { lowerHistory[k.toLowerCase()] = v; });
    Object.entries(notesMap).forEach(([k, v]) => { lowerNotes[k.toLowerCase()] = v; });
    setExercises(prev => {
      const hasChange = prev.some(ex => {
        const key = ex.name.toLowerCase();
        const newHist = lowerHistory[key] || ex.history || [];
        const newNote = lowerNotes[key] ?? (ex.note || '');
        return newHist !== ex.history || newNote !== (ex.note || '');
      });
      if (!hasChange) return prev;
      return prev.map(ex => {
        const key = ex.name.toLowerCase();
        return {
          ...ex,
          history: lowerHistory[key] || ex.history || [],
          note: lowerNotes[key] ?? ex.note ?? '',
        };
      });
    });
  }, [exerciseHistoryData, exercises]);

  const handleBestSet = useCallback((name, kg, reps) => {
    const today = new Date().toISOString().slice(0, 10);
    bestSetsRef.current[name] = { kg, reps, date: today };
  }, []);

  const handleDeleteExercise = useCallback((idx) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  }, []);

  // --- Drag auto-scroll: smooth scrolling while reordering exercises ---
  const scrollContainerRef = useRef(null);
  const dragPointerYRef = useRef(null);
  const isDraggingRef = useRef(false);
  const autoScrollRAFRef = useRef(null);

  const handleDragPointerMove = useCallback((e) => {
    dragPointerYRef.current = e.touches?.[0]?.clientY ?? e.clientY;
  }, []);

  const dragAutoScroll = useCallback(() => {
    if (!isDraggingRef.current) return;
    const container = scrollContainerRef.current;
    if (container && dragPointerYRef.current != null) {
      const rect = container.getBoundingClientRect();
      const y = dragPointerYRef.current - rect.top;
      const threshold = 130;
      const maxSpeed = 20;
      if (y < threshold) {
        container.scrollTop -= maxSpeed * Math.min(1, 1 - y / threshold);
      } else if (y > rect.height - threshold) {
        container.scrollTop += maxSpeed * Math.min(1, 1 - (rect.height - y) / threshold);
      }
    }
    autoScrollRAFRef.current = requestAnimationFrame(dragAutoScroll);
  }, []);

  const handleDragStart = useCallback(() => {
    setExerciseDragActive(true);
    isDraggingRef.current = true;
    window.addEventListener('pointermove', handleDragPointerMove, { passive: true });
    window.addEventListener('touchmove', handleDragPointerMove, { passive: true });
    autoScrollRAFRef.current = requestAnimationFrame(dragAutoScroll);
  }, [handleDragPointerMove, dragAutoScroll]);

  const handleDragEnd = useCallback((result) => {
    isDraggingRef.current = false;
    setExerciseDragActive(false);
    window.removeEventListener('pointermove', handleDragPointerMove);
    window.removeEventListener('touchmove', handleDragPointerMove);
    dragPointerYRef.current = null;
    if (autoScrollRAFRef.current) cancelAnimationFrame(autoScrollRAFRef.current);
    if (!result.destination || result.source.index === result.destination.index) return;
    const reordered = Array.from(exercisesRef.current);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setExercises(reordered);
  }, [handleDragPointerMove]);

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handleDragPointerMove);
      window.removeEventListener('touchmove', handleDragPointerMove);
      if (autoScrollRAFRef.current) cancelAnimationFrame(autoScrollRAFRef.current);
    };
  }, [handleDragPointerMove]);

  // Persist the live workout session so it survives app kills
  const handleExerciseStateChange = useCallback((name, state) => {
    exerciseStateRef.current[name] = state;
    // Debounced session save — ensures completed sets survive app kills
    // (the previous save only fired when the exercise LIST changed, not when
    // individual sets were completed, so mid-workout kills lost all set data)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (cancelledRef.current || showSummary) return;
      saveWorkoutSession({
        templateId: templateRef.current?.id,
        templateName: templateRef.current?.name,
        startTime: startTimeRef.current,
        exercises: exercisesRef.current,
        bestSets: bestSetsRef.current,
        exerciseState: exerciseStateRef.current,
      });
    }, 1000);
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
    // Attach per-exercise notes so they persist on the template's exerciseList
    const exercisesWithNotes = exercises.map(ex => ({
      ...ex,
      note: exerciseStateRef.current[ex.name]?.note ?? ex.note ?? '',
    }));
    // onSaveHistory (→ processWorkoutSave) handles saving the exercise
    // composition, updated history, and lastPerformed all together.
    try {
      await onSaveHistory?.(template.id, allSets, exercisesWithNotes);
    } catch (e) {
      console.error('Save failed:', e);
    }
    setIsRestDay(isRestDayToday(allTemplates));
    setShowSummary(true);
    clearWorkoutSession();
    window.dispatchEvent(new CustomEvent('workoutSessionChanged'));
  }, [exercises, onSaveHistory, template?.id, allTemplates]);

  // Auto-finish the workout silently after 2 hours — saves progress and closes
  // without showing the summary or any notification.
  useEffect(() => {
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const msUntilStale = startTimeRef.current + TWO_HOURS - Date.now();
    if (msUntilStale <= 0) return; // already stale — handled on mount
    const timer = setTimeout(async () => {
      if (cancelledRef.current || showSummary) return;
      const allSets = {};
      for (const ex of exercisesRef.current) {
        const state = exerciseStateRef.current[ex.name];
        if (state?.completedSets) {
          const completed = Object.values(state.completedSets).filter(Boolean);
          if (completed.length > 0) allSets[ex.name] = completed;
        }
      }
      const exercisesWithNotes = exercisesRef.current.map(ex => ({
        ...ex,
        note: exerciseStateRef.current[ex.name]?.note ?? ex.note ?? '',
      }));
      try {
        await onSaveHistory?.(templateRef.current?.id, allSets, exercisesWithNotes);
      } catch {}
      clearWorkoutSession();
      window.dispatchEvent(new CustomEvent('workoutSessionChanged'));
      onFinish();
    }, msUntilStale);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
                    const { history: historyMap = {}, notes: notesMap = {} } = exerciseHistoryData;
                    const lowerNotes = {};
                    const lowerHistory = {};
                    Object.entries(notesMap).forEach(([k, v]) => { lowerNotes[k.toLowerCase()] = v; });
                    Object.entries(historyMap).forEach(([k, v]) => { lowerHistory[k.toLowerCase()] = v; });
                    // Also search workout templates for notes — notes may live on a
                    // template's exerciseList rather than the Exercise entity
                    const templateNotes = {};
                    allTemplates.forEach(t => {
                      (t.exerciseList || []).forEach(ex => {
                        if (ex.note && !templateNotes[ex.name.toLowerCase()]) {
                          templateNotes[ex.name.toLowerCase()] = ex.note;
                        }
                      });
                    });
                    setExercises(prev => {
                      const existing = new Set(prev.map(e => e.name));
                      const newOnes = picked.filter(e => !existing.has(e.name)).map(e => {
                        const key = e.name.toLowerCase();
                        return {
                          ...e,
                          sets: 1,
                          history: lowerHistory[key] || [],
                          note: lowerNotes[key] || templateNotes[key] || '',
                        };
                      });
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
            <div ref={scrollContainerRef} className={`flex-1 overflow-y-auto px-4 pt-2 pb-24 ${exerciseDragActive ? 'drag-active' : ''}`} data-workout-scroll>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
              </div>
              <div className="flex items-center gap-1.5 mt-3 mb-0.5">
                <CalendarDays className="w-4 h-4 text-gray-500 dark:text-gray-400" strokeWidth={1.5} />
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 font-display">{TODAY_STR}</p>
              </div>
              <div className="flex items-center gap-1.5 mb-3">
                <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" strokeWidth={1.5} />
                <TimerDisplay startTimestamp={startTimeRef.current} className="text-sm font-semibold text-gray-500 dark:text-gray-400 font-display" />
              </div>
              <div
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Note…"
                onFocus={() => setNoteFocused(true)}
                onBlur={() => setNoteFocused(false)}
                className={`w-fit max-w-full text-sm font-semibold text-blue-600 dark:text-blue-400 mb-4 -ml-1 focus:outline-none border rounded-full px-4 py-2 font-display transition-colors empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 dark:empty:before:text-gray-500 empty:before:font-semibold ${
                  noteFocused
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-white'
                    : 'bg-transparent border-transparent'
                }`}
              />

              <DragDropContext
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <Droppable droppableId="workout-exercises" direction="vertical">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {exercises.map((exercise, idx) => (
                        <ReorderableExercise
                          key={exercise.name}
                          exercise={exercise}
                          index={idx}
                          onBestSet={handleBestSet}
                          exerciseImage={exerciseImages[exercise.name.toLowerCase()]}
                          onDeleteExercise={() => handleDeleteExercise(idx)}
                          initialState={exerciseStateRef.current[exercise.name]}
                          onStateChange={(state) => handleExerciseStateChange(exercise.name, state)}
                          dragActive={exerciseDragActive}
                        />
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