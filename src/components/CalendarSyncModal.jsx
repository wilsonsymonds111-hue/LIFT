import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TIME_PRESETS = [
  { label: '6:00 AM', hour: 6 },
  { label: '7:00 AM', hour: 7 },
  { label: '8:00 AM', hour: 8 },
  { label: '9:00 AM', hour: 9 },
  { label: '12:00 PM', hour: 12 },
  { label: '5:00 PM', hour: 17 },
  { label: '6:00 PM', hour: 18 },
  { label: '7:00 PM', hour: 19 },
];

export default function CalendarSyncModal({ onClose, onSync }) {
  const [selectedHour, setSelectedHour] = useState(null);
  const [customHour, setCustomHour] = useState('7');
  const [customMin, setCustomMin] = useState('00');
  const [isCustom, setIsCustom] = useState(false);

  const handleConfirm = () => {
    let hour = selectedHour;
    if (isCustom) {
      hour = parseInt(customHour, 10);
    }
    if (hour != null) {
      onSync(hour);
    }
  };

  const today = new Date();
  const todayHour = today.getHours();

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="relative bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md flex flex-col shadow-2xl overflow-hidden"
          style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-border">
            <button
              onClick={onClose}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-muted hover:bg-blue-500 transition group -ml-2"
            >
              <ArrowLeft className="w-5 h-5 text-foreground group-hover:text-white transition" />
            </button>
            <div className="text-center">
              <h2 className="text-lg font-extrabold text-foreground">Workout Time</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                What time would you like your workouts scheduled each day?
              </p>
            </div>
            <div className="w-11" />
          </div>

          <div className="px-5 py-4">
            {/* Preset times */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {TIME_PRESETS.map((preset) => {
                const isActive = !isCustom && selectedHour === preset.hour;
                const isNow = Math.abs(preset.hour - todayHour) <= 1;
                return (
                  <button
                    key={preset.hour}
                    onClick={() => { setSelectedHour(preset.hour); setIsCustom(false); }}
                    className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                        : 'bg-muted text-foreground hover:bg-muted/70'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom time */}
            <button
              onClick={() => { setIsCustom(!isCustom); setSelectedHour(null); }}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150 mb-3 ${
                isCustom
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/70'
              }`}
            >
              Custom time
            </button>

            {isCustom && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="flex items-center gap-1 bg-muted rounded-xl px-3 py-2">
                  <select
                    value={customHour}
                    onChange={e => setCustomHour(e.target.value)}
                    className="bg-transparent text-foreground font-bold text-lg text-center outline-none appearance-none"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                    ))}
                  </select>
                  <span className="text-muted-foreground font-bold text-lg">:</span>
                  <select
                    value={customMin}
                    onChange={e => setCustomMin(e.target.value)}
                    className="bg-transparent text-foreground font-bold text-lg text-center outline-none appearance-none"
                  >
                    <option value="00">00</option>
                    <option value="30">30</option>
                  </select>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {parseInt(customHour, 10) < 12 ? 'AM' : parseInt(customHour, 10) === 12 ? 'PM' : 'PM'}
                </span>
              </div>
            )}

            {/* Sync button */}
            <button
              onClick={handleConfirm}
              disabled={selectedHour == null && !isCustom}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Sync to Calendar
            </button>

            <p className="text-[11px] text-muted-foreground text-center mt-3 leading-relaxed">
              Your workouts will be added to your calendar at the chosen time. Open the downloaded file to import them — Apple Calendar will send you native notifications before each workout.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}