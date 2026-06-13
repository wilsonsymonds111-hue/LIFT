import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Dumbbell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { EXAMPLE_SPLITS_DATA } from '../lib/splitData';

export default function SplitDetail() {
  const { key } = useParams();
  const navigate = useNavigate();
  const [applying, setApplying] = useState(false);
  const split = EXAMPLE_SPLITS_DATA[key];

  if (!split) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Split not found</p>
        <button onClick={() => navigate(-1)} className="text-blue-500 font-semibold">Go back</button>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-muted hover:bg-muted/70 transition -ml-2"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-extrabold text-foreground">{split.name}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{split.description}</p>
        </div>
        <div className="w-11" />
      </div>

      <div className="flex flex-col gap-3 px-5 pt-5">
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

      <div className="px-5 pt-4">
        <button
          onClick={handleMakeCurrent}
          disabled={applying}
          className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition disabled:opacity-60"
        >
          {applying ? 'Applying...' : 'Make This My Current Split'}
        </button>
      </div>
    </div>
  );
}