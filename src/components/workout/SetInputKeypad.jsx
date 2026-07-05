import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Delete, Check } from 'lucide-react';

export default function SetInputKeypad({ field, value, allowDecimal, onChange, onClose }) {
  const [local, setLocal] = useState(value != null ? String(value) : '');

  // Sync when the underlying value changes externally (e.g. clear)
  useEffect(() => {
    setLocal(value != null ? String(value) : '');
  }, [value]);

  const commit = (v) => {
    onChange(v);
  };

  const handleKey = (key) => {
    let next;
    if (key === 'del') {
      next = local.slice(0, -1);
    } else if (key === '.') {
      if (!allowDecimal || local.includes('.')) return;
      next = local === '' ? '0.' : local + '.';
    } else {
      if (local.length >= 6) return;
      // Prevent leading zeros like "007"
      if (local === '0' && key !== '.') next = key;
      else next = local + key;
    }
    setLocal(next);
    commit(next);
  };

  const label = field === 'kg' ? 'Weight (kg)' : 'Reps';
  const keys = allowDecimal
    ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del']
    : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full bg-[#F2F2F7] dark:bg-background rounded-t-3xl pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-2xl"
        style={{ animation: 'slideUp 0.2s cubic-bezier(0.33, 1, 0.68, 1)' }}
      >
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-muted" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-1.5">
          <button onClick={onClose} className="text-sm font-medium text-gray-500 dark:text-muted-foreground active:opacity-60">Cancel</button>
          <span className="text-sm font-semibold text-black dark:text-foreground">{label}</span>
          <button onClick={onClose} className="text-sm font-bold text-blue-500 active:opacity-60">
            <Check className="w-5 h-5" />
          </button>
        </div>

        {/* Value display */}
        <div className="flex flex-col items-center py-2">
          <span className="text-4xl font-bold text-black dark:text-foreground tabular-nums">
            {local || <span className="text-gray-300 dark:text-muted-foreground">0</span>}
          </span>
        </div>

        {/* Keypad */}
        <div className="px-4 pt-1">
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            {keys.map((k, i) => (
              k === '' ? (
                <div key={i} className="h-14" />
              ) : (
                <button
                  key={i}
                  onClick={() => handleKey(k)}
                  className="h-14 rounded-xl bg-white dark:bg-card shadow-sm flex items-center justify-center active:bg-gray-200 dark:active:bg-muted transition active:scale-95"
                >
                  {k === 'del' ? (
                    <Delete className="w-5 h-5 text-black dark:text-foreground" />
                  ) : (
                    <span className="text-xl font-semibold text-black dark:text-foreground">{k}</span>
                  )}
                </button>
              )
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}