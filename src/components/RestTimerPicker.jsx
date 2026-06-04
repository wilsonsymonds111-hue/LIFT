import { useState } from 'react';
import { X } from 'lucide-react';

const PRESET_OPTIONS = [
  { label: '0:30', seconds: 30 },
  { label: '1:00', seconds: 60 },
  { label: '2:00', seconds: 120 },
  { label: '3:00', seconds: 180 },
];

export default function RestTimerPicker({ current, onSelect, onClose }) {
  const [showCustom, setShowCustom] = useState(false);
  const [customMin, setCustomMin] = useState('');
  const [customSec, setCustomSec] = useState('');

  const handlePreset = (seconds) => {
    onSelect(seconds);
    onClose();
  };

  const handleCustomSave = () => {
    const total = (parseInt(customMin) || 0) * 60 + (parseInt(customSec) || 0);
    if (total > 0) {
      onSelect(total);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl w-full max-w-md px-6 pt-5 pb-10 shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition">
            <X className="w-4 h-4 text-gray-700" />
          </button>
          <h2 className="font-bold text-base text-gray-900">Rest Timer</h2>
          <div className="w-8" />
        </div>

        <p className="text-sm text-gray-500 mb-6 text-center">
          Choose a duration below or set your own.<br />
          Custom durations are saved for next time.
        </p>

        {/* Circle with presets */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-56 h-56 rounded-full border-4 border-blue-400 flex flex-col items-center justify-center gap-3">
            {PRESET_OPTIONS.map(opt => (
              <button
                key={opt.seconds}
                onClick={() => handlePreset(opt.seconds)}
                className={`text-lg font-semibold transition ${current === opt.seconds ? 'text-blue-500' : 'text-gray-800 hover:text-blue-400'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom timer */}
        {showCustom ? (
          <div className="flex items-center gap-2 justify-center mb-4">
            <input
              type="number"
              value={customMin}
              onChange={e => setCustomMin(e.target.value)}
              placeholder="min"
              className="w-16 text-center border border-gray-300 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <span className="text-gray-500 font-bold">:</span>
            <input
              type="number"
              value={customSec}
              onChange={e => setCustomSec(e.target.value)}
              placeholder="sec"
              className="w-16 text-center border border-gray-300 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleCustomSave}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition"
            >
              Set
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCustom(true)}
            className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-2xl text-sm transition"
          >
            Create Custom Timer
          </button>
        )}
      </div>
    </div>
  );
}