import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const EXAMPLE_SPLITS = {
  'upper-lower': {
    name: 'Upper-Lower Split',
    description: 'Alternate between upper and lower body days',
    workouts: [
      {
        name: 'Upper Body Workout',
        emoji: '💪',
        exercises: [
          { name: 'Bench Press (Barbell)', muscle: 'Chest', sets: 4 },
          { name: 'Overhead Press (Dumbbell)', muscle: 'Shoulders', sets: 3 },
          { name: 'Pull Up', muscle: 'Back', sets: 3 },
          { name: 'Barbell Row', muscle: 'Back', sets: 3 },
          { name: 'Lateral Raise (Dumbbell)', muscle: 'Shoulders', sets: 3 },
          { name: 'Bicep Curl (Dumbbell)', muscle: 'Arms', sets: 3 },
          { name: 'Tricep Pushdown (Cable)', muscle: 'Arms', sets: 3 },
          { name: 'Face Pull', muscle: 'Shoulders', sets: 3 },
        ],
      },
      {
        name: 'Lower Body Workout',
        emoji: '🦵',
        exercises: [
          { name: 'Squat (Barbell)', muscle: 'Legs', sets: 4 },
          { name: 'Deadlift (Barbell)', muscle: 'Back', sets: 3 },
          { name: 'Leg Press', muscle: 'Legs', sets: 3 },
          { name: 'Leg Curl (Machine)', muscle: 'Legs', sets: 3 },
          { name: 'Leg Extension (Machine)', muscle: 'Legs', sets: 3 },
          { name: 'Calf Raise (Machine)', muscle: 'Legs', sets: 3 },
          { name: 'Crunch', muscle: 'Core', sets: 3 },
          { name: 'Plank', muscle: 'Core', sets: 3 },
        ],
      },
    ],
  },
  'push-pull-legs': {
    name: 'Push-Pull-Legs Split',
    description: 'Push day, pull day, legs day — 3-day rotation',
    workouts: [
      {
        name: 'Push Workout',
        emoji: '🏋️',
        subtitle: 'Chest + Triceps',
        exercises: [
          { name: 'Bench Press (Barbell)', muscle: 'Chest', sets: 4 },
          { name: 'Incline Bench Press (Dumbbell)', muscle: 'Chest', sets: 3 },
          { name: 'Dumbbell Fly', muscle: 'Chest', sets: 3 },
          { name: 'Overhead Press (Dumbbell)', muscle: 'Shoulders', sets: 3 },
          { name: 'Lateral Raise (Dumbbell)', muscle: 'Shoulders', sets: 3 },
          { name: 'Tricep Pushdown (Cable)', muscle: 'Arms', sets: 3 },
          { name: 'Skull Crusher', muscle: 'Arms', sets: 3 },
        ],
      },
      {
        name: 'Pull Workout',
        emoji: '🔙',
        subtitle: 'Back + Biceps',
        exercises: [
          { name: 'Deadlift (Barbell)', muscle: 'Back', sets: 4 },
          { name: 'Pull Up', muscle: 'Back', sets: 3 },
          { name: 'Barbell Row', muscle: 'Back', sets: 3 },
          { name: 'Seated Row (Machine)', muscle: 'Back', sets: 3 },
          { name: 'Face Pull', muscle: 'Shoulders', sets: 3 },
          { name: 'Bicep Curl (Dumbbell)', muscle: 'Arms', sets: 3 },
          { name: 'Hammer Curl', muscle: 'Arms', sets: 3 },
        ],
      },
      {
        name: 'Legs Workout',
        emoji: '🦵',
        subtitle: 'Legs + Abs',
        exercises: [
          { name: 'Squat (Barbell)', muscle: 'Legs', sets: 4 },
          { name: 'Romanian Deadlift (Barbell)', muscle: 'Legs', sets: 3 },
          { name: 'Leg Press', muscle: 'Legs', sets: 3 },
          { name: 'Leg Curl (Machine)', muscle: 'Legs', sets: 3 },
          { name: 'Leg Extension (Machine)', muscle: 'Legs', sets: 3 },
          { name: 'Calf Raise (Machine)', muscle: 'Legs', sets: 3 },
          { name: 'Crunch', muscle: 'Core', sets: 3 },
          { name: 'Plank', muscle: 'Core', sets: 3 },
        ],
      },
    ],
  },
  'full-body': {
    name: 'Full Body Split',
    description: 'Train every muscle group in one session',
    workouts: [
      {
        name: 'Full Body Workout',
        emoji: '🔥',
        subtitle: 'Chest • Back • Shoulders • Arms • Legs • Core',
        exercises: [
          { name: 'Squat (Barbell)', muscle: 'Legs', sets: 4 },
          { name: 'Bench Press (Barbell)', muscle: 'Chest', sets: 4 },
          { name: 'Barbell Row', muscle: 'Back', sets: 3 },
          { name: 'Overhead Press (Dumbbell)', muscle: 'Shoulders', sets: 3 },
          { name: 'Romanian Deadlift (Barbell)', muscle: 'Legs', sets: 3 },
          { name: 'Pull Up', muscle: 'Back', sets: 3 },
          { name: 'Lateral Raise (Dumbbell)', muscle: 'Shoulders', sets: 3 },
          { name: 'Bicep Curl (Dumbbell)', muscle: 'Arms', sets: 3 },
          { name: 'Tricep Pushdown (Cable)', muscle: 'Arms', sets: 3 },
          { name: 'Plank', muscle: 'Core', sets: 3 },
        ],
      },
    ],
  },
  'ul-ppl': {
    name: 'U L P P L Split',
    description: 'Upper-Lower then Push-Pull-Legs — 5-day rotation',
    workouts: [
      {
        name: 'Upper Body Workout',
        emoji: '💪',
        subtitle: 'Chest • Back • Shoulders • Arms',
        exercises: [
          { name: 'Bench Press (Barbell)', muscle: 'Chest', sets: 4 },
          { name: 'Overhead Press (Dumbbell)', muscle: 'Shoulders', sets: 3 },
          { name: 'Pull Up', muscle: 'Back', sets: 3 },
          { name: 'Barbell Row', muscle: 'Back', sets: 3 },
          { name: 'Lateral Raise (Dumbbell)', muscle: 'Shoulders', sets: 3 },
          { name: 'Bicep Curl (Dumbbell)', muscle: 'Arms', sets: 3 },
          { name: 'Tricep Pushdown (Cable)', muscle: 'Arms', sets: 3 },
          { name: 'Face Pull', muscle: 'Shoulders', sets: 3 },
        ],
      },
      {
        name: 'Lower Body Workout',
        emoji: '🦵',
        subtitle: 'Quads • Hamstrings • Glutes • Core',
        exercises: [
          { name: 'Squat (Barbell)', muscle: 'Legs', sets: 4 },
          { name: 'Deadlift (Barbell)', muscle: 'Back', sets: 3 },
          { name: 'Leg Press', muscle: 'Legs', sets: 3 },
          { name: 'Leg Curl (Machine)', muscle: 'Legs', sets: 3 },
          { name: 'Leg Extension (Machine)', muscle: 'Legs', sets: 3 },
          { name: 'Calf Raise (Machine)', muscle: 'Legs', sets: 3 },
          { name: 'Crunch', muscle: 'Core', sets: 3 },
          { name: 'Plank', muscle: 'Core', sets: 3 },
        ],
      },
      {
        name: 'Push Workout',
        emoji: '🏋️',
        subtitle: 'Chest • Shoulders • Triceps',
        exercises: [
          { name: 'Bench Press (Barbell)', muscle: 'Chest', sets: 4 },
          { name: 'Incline Bench Press (Dumbbell)', muscle: 'Chest', sets: 3 },
          { name: 'Dumbbell Fly', muscle: 'Chest', sets: 3 },
          { name: 'Overhead Press (Dumbbell)', muscle: 'Shoulders', sets: 3 },
          { name: 'Lateral Raise (Dumbbell)', muscle: 'Shoulders', sets: 3 },
          { name: 'Tricep Pushdown (Cable)', muscle: 'Arms', sets: 3 },
          { name: 'Skull Crusher', muscle: 'Arms', sets: 3 },
        ],
      },
      {
        name: 'Pull Workout',
        emoji: '🔙',
        subtitle: 'Back • Biceps',
        exercises: [
          { name: 'Deadlift (Barbell)', muscle: 'Back', sets: 4 },
          { name: 'Pull Up', muscle: 'Back', sets: 3 },
          { name: 'Barbell Row', muscle: 'Back', sets: 3 },
          { name: 'Seated Row (Machine)', muscle: 'Back', sets: 3 },
          { name: 'Face Pull', muscle: 'Shoulders', sets: 3 },
          { name: 'Bicep Curl (Dumbbell)', muscle: 'Arms', sets: 3 },
          { name: 'Hammer Curl', muscle: 'Arms', sets: 3 },
        ],
      },
      {
        name: 'Legs Workout',
        emoji: '🦿',
        subtitle: 'Quads • Hamstrings • Calves • Abs',
        exercises: [
          { name: 'Squat (Barbell)', muscle: 'Legs', sets: 4 },
          { name: 'Romanian Deadlift (Barbell)', muscle: 'Legs', sets: 3 },
          { name: 'Leg Press', muscle: 'Legs', sets: 3 },
          { name: 'Leg Curl (Machine)', muscle: 'Legs', sets: 3 },
          { name: 'Leg Extension (Machine)', muscle: 'Legs', sets: 3 },
          { name: 'Calf Raise (Machine)', muscle: 'Legs', sets: 3 },
          { name: 'Crunch', muscle: 'Core', sets: 3 },
          { name: 'Plank', muscle: 'Core', sets: 3 },
        ],
      },
    ],
  },
};

export default function SplitDetailModal({ splitKey, onClose }) {
  const navigate = useNavigate();
  const [applying, setApplying] = useState(false);
  const split = EXAMPLE_SPLITS[splitKey];

  if (!split) return null;

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
        exercises: w.exercises.map(e => e.name).join(', '),
        exerciseList: w.exercises.map(e => ({ ...e, history: [] })),
        lastPerformed: null,
        sort_order: i,
        isActiveSplit: true,
        splitGroup: newGroupId,
      }));
      await base44.entities.WorkoutTemplate.bulkCreate(newTemplates);
    } catch (_) {}
    setApplying(false);
    navigate('/');
  };

  const handleStart = async (workout) => {
    const exerciseList = workout.exercises.map(e => ({ ...e, history: [] }));
    const exercisesStr = workout.exercises.map(e => e.name).join(', ');
    const template = await base44.entities.WorkoutTemplate.create({
      name: workout.name,
      exercises: exercisesStr,
      exerciseList,
      lastPerformed: null,
      isActiveSplit: true,
      splitGroup: Date.now().toString(),
    });
    navigate(`/active-workout/${template.id}`);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative bg-card rounded-t-3xl w-full px-5 pt-5 shadow-2xl flex flex-col gap-4 overflow-y-auto"
        style={{ maxHeight: '80vh', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex justify-center mb-1">
          <div className="w-10 h-1 rounded-full bg-muted" />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-foreground">{split.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{split.description}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        <div className="flex flex-col gap-3 pb-2">
          {split.workouts.map((workout, idx) => (
            <div
              key={idx}
              className="bg-muted rounded-2xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-xl flex-shrink-0">
                  {workout.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-foreground text-base">{workout.name}</h3>
                  {workout.subtitle && (
                    <p className="text-xs text-muted-foreground">{workout.subtitle}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {workout.exercises.map((ex, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background text-xs text-muted-foreground"
                  >
                    <Dumbbell className="w-3 h-3" />
                    {ex.name}
                  </span>
                ))}
              </div>

              <button
                onClick={() => handleStart(workout)}
                className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition"
              >
                Start {workout.name}
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleMakeCurrent}
          disabled={applying}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition disabled:opacity-60"
        >
          {applying ? 'Applying...' : 'Make This My Current Split'}
        </button>
      </div>
    </div>,
    document.body
  );
}