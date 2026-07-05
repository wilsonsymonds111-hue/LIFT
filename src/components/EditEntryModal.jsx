import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Check } from 'lucide-react';

const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function EditEntryModal({ entry, unit, onSave, onDelete, onClose }) {
  const [weight, setWeight] = useState(String(entry.weight));
  const [date, setDate] = useState(entry.date);

  useEffect(() => {
    setWeight(String(entry.weight));
    setDate(entry.date);
  }, [entry]);

  const handleSave = () => {
    const w = parseFloat(weight);
    if (!w || w <= 0) return;
    onSave(w, date);
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        onClick={e => e.stopPropagation()}
        className="relative bg-white dark:bg-card rounded-3xl shadow-2xl mx-6 w-full max-w-sm p-5"
        style={{ animation: 'graphFadeIn 0.2s ease-out' }}
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-foreground text-center mb-1">Edit Entry</h2>
        <p className="text-xs text-gray-500 dark:text-muted-foreground text-center mb-5">{fmtDate(entry.date)}</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-muted-foreground">Weight ({unit})</label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              className="w-full mt-1 border border-gray-200 dark:border-border rounded-xl px-3 py-3 text-base bg-gray-50 dark:bg-background text-black dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-muted-foreground">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full mt-1 border border-gray-200 dark:border-border rounded-xl px-3 py-3 text-base bg-gray-50 dark:bg-background text-black dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-semibold text-sm transition active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-blue-500 text-white font-semibold text-sm transition active:scale-95"
          >
            <Check className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}