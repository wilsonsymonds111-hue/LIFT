import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const PRESETS = [1, 2, 3, 4, 5];

export default function RestTimeModal({ currentSeconds, onClose, onSelect }) {
  const currentMin = Math.floor(currentSeconds / 60);
  const currentSec = currentSeconds % 60;
  const [minutes, setMinutes] = useState(String(currentMin));
  const [seconds, setSeconds] = useState(String(currentSec));

  const handleConfirm = () => {
    const mins = parseInt(minutes) || 0;
    const secs = parseInt(seconds) || 0;
    const total = mins * 60 + secs;
    if (total > 0) {
      onSelect(total);
    }
    onClose();
  };

  const formatPreset = (total) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return s > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${m}m`;
  };

  const presets = [60, 90, 120, 150, 180, 210, 240];
  const currentTotal = (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);

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

          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {presets.map(total => (
              <button
                key={total}
                onClick={() => { setMinutes(String(Math.floor(total / 60))); setSeconds(String(total % 60)); }}
                className={`px-3 h-10 rounded-xl font-semibold text-sm transition ${
                  total === currentTotal
                    ? 'bg-blue-500 text-white'
                    : 'bg-muted text-foreground hover:bg-muted/70'
                }`}
              >
                {formatPreset(total)}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mb-5">
            <input
              type="text"
              inputMode="numeric"
              value={minutes}
              onChange={e => setMinutes(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
              placeholder="0"
              className="w-14 text-center text-lg font-bold border border-border rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <span className="text-sm font-semibold text-muted-foreground">min</span>
            <input
              type="text"
              inputMode="numeric"
              value={seconds}
              onChange={e => setSeconds(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
              placeholder="00"
              className="w-14 text-center text-lg font-bold border border-border rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <span className="text-sm font-semibold text-muted-foreground">sec</span>
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