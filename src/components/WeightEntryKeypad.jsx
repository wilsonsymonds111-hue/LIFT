import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Delete, User } from 'lucide-react';

const KEYS = [
  { k: '1', sub: '' }, { k: '2', sub: 'ABC' }, { k: '3', sub: 'DEF' },
  { k: '4', sub: 'GHI' }, { k: '5', sub: 'JKL' }, { k: '6', sub: 'MNO' },
  { k: '7', sub: 'PQRS' }, { k: '8', sub: 'TUV' }, { k: '9', sub: 'WXYZ' },
  { k: '.', sub: '' }, { k: '0', sub: '' }, { k: 'del', sub: '' },
];

export default function WeightEntryKeypad({ onClose, onSave }) {
  const [value, setValue] = useState('');
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });

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
    <div className="fixed inset-0 z-[60] bg-[#F2F2F7] dark:bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-3">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#E5E5EA] dark:bg-muted active:scale-95 transition"
        >
          <X className="w-4 h-4 text-black dark:text-foreground" />
        </button>
        <button
          onClick={handleSave}
          disabled={!value || parseFloat(value) <= 0}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#E5E5EA] dark:bg-muted disabled:opacity-40 active:scale-95 transition"
        >
          <Check className="w-5 h-5 text-purple-500" />
        </button>
      </div>

      {/* Central content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-full bg-white dark:bg-card shadow-sm flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
            <User className="w-7 h-7 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-black dark:text-foreground mb-6">Weight</h2>

        {/* Input card */}
        <div className="w-full max-w-sm bg-white dark:bg-card rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-border">
            <span className="text-sm text-gray-500 dark:text-muted-foreground">Date</span>
            <span className="text-sm font-medium text-black dark:text-foreground bg-[#E5E5EA] dark:bg-muted px-3 py-1 rounded-full">{dateStr}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-border">
            <span className="text-sm text-gray-500 dark:text-muted-foreground">Time</span>
            <span className="text-sm font-medium text-black dark:text-foreground bg-[#E5E5EA] dark:bg-muted px-3 py-1 rounded-full">{timeStr}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-gray-500 dark:text-muted-foreground">kg</span>
            <span className="text-2xl font-bold text-black dark:text-foreground tabular-nums">
              {value || <span className="text-gray-300 dark:text-muted-foreground">0</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Keypad */}
      <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-3 gap-2.5 max-w-sm mx-auto">
          {KEYS.map(({ k, sub }) => (
            <button
              key={k}
              onClick={() => handleKey(k)}
              className="h-14 rounded-2xl bg-white dark:bg-card shadow-sm flex flex-col items-center justify-center active:bg-gray-100 dark:active:bg-muted transition"
            >
              {k === 'del' ? (
                <Delete className="w-5 h-5 text-black dark:text-foreground" />
              ) : (
                <>
                  <span className="text-xl font-semibold text-black dark:text-foreground leading-none">{k}</span>
                  {sub && <span className="text-[9px] text-gray-400 dark:text-muted-foreground mt-0.5 tracking-wider">{sub}</span>}
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}