import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

function loadCustomSchedule(splitKey, fallback) {
  try {
    const raw = localStorage.getItem(`splitSchedule_${splitKey}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return fallback;
}

function saveCustomSchedule(splitKey, schedule) {
  localStorage.setItem(`splitSchedule_${splitKey}`, JSON.stringify(schedule));
}

export default function SplitModal({ splitKey, onClose }) {
  const navigate = useNavigate();
  const [applying, setApplying] = useState(false);
  const [customSplit, setCustomSplit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const exampleSplit = EXAMPLE_SPLITS_DATA[splitKey];
  const defaultSchedule = exampleSplit?.schedule || [1, 0, 1, 0, 1, 0, 1];

  const [customSchedule, setCustomSchedule] = useState(() =>
    loadCustomSchedule(splitKey, defaultSchedule)
  );

  // When the modal opens for a different split, reload schedule
  useEffect(() => {
    setCustomSchedule(loadCustomSchedule(splitKey, defaultSchedule));
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

  const handleMakeCurrent = async () => {
    setApplying(true);
    const newGroupId = Date.now().toString();
    const oldGroupId = Date.now().toString() + '_old';
    try {
      const allTemplates = await base44.entities.WorkoutTemplate.list('sort_order', 100);
      const currentActive = allTemplates.filter(
        t => t.isActiveSplit === true || (!t.splitGroup || t.splitGroup === '')
      );
      await Promise.all(currentActive.map(t =>
        base44.entities.WorkoutTemplate.update(t.id, { isActiveSplit: false, splitGroup: oldGroupId })
      ));
      const newTemplates = split.workouts.map((w, i) => ({
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

  const handleToggleDay = (i) => {
    const next = [...customSchedule];
    next[i] = next[i] === 0 ? 1 : 0;
    setCustomSchedule(next);
    saveCustomSchedule(splitKey, next);
  };

  const todayIndex = new Date().getDay();
  const todayMonSun = todayIndex === 0 ? 6 : todayIndex - 1;

  const cycleLabel = useMemo(() => {
    const days = customSchedule.map(s => s === 0 ? 'Rest' : 'Train').join(' — ');
    return days;
  }, [customSchedule]);

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
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-muted hover:bg-muted/70 transition -ml-2"
                >
                  <ArrowLeft className="w-5 h-5 text-foreground" />
                </button>
                <div className="text-center">
                  <h2 className="text-lg font-extrabold text-foreground">{split.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{split.description}</p>
                </div>
                <button
                  onClick={() => setEditing(e => !e)}
                  className={`w-11 h-11 flex items-center justify-center rounded-full transition ${
                    editing
                      ? 'bg-blue-500 text-white'
                      : 'bg-muted hover:bg-muted/70 text-muted-foreground'
                  }`}
                >
                  <Dumbbell className="w-5 h-5" />
                </button>
              </div>

              {/* Rest day editor — inline calendar row */}
              {editing && (
                <div className="px-5 py-4 border-b border-border bg-blue-50/50 dark:bg-blue-950/10">
                  <p className="text-xs font-semibold text-muted-foreground mb-3 text-center uppercase tracking-wider">
                    Rest Day Frequency — Tap to toggle
                  </p>

                  {/* Day letters */}
                  <div className="flex justify-between mb-1.5">
                    {DAY_LETTERS.map((l, i) => (
                      <span key={i} className="text-[10px] font-bold text-muted-foreground w-9 text-center">
                        {l}
                      </span>
                    ))}
                  </div>

                  {/* Tappable dots */}
                  <div className="flex justify-between">
                    {customSchedule.map((status, i) => {
                      const isGymDay = status === 1;
                      const isToday = i === todayMonSun;
                      return (
                        <div key={i} className="flex items-center w-9 justify-center">
                          <div
                            onClick={() => handleToggleDay(i)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-90 ${
                              isGymDay
                                ? 'bg-blue-500 shadow-md shadow-blue-500/30'
                                : 'border-2 border-blue-300 dark:border-blue-700 bg-transparent'
                            } ${
                              isToday
                                ? 'ring-[2px] ring-emerald-500 ring-offset-1 ring-offset-card'
                                : ''
                            }`}
                          >
                            {isGymDay && (
                              <span className="text-[10px] font-bold text-white">▼</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cycle label */}
                  <p className="text-[10px] font-medium text-muted-foreground text-center mt-3 leading-relaxed">
                    {cycleLabel}
                  </p>

                  {/* Done button */}
                  <button
                    onClick={() => setEditing(false)}
                    className="w-full mt-3 py-2 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition"
                  >
                    Done
                  </button>
                </div>
              )}

              {/* Workout cards */}
              <div className="flex-1 overflow-y-auto px-5 pt-4 pb-3">
                <div className="flex flex-col gap-3">
                  {split.workouts.map((workout, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleViewWorkout(workout)}
                      className="relative bg-card border border-blue-400/30 rounded-xl p-4 shadow-lg shadow-blue-500/10 ring-1 ring-blue-400/10 hover:shadow-xl hover:scale-[1.02] transition-all duration-150 cursor-pointer"
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
                  ))}
                </div>
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