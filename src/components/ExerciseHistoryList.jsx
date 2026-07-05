import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function ExerciseHistoryList({ history, exerciseName, onEntryDeleted }) {
  const [deletingIdx, setDeletingIdx] = useState(null);

  const handleDelete = async (idx) => {
    setDeletingIdx(idx);
    try {
      const results = await base44.entities.Exercise.filter({ name: exerciseName });
      if (results.length === 0) return;
      const ex = results[0];
      const updated = [...(ex.history || [])];
      updated.splice(idx, 1);
      await base44.entities.Exercise.update(ex.id, { history: updated });
      onEntryDeleted?.(updated);
    } catch (e) {
      console.error('Delete failed:', e);
    } finally {
      setDeletingIdx(null);
    }
  };

  if (!history || history.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-bold text-foreground mb-2">History</p>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {[...history].reverse().map((entry, revIdx) => {
          const idx = history.length - 1 - revIdx;
          const kg = entry.kg || 0;
          const reps = entry.reps || 0;
          const isBodyweight = kg === 0 || kg == null;
          return (
            <div
              key={idx}
              className="flex items-center justify-between bg-muted/60 rounded-lg px-3 py-2"
            >
              <span className="text-sm font-semibold text-foreground">
                {isBodyweight ? `${reps} reps` : `${kg} kg × ${reps}`}
              </span>
              <span className="text-xs text-muted-foreground text-center flex-1">{formatDate(entry.date)}</span>
              <button
                onClick={() => handleDelete(idx)}
                disabled={deletingIdx === idx}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
              >
                <Trash2 className={`w-4 h-4 text-red-400 ${deletingIdx === idx ? 'animate-pulse' : ''}`} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}