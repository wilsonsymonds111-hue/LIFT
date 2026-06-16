import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Dumbbell, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import { EXAMPLE_SPLITS_DATA } from '../lib/splitData';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function relativeTime(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  if (diffMs < 60000) return 'Just now';
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function loadCycle(splitKey, fallbackSchedule) {
  try {
    const raw = localStorage.getItem(`splitCycle_${splitKey}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Compute default cycle from the fallback schedule (longest consecutive runs)
  let maxOn = 0, maxOff = 0, curOn = 0, curOff = 0;
  for (let i = 0; i < fallbackSchedule.length; i++) {
    if (fallbackSchedule[i] === 1) {
      curOn++;
      if (curOff > maxOff) maxOff = curOff;
      curOff = 0;
    } else {
      curOff++;
      if (curOn > maxOn) maxOn = curOn;
      curOn = 0;
    }
  }
  if (curOn > maxOn) maxOn = curOn;
  if (curOff > maxOff) maxOff = curOff;
  const startDayIndex = fallbackSchedule.findIndex(s => s === 1);
  return { onDays: maxOn || 1, offDays: maxOff || 1, startDayIndex: startDayIndex >= 0 ? startDayIndex : 0 };
}

function saveCycle(splitKey, cycle) {
  localStorage.setItem(`splitCycle_${splitKey}`, JSON.stringify(cycle));
}

function cycleToSchedule(onDays, offDays, startDayIndex) {
  const cycleLength = onDays + offDays;
  const schedule = [];
  for (let i = 0; i < 7; i++) {
    const pos = ((i - startDayIndex) % cycleLength + cycleLength) % cycleLength;
    schedule.push(pos < onDays ? 1 : 0);
  }
  return schedule;
}

export default function SplitModal({ splitKey, onClose }) {
  const navigate = useNavigate();
  const [applying, setApplying] = useState(false);
  const [customSplit, setCustomSplit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const exampleSplit = EXAMPLE_SPLITS_DATA[splitKey];
  const defaultSchedule = exampleSplit?.schedule || [1, 0, 1, 0, 1, 0, 1];

  const defaultCycle = useMemo(() => loadCycle(splitKey, defaultSchedule), [splitKey]);
  const [onDays, setOnDays] = useState(defaultCycle.onDays);
  const [offDays, setOffDays] = useState(defaultCycle.offDays);
  const [startDayIndex, setStartDayIndex] = useState(defaultCycle.startDayIndex);

  const previewSchedule = useMemo(
    () => cycleToSchedule(onDays, offDays, startDayIndex),
    [onDays, offDays, startDayIndex]
  );

  // When the modal opens for a different split, reload cycle
  useEffect(() => {
    const c = loadCycle(splitKey, defaultSchedule);
    setOnDays(c.onDays);
    setOffDays(c.offDays);
    setStartDayIndex(c.startDayIndex);
    setEditing(false);
  }, [splitKey]);

  useEffect(() => {
    if (!exampleSplit && splitKey) {
      setLoading(true);
      base44.entities.WorkoutTemplate.list('sort_order', 100).then(data => {
        const templates = (data || []).filter(t => t.splitGroup === splitKey);
        if (templates.length > 0) {
          setCustomSplit({
            name: templates.map(t => t.name.replace(/ Workout$/, '').replace(/(?<!Full) Body$/, '')).join(' / ').toUpperCase(),
            description: `${templates.length} workout${templates.length > 1 ? 's' : ''}`,
            workouts: templates.map(t => ({
              name: t.name,
              exercisesText: t.exercises || (t.exerciseList || []).map(e => e.name).join(', '),
              exerciseCount: (t.exerciseList || []).length,
              lastPerformed: t.lastPerformed,
              exercises: (t.exerciseList || []).map(e => ({ name: e.name })),
              templateId: t.id,
            })),
          });
        }
        setLoading(false);
      });
    }
  }, [splitKey, exampleSplit]);

  const split = exampleSplit || customSplit;

  const [orderedWorkouts, setOrderedWorkouts] = useState([]);
  useEffect(() => {
    if (split?.workouts) setOrderedWorkouts([...split.workouts]);
  }, [split]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = [...orderedWorkouts];
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setOrderedWorkouts(items);
  };

  const handleMakeCurrent = async () => {
    setApplying(true);
    const newGroupId = Date.now().toString();
    const oldGroupId = Date.now().toString() + '_old';
    // Save the cycle so the Home page can read it
    saveCycle(splitKey, { onDays, offDays, startDayIndex });
    try {
      const allTemplates = await base44.entities.WorkoutTemplate.list('sort_order', 100);
      const currentActive = allTemplates.filter(
        t => t.isActiveSplit === true || (!t.splitGroup || t.splitGroup === '')
      );
      await Promise.all(currentActive.map(t =>
        base44.entities.WorkoutTemplate.update(t.id, { isActiveSplit: false, splitGroup: oldGroupId })
      ));
      const workouts = orderedWorkouts.length > 0 ? orderedWorkouts : split.workouts;
      const newTemplates = workouts.map((w, i) => ({
        name: w.name,
        exercises: (w.exercises || []).map(e => e.name).join(', '),
        exerciseList: (w.exercises || []).map(e => ({ ...e, history: [] })),
        lastPerformed: null,
        sort_order: i,
        isActiveSplit: true,
        splitGroup: newGroupId,
      }));
      await base44.entities.WorkoutTemplate.bulkCreate(newTemplates);
    } catch (_) {}
    setApplying(false);
    onClose();
    navigate('/');
  };

  const handleViewWorkout = async (workout) => {
    if (workout.templateId) {
      onClose();
      navigate(`/template/${workout.templateId}`);
      return;
    }
    setApplying(true);
    const exerciseList = workout.exercises.map(e => ({ ...e, history: [] }));
    const exercisesStr = workout.exercises.map(e => e.name).join(', ');
    const template = await base44.entities.WorkoutTemplate.create({
      name: workout.name,
      exercises: exercisesStr,
      exerciseList,
      lastPerformed: null,
      isActiveSplit: false,
      splitGroup: splitKey,
    });
    setApplying(false);
    onClose();
    navigate(`/template/${template.id}`);
  };

  const todayIndex = new Date().getDay();
  const todayMonSun = todayIndex === 0 ? 6 : todayIndex - 1;

  const frequencyLabel = useMemo(() => {
    const onPart = `${onDays} day${onDays !== 1 ? 's' : ''} on`;
    const offPart = `${offDays} day${offDays !== 1 ? 's' : ''} off`;
    return `${onPart}, ${offPart}, repeat`;
  }, [onDays, offDays]);

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="relative bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg flex flex-col shadow-2xl overflow-hidden"
          style={{ maxHeight: '90vh', paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {loading || !split ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-border">
                <button
                  onClick={onClose}
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-muted hover:bg-blue-500 transition group -ml-2"
                >
                  <ArrowLeft className="w-5 h-5 text-foreground group-hover:text-white transition" />
                </button>
                <div className="text-center">
                  <h2 className="text-lg font-extrabold text-foreground">{split.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{split.description}</p>
                </div>
                <button
                  onClick={() => setEditing(e => !e)}
                  className={`w-11 h-11 flex items-center justify-center rounded-full transition group ${
                    editing
                      ? 'bg-blue-500 text-white'
                      : 'bg-muted hover:bg-blue-500 text-muted-foreground'
                  }`}
                >
                  <Pencil className={`w-5 h-5 ${editing ? '' : 'group-hover:text-white'} transition`} />
                </button>
              </div>

              {/* Cycle editor */}
              {editing && (
                <div className="px-5 py-4 border-b border-border bg-blue-50/50 dark:bg-blue-950/10">
                  <p className="text-xs font-semibold text-muted-foreground mb-4 text-center uppercase tracking-wider">
                    Cycle Settings
                  </p>

                  {/* Days on / off inputs */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Days On</label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={onDays}
                        onChange={(e) => setOnDays(Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))}
                        className="w-full bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm font-bold text-foreground text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Days Off</label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={offDays}
                        onChange={(e) => setOffDays(Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))}
                        className="w-full bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-sm font-bold text-foreground text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Frequency summary */}
                  <p className="text-sm font-bold text-foreground text-center mb-4">
                    {frequencyLabel}
                  </p>

                  {/* Combined start-day selector + preview */}
                  <p className="text-[10px] font-bold text-muted-foreground uppercase text-center mb-2">
                    Tap a day to set cycle start
                  </p>
                  <div className="flex justify-between gap-1 mb-3">
                    {previewSchedule.map((status, i) => {
                      const isGymDay = status === 1;
                      const isToday = i === todayMonSun;
                      const isStart = startDayIndex === i;
                      return (
                        <button
                          key={i}
                          onClick={() => setStartDayIndex(i)}
                          className={`flex flex-col items-center flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                            isStart
                              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                              : 'bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 hover:border-blue-400'
                          } ${isToday && !isStart ? 'ring-[2px] ring-emerald-500 ring-offset-1' : ''}`}
                        >
                          <span className={`${isStart ? 'text-white/80' : 'text-muted-foreground'} text-[10px]`}>{DAY_LABELS[i]}</span>
                          <div
                            className={`w-5 h-5 mt-1 rounded-full flex items-center justify-center ${
                              isGymDay
                                ? isStart ? 'bg-white/30' : 'bg-blue-500 shadow-sm shadow-blue-500/30'
                                : isStart ? 'border-2 border-white/40' : 'border-2 border-blue-300 dark:border-blue-700'
                            } ${isToday && !isStart ? 'ring-[1.5px] ring-emerald-500 ring-offset-1' : ''}`}
                          >
                            {isGymDay && <Dumbbell className={`w-2.5 h-2.5 ${isStart ? 'text-white' : 'text-white'}`} strokeWidth={2.5} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Done button */}
                  <button
                    onClick={() => {
                      saveCycle(splitKey, { onDays, offDays, startDayIndex });
                      setEditing(false);
                    }}
                    className="w-full mt-4 py-2 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition"
                  >
                    Done
                  </button>
                </div>
              )}

              {/* Workout cards — drag to reorder */}
              <div className="flex-1 overflow-y-auto px-5 pt-4 pb-3">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="workout-list">
                    {(provided) => (
                      <div className="flex flex-col gap-3" ref={provided.innerRef} {...provided.droppableProps}>
                        {orderedWorkouts.map((workout, idx) => (
                          <Draggable key={workout.name + idx} draggableId={workout.name + idx} index={idx}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`relative bg-card border border-blue-400/30 rounded-xl p-4 shadow-lg shadow-blue-500/10 ring-1 ring-blue-400/10 hover:shadow-xl transition-all duration-150 cursor-pointer ${
                                  snapshot.isDragging ? 'shadow-2xl scale-[1.03] z-10' : ''
                                }`}
                              >
                                <div
                                  onClick={() => handleViewWorkout(workout)}
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing"
                                >
                                  <h4 className="font-bold text-foreground pr-8">{workout.name}</h4>
                                  <div className="flex flex-wrap gap-1.5 my-3">
                                    {(workout.exercises || []).map((e, i) => (
                                      <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium">
                                        {e.name}
                                      </span>
                                    ))}
                                  </div>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    ⏱ {workout.lastPerformed ? relativeTime(workout.lastPerformed) : 'Not yet performed'}
                                  </p>
                                </div>
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

              {/* Make Current button */}
              <div className="px-5 pb-4 pt-2">
                <button
                  onClick={handleMakeCurrent}
                  disabled={applying}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition disabled:opacity-60"
                >
                  {applying ? 'Applying...' : 'Make This My Current Split'}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}