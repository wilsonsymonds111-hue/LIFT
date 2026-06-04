import { History } from 'lucide-react';

const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/* ─── Full modal ─────────────────────────────────────────────── */
export function RestTimerModal({ seconds, total, onSkip, onMinimize, onAdjust }) {
  const progress = total > 0 ? seconds / total : 0;
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onMinimize} />
      <div className="relative bg-white rounded-3xl w-[88%] max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-center px-5 pt-5 pb-1">
          <h2 className="font-bold text-base text-gray-900">Rest Timer</h2>
        </div>
        <p className="text-sm text-gray-400 text-center pb-5">Tap outside to minimise.</p>

        {/* Circle */}
        <div className="flex items-center justify-center pb-6">
          <div className="relative w-52 h-52">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="100" cy="100" r={RADIUS}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.95s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-extrabold text-gray-900 tabular-nums">{fmt(seconds)}</span>
              <span className="text-lg text-gray-400 mt-1 tabular-nums">{fmt(total)}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 px-5 pb-6">
          <button onClick={() => onAdjust(-10)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl text-sm font-semibold text-gray-800 transition">
            −10s
          </button>
          <button onClick={() => onAdjust(10)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl text-sm font-semibold text-gray-800 transition">
            +10s
          </button>
          <button onClick={onSkip} className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 rounded-2xl text-sm font-semibold text-white transition">
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Minimized battery pill ─────────────────────────────────── */
export function RestTimerPill({ seconds, total, onClick }) {
  const pct = total > 0 ? (seconds / total) * 100 : 0;
  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden h-10 rounded-2xl flex items-center px-3 gap-1.5 min-w-[84px] bg-gray-200"
    >
      {/* Depleting blue fill */}
      <div
        className="absolute left-0 inset-y-0 bg-blue-500 rounded-2xl"
        style={{ width: `${pct}%`, transition: 'width 1s linear' }}
      />
      <History className="w-4 h-4 text-white relative z-10 flex-shrink-0" />
      <span className="text-white font-bold text-sm relative z-10 tabular-nums">{fmt(seconds)}</span>
    </button>
  );
}