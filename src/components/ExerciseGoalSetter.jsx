import { useState } from 'react';
import { Target, Check, X, Pencil, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { invalidateExerciseGoalsCache } from '../hooks/useExerciseGoals';

export default function ExerciseGoalSetter({ exerciseName, goal, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [kg, setKg] = useState(goal?.kg ?? '');
  const [reps, setReps] = useState(goal?.reps ?? '');
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setKg(goal?.kg ?? '');
    setReps(goal?.reps ?? '');
    setEditing(true);
  };

  const handleSave = async () => {
    const kgVal = parseFloat(kg) || 0;
    const repsVal = parseInt(reps) || 0;
    if (kgVal <= 0 && repsVal <= 0) return;
    setSaving(true);
    try {
      const results = await base44.entities.Exercise.filter({ name: exerciseName });
      if (results.length > 0) {
        await base44.entities.Exercise.update(results[0].id, { goal: { kg: kgVal, reps: repsVal } });
      } else {
        await base44.entities.Exercise.create({ name: exerciseName, goal: { kg: kgVal, reps: repsVal } });
      }
      invalidateExerciseGoalsCache();
      onSaved?.({ kg: kgVal, reps: repsVal });
      setEditing(false);
    } catch (e) {
      console.error('Failed to save goal:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const results = await base44.entities.Exercise.filter({ name: exerciseName });
      if (results.length > 0) {
        await base44.entities.Exercise.update(results[0].id, { goal: null });
      }
      invalidateExerciseGoalsCache();
      onSaved?.(null);
    } catch (e) {
      console.error('Failed to delete goal:', e);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-3 border border-blue-200/60 dark:border-blue-800/40">
        <p className="text-xs font-semibold text-foreground mb-2">Set Target Goal</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.5"
            inputMode="decimal"
            placeholder="kg"
            value={kg}
            onChange={e => setKg(e.target.value)}
            className="w-20 border border-gray-200 dark:border-border rounded-lg px-2.5 py-2 text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <span className="text-sm text-muted-foreground font-medium">kg ×</span>
          <input
            type="number"
            step="1"
            inputMode="numeric"
            placeholder="reps"
            value={reps}
            onChange={e => setReps(e.target.value)}
            className="w-20 border border-gray-200 dark:border-border rounded-lg px-2.5 py-2 text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <span className="text-sm text-muted-foreground font-medium">reps</span>
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setEditing(false)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-muted text-foreground hover:bg-muted/70 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <button
        onClick={startEdit}
        className="w-full flex items-center gap-3 bg-white dark:bg-card rounded-2xl px-4 py-3 border border-gray-100 dark:border-border shadow-sm transition active:opacity-70"
      >
        <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Target className="w-4 h-4 text-white" />
        </div>
        <div className="text-left flex-1">
          <p className="font-semibold text-foreground text-sm">Set Target Goal</p>
          <p className="text-xs text-muted-foreground mt-0.5">Define your target weight &amp; reps</p>
        </div>
      </button>
    );
  }

  return (
    <div className="relative bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-3 border border-blue-200/60 dark:border-blue-800/40">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Target className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Target Goal</p>
          <p className="text-sm font-bold text-foreground">{goal.kg} kg × {goal.reps} reps</p>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button onClick={startEdit} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition">
            <Pencil className="w-3.5 h-3.5 text-blue-500" />
          </button>
          <button onClick={handleDelete} disabled={saving} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition disabled:opacity-50">
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}