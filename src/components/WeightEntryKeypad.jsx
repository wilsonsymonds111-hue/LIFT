import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Delete } from 'lucide-react';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

export default function WeightEntryKeypad({ onClose, onSave }) {
  const [value, setValue] = useState('');
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleKey = (key) => {
    if (key === 'del') {
      setValue(v => v.slice(0, -1));
    } else if (key === '.') {
      if (!value.includes('.')) setValue(v => v + '.');
    } else {
      if (value.length < 6) setValue(v => v + key);
    }
  };

  const handleSave = () => {
    const w = parseFloat(value);
    if (w > 0 && w < 500) {
      onSave(w, now.toISOString().slice(0, 10));
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />

      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full bg-[#F2F2F7] dark:bg-background rounded-t-3xl pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl"
        style={{ animation: 'slideUp 0.25s cubic-bezier(0.33, 1, 0.68, 1)' }}
      >
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

        {/* Grab handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-muted" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-2">
          <button onClick={onClose} className="text-sm font-medium text-gray-500 dark:text-muted-foreground active:opacity-60 transition">Cancel</button>
          <span className="text-sm font-semibold text-black dark:text-foreground">New Weight</span>
          <button
            onClick={handleSave}
            disabled={!value || parseFloat(value) <= 0}
            className="text-sm font-bold text-purple-500 disabled:opacity-40 active:opacity-60 transition"
          >
            Save
          </button>
        </div>

        {/* Weight display */}
        <div className="flex flex-col items-center py-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-5xl font-bold text-black dark:text-foreground tabular-nums">
              {value || <span className="text-gray-300 dark:text-muted-foreground">0</span>}
            </span>
            <span className="text-xl font-medium text-gray-400 dark:text-muted-foreground">kg</span>
          </div>
          <span className="text-xs text-gray-400 dark:text-muted-foreground mt-1">{dateStr}</span>
        </div>

        {/* Keypad */}
        <div className="px-4 pt-1">
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            {KEYS.map(k => (
              <button
                key={k}
                onClick={() => handleKey(k)}
                className="h-12 rounded-xl bg-white dark:bg-card shadow-sm flex items-center justify-center active:bg-gray-100 dark:active:bg-muted transition"
              >
                {k === 'del' ? (
                  <Delete className="w-5 h-5 text-black dark:text-foreground" />
                ) : (
                  <span className="text-lg font-semibold text-black dark:text-foreground">{k}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}