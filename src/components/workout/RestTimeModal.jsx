import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const PRESETS = [1, 2, 3, 4, 5];

export default function RestTimeModal({ currentSeconds, onClose, onSelect }) {
  const currentMin = Math.max(1, Math.round(currentSeconds / 60));
  const [minutes, setMinutes] = useState(String(currentMin));

  const handleConfirm = () => {
    const mins = parseInt(minutes);
    if (mins > 0) {
      onSelect(mins * 60);
    }
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card rounded-3xl w-[88%] max-w-sm shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-muted hover:bg-muted/70 transition">
            <X className="w-4 h-4 text-foreground" />
          </button>
          <h2 className="font-bold text-base text-foreground">Rest Time</h2>
          <div className="w-9" />
        </div>

        <div className="px-5 pb-5">
          <p className="text-sm text-muted-foreground text-center mb-4">Choose how long the rest timer lasts between sets</p>

          <div className="flex justify-center gap-2 mb-4">
            {PRESETS.map(m => (
              <button
                key={m}
                onClick={() => setMinutes(String(m))}
                className={`w-12 h-12 rounded-xl font-bold text-sm transition ${
                  String(m) === minutes
                    ? 'bg-blue-500 text-white'
                    : 'bg-muted text-foreground hover:bg-muted/70'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mb-5">
            <input
              type="text"
              inputMode="numeric"
              value={minutes}
              onChange={e => setMinutes(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-16 text-center text-lg font-bold border border-border rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <span className="text-sm font-semibold text-muted-foreground">min</span>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}