import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, Trash2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { invalidateExerciseGoalsCache } from '../../hooks/useExerciseGoals';

export default function GoalModal({ exerciseName, goal, onClose, onSaved }) {
  const [kg, setKg] = useState(goal?.kg ?? '');
  const [reps, setReps] = useState(goal?.reps ?? '');
  const [saving, setSaving] = useState(false);

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
      onClose();
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
      onClose();
    } catch (e) {
      console.error('Failed to delete goal:', e);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="relative bg-card rounded-3xl w-[90%] max-w-sm flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-muted hover:bg-muted/70 transition">
            <X className="w-4 h-4 text-foreground" />
          </button>
          <h2 className="font-bold text-base text-foreground flex items-center gap-1.5">
            <Target className="w-4 h-4 text-green-500" /> Set Target Goal
          </h2>
          <div className="w-9" />
        </div>

        <div className="px-5 py-5">
          <p className="text-xs text-muted-foreground text-center mb-4">{exerciseName}</p>
          <div className="flex items-end justify-center gap-2 mb-5">
            <input
              type="number"
              step="0.5"
              inputMode="decimal"
              placeholder="0"
              value={kg}
              onChange={e => setKg(e.target.value)}
              className="w-24 border border-gray-200 dark:border-border rounded-xl px-3 py-3 text-center text-2xl font-bold bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <span className="text-sm text-muted-foreground font-medium pb-3">kg</span>
            <span className="text-2xl text-muted-foreground font-bold pb-2.5">×</span>
            <input
              type="number"
              step="1"
              inputMode="numeric"
              placeholder="0"
              value={reps}
              onChange={e => setReps(e.target.value)}
              className="w-24 border border-gray-200 dark:border-border rounded-xl px-3 py-3 text-center text-2xl font-bold bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <span className="text-sm text-muted-foreground font-medium pb-3">reps</span>
          </div>

          <div className="flex gap-2">
            {goal && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 py-3.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-500 font-semibold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Goal
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}