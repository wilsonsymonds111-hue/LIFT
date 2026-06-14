import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, Plus, Dumbbell, Check, Sparkles, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import ExercisePicker from './ExercisePicker';

const WORKOUT_LABELS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

export default function SplitBuilder({ onClose, onSaved }) {
  const [step, setStep] = useState(1);
  const [workoutCount, setWorkoutCount] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [editingWorkoutIdx, setEditingWorkoutIdx] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [splitName, setSplitName] = useState('');

  const handlePickCount = (count) => {
    setWorkoutCount(count);
    setWorkouts(Array.from({ length: count }, (_, i) => ({
      name: `Workout ${i + 1}`,
      exercises: [],
    })));
    setStep(2);
  };

  const handleAddExercises = (idx, exercises) => {
    setWorkouts(prev => {
      const updated = [...prev];
      const existing = updated[idx].exercises;
      const newList = [...existing];
      exercises.forEach(ex => {
        if (!newList.find(e => e.name === ex.name)) {
          newList.push({ ...ex, sets: 3, history: [] });
        }
      });
      updated[idx] = { ...updated[idx], exercises: newList };
      return updated;
    });
    setEditingWorkoutIdx(null);
  };

  const handleRemoveExercise = (workoutIdx, exerciseIdx) => {
    setWorkouts(prev => {
      const updated = [...prev];
      const exs = [...updated[workoutIdx].exercises];
      exs.splice(exerciseIdx, 1);
      updated[workoutIdx] = { ...updated[workoutIdx], exercises: exs };
      return updated;
    });
  };

  const handleNameChange = (idx, name) => {
    setWorkouts(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], name };
      return updated;
    });
  };

  const allWorkoutsNamed = workouts.every(w => w.name.trim());
  const allWorkoutsHaveExercises = workouts.every(w => w.exercises.length > 0);

  const handleSave = async () => {
    if (!allWorkoutsNamed || !allWorkoutsHaveExercises) return;
    setSaving(true);
    const groupId = Date.now().toString();
    try {
      const templates = workouts.map((w, i) => ({
        name: w.name.trim(),
        exercises: w.exercises.map(e => e.name).join(', '),
        exerciseList: w.exercises,
        lastPerformed: null,
        sort_order: i,
        isActiveSplit: false,
        splitGroup: groupId,
      }));
      await base44.entities.WorkoutTemplate.bulkCreate(templates);
      setSaved(true);
      setTimeout(() => {
        setSaving(false);
        onSaved();
      }, 1800);
    } catch (_) {
      setSaving(false);
    }
  };

  const populatedCount = workouts.filter(w => w.exercises.length > 0).length;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={saved ? undefined : onClose} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative bg-card rounded-t-3xl w-full flex flex-col shadow-2xl overflow-hidden"
        style={{ maxHeight: '90vh', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        {/* Success Animation Overlay */}
        {saved && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-30 bg-card flex flex-col items-center justify-center gap-4 rounded-t-3xl"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', damping: 8 }}
              >
                <Check className="w-10 h-10 text-white" />
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <div className="flex items-center gap-1.5 justify-center mb-1">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <h3 className="text-lg font-extrabold text-foreground">{splitName || 'Split Created!'}</h3>
                <Sparkles className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                {workoutCount} workout{workoutCount > 1 ? 's' : ''} saved — find it in My Splits
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
          {step === 1 ? (
            <>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
                <X className="w-4 h-4 text-foreground" />
              </button>
              <span className="font-extrabold text-foreground text-base">New Split</span>
              <div className="w-8" />
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>
              <input
                value={splitName}
                onChange={e => setSplitName(e.target.value)}
                placeholder="Name your split"
                className="flex-1 mx-3 bg-transparent font-extrabold text-foreground text-base text-center focus:outline-none placeholder:text-muted-foreground/50"
              />
              <button
                onClick={handleSave}
                disabled={!allWorkoutsNamed || !allWorkoutsHaveExercises || saving || saved}
                className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          )}
        </div>

        {/* Step 1: Choose number of workouts */}
        {step === 1 && (
          <div className="flex-1 overflow-y-auto px-5 py-6">
            <p className="text-sm text-muted-foreground mb-5 text-center">
              How many different workouts in this split?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {WORKOUT_LABELS.map((label, i) => {
                const count = i + 1;
                return (
                  <button
                    key={count}
                    onClick={() => handlePickCount(count)}
                    className={`relative py-5 rounded-2xl border-2 font-bold text-lg transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${
                      workoutCount === count
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 shadow-md shadow-blue-500/10'
                        : 'border-border bg-card text-foreground hover:border-blue-400 hover:shadow-md'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{count}</span>
                    <span className="text-sm font-semibold">
                      {count === 1 ? 'Workout' : 'Workouts'}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              {workoutCount === 1
                ? 'One full body workout on repeat.'
                : `${workoutCount} different workouts you'll alternate between.`}
            </p>
          </div>
        )}

        {/* Step 2: Build each workout */}
        {step === 2 && (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="flex flex-col gap-3">
              {workouts.map((workout, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl border-2 transition-all duration-150 overflow-hidden ${
                    workout.exercises.length > 0
                      ? 'border-blue-400/50 bg-blue-50/30 dark:bg-blue-950/20'
                      : 'border-dashed border-border bg-muted/30'
                  }`}
                >
                  {/* Workout header */}
                  <div className="flex items-center gap-3 p-4">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0 ${
                      workout.exercises.length > 0
                        ? 'bg-blue-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="relative">
                        <input
                          value={workout.name}
                          onChange={e => handleNameChange(idx, e.target.value)}
                          placeholder={`Workout ${idx + 1}`}
                          className="w-full bg-transparent font-bold text-foreground text-sm focus:outline-none placeholder:text-muted-foreground/60 border-b border-dashed border-muted-foreground/20 focus:border-blue-500 pb-0.5 pr-5"
                        />
                        <Pencil className="absolute right-0 top-0 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {workout.exercises.length > 0
                          ? `${workout.exercises.length} exercise${workout.exercises.length > 1 ? 's' : ''}`
                          : 'Tap to add exercises'}
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingWorkoutIdx(idx)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white transition active:scale-95"
                    >
                      {workout.exercises.length > 0 ? 'Edit' : 'Build'}
                    </button>
                  </div>

                  {/* Exercise list */}
                  {workout.exercises.length > 0 && (
                    <div className="px-4 pb-3">
                      <div className="flex flex-wrap gap-1.5">
                        {workout.exercises.map((ex, exIdx) => (
                          <span
                            key={exIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-black/20 text-xs font-medium text-foreground border border-border"
                          >
                            <Dumbbell className="w-3 h-3 text-blue-500" />
                            {ex.name}
                            <button
                              onClick={() => handleRemoveExercise(idx, exIdx)}
                              className="ml-0.5 w-4 h-4 rounded-full hover:bg-red-100 flex items-center justify-center transition"
                            >
                              <X className="w-2.5 h-2.5 text-red-400" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Empty state hint when no workouts have exercises */}
            {populatedCount === 0 && (
              <p className="text-center text-sm text-muted-foreground mt-8">
                Tap "Build" on any workout card to start adding exercises.
              </p>
            )}
          </div>
        )}

        {/* Exercise Picker */}
        {editingWorkoutIdx !== null && (
          <ExercisePicker
            onClose={() => setEditingWorkoutIdx(null)}
            onAdd={(exercises) => handleAddExercises(editingWorkoutIdx, exercises)}
          />
        )}
      </motion.div>
    </div>,
    document.body
  );
}