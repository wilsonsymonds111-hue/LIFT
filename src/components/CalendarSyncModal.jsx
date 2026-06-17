import { useState, useRef, useEffect } from 'react';
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

function CustomTimePicker({ hour, min, onChange }) {
  const hourRef = useRef(null);
  const minRef = useRef(null);
  const [period, setPeriod] = useState(hour < 12 ? 'AM' : 'PM');

  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  // Auto-scroll selected items into view
  useEffect(() => {
    if (hourRef.current) {
      const el = hourRef.current.querySelector('[data-selected="true"]');
      el?.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
  }, []);

  useEffect(() => {
    if (minRef.current) {
      const el = minRef.current.querySelector('[data-selected="true"]');
      el?.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
  }, []);

  const handleHourChange = (displayH) => {
    let h24;
    if (period === 'AM') {
      h24 = displayH === 12 ? 0 : displayH;
    } else {
      h24 = displayH === 12 ? 12 : displayH + 12;
    }
    onChange(h24, min);
  };

  const handleMinChange = (m) => {
    onChange(hour, m);
  };

  const handlePeriodToggle = (p) => {
    setPeriod(p);
    let h24;
    if (p === 'AM') {
      h24 = displayHour === 12 ? 0 : displayHour;
    } else {
      h24 = displayHour === 12 ? 12 : displayHour;
    }
    onChange(h24, min);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const mins = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div className="flex gap-3">
      {/* Hour column */}
      <div className="flex-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center mb-2">Hour</p>
        <div
          ref={hourRef}
          className="h-[160px] overflow-y-auto rounded-xl bg-muted/50 border border-border/50 snap-y snap-mandatory scroll-smooth"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {hours.map((h) => {
            const isSelected = h === displayHour;
            return (
              <button
                key={h}
                data-selected={isSelected}
                onClick={() => handleHourChange(h)}
                className={`w-full py-2.5 text-center text-lg font-bold snap-center transition-colors ${
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {String(h).padStart(2, '0')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Minute column */}
      <div className="flex-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center mb-2">Minute</p>
        <div
          ref={minRef}
          className="h-[160px] overflow-y-auto rounded-xl bg-muted/50 border border-border/50 snap-y snap-mandatory scroll-smooth"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {mins.map((m) => {
            const isSelected = m === min;
            return (
              <button
                key={m}
                data-selected={isSelected}
                onClick={() => handleMinChange(m)}
                className={`w-full py-2.5 text-center text-lg font-bold snap-center transition-colors ${
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {String(m).padStart(2, '0')}
              </button>
            );
          })}
        </div>
      </div>

      {/* AM/PM toggle */}
      <div className="flex flex-col justify-center gap-2">
        {['AM', 'PM'].map((p) => (
          <button
            key={p}
            onClick={() => handlePeriodToggle(p)}
            className={`px-3 py-3 rounded-xl text-sm font-bold transition-all ${
              period === p
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/70'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

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
              <div className="mb-4">
                <CustomTimePicker
                  hour={parseInt(customHour, 10)}
                  min={parseInt(customMin, 10)}
                  onChange={(h, m) => { setCustomHour(String(h)); setCustomMin(String(m).padStart(2, '0')); }}
                />
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