import { useState, useEffect, useRef, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { History } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ExercisePicker from './ExercisePicker';
import RestTimerPicker from './RestTimerPicker';
import { RestTimerModal, RestTimerPill } from './RestTimerModal';
import { ensureExerciseDetail } from '../lib/ensureExerciseDetail';
import { getExerciseDetailList } from '../lib/exerciseCache';
import { useExerciseHistory } from '../hooks/useExerciseHistory';
import { useTimer } from '../hooks/useTimer';
import { notifyRestComplete } from '../lib/workoutSounds';
import ExerciseSection from './workout/ExerciseSection';
import SummaryScreen from './workout/SummaryScreen';

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
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showRestTimerPicker, setShowRestTimerPicker] = useState(false);
  const [globalRestDuration, setGlobalRestDuration] = useState(120);
  const [restActive, setRestActive] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const [restMinimized, setRestMinimized] = useState(false);
  const restIntervalRef = useRef(null);
  const restEndRef = useRef(null);
  const { display: timer } = useTimer();
  const bestSetsRef = useRef({});

  const startRestTimer = (duration) => {
    clearInterval(restIntervalRef.current);
    const end = Date.now() + duration * 1000;
    restEndRef.current = end;
    setRestTotal(duration);
    setRestSeconds(duration);
    setRestActive(true);
    setRestMinimized(false);
    const tick = () => {
      const remaining = Math.round((restEndRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(restIntervalRef.current);
        setRestSeconds(0);
        setRestActive(false);
        notifyRestComplete();
      } else {
        setRestSeconds(remaining);
      }
    };
    restIntervalRef.current = setInterval(tick, 250);
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
          notifyRestComplete();
        } else {
          setRestSeconds(remaining);
        }
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [restActive]);

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

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
    setExercises(prev => prev.map(ex => ({
      ...ex,
      history: exerciseHistoryData[ex.name] || ex.history || [],
    })));
  }, [exerciseHistoryData]);

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
      {!minimized && <div className="fixed inset-0 z-30 bg-black/50 pointer-events-none" />}

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

      <div className={`fixed inset-x-0 bottom-0 z-40 bg-background rounded-t-3xl shadow-2xl transition-all duration-300 ease-in-out flex flex-col ${minimized ? 'h-0 overflow-hidden' : 'h-[95vh]'}`}
        style={!minimized ? { paddingTop: 'env(safe-area-inset-top)' } : undefined}
      >
        <div className="flex justify-center pt-3 pb-1 cursor-pointer flex-shrink-0" onClick={() => setMinimized(true)}>
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <>
            <div className="relative flex items-center justify-between px-4 pt-2 pb-2 flex-shrink-0">
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