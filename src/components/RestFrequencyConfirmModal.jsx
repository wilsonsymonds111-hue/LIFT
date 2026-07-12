import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const KNOWN_CYCLES = {
  'push-pull-legs': { onDays: 3, offDays: 1 },
  'upper-lower': { onDays: 2, offDays: 1 },
  'full-body': { onDays: 1, offDays: 1 },
  'ul-ppl': { onDays: 5, offDays: 1 },
};

function loadCycle(splitKey, fallbackSchedule) {
  const todayIndex = new Date().getDay();
  const todayMonSun = todayIndex === 0 ? 6 : todayIndex - 1;
  const defaults = KNOWN_CYCLES[splitKey] || null;

  // DB cycle data is loaded by the parent component — use defaults here
  if (defaults) return { ...defaults, startDayIndex: todayMonSun };

  let maxOn = 0, maxOff = 0, curOn = 0, curOff = 0;
  for (let i = 0; i < fallbackSchedule.length; i++) {
    if (fallbackSchedule[i] === 1) { curOn++; if (curOff > maxOff) maxOff = curOff; curOff = 0; }
    else { curOff++; if (curOn > maxOn) maxOn = curOn; curOn = 0; }
  }
  if (curOn > maxOn) maxOn = curOn;
  if (curOff > maxOff) maxOff = curOff;
  return { onDays: maxOn || 1, offDays: maxOff || 1, startDayIndex: todayMonSun };
}

function cycleToSchedule(onDays, offDays, startDayIndex) {
  const cycleLength = onDays + offDays;
  const schedule = [];
  for (let i = 0; i < 7; i++) {
    if (i < startDayIndex) {
      schedule.push(0); // Before cycle start — rest day
    } else {
      const pos = (i - startDayIndex) % cycleLength;
      schedule.push(pos < onDays ? 1 : 0);
    }
  }
  return schedule;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function RestFrequencyConfirmModal({ splitKey, defaultSchedule, onClose, onConfirm, onEdit }) {
  const todayIndex = new Date().getDay();
  const todayMonSun = todayIndex === 0 ? 6 : todayIndex - 1;

  const defaultCycle = useMemo(() => loadCycle(splitKey, defaultSchedule), [splitKey, defaultSchedule]);
  const [onDays, setOnDays] = useState(defaultCycle.onDays);
  const [offDays, setOffDays] = useState(defaultCycle.offDays);
  const [startDayIndex, setStartDayIndex] = useState(defaultCycle.startDayIndex);

  useEffect(() => {
    const c = loadCycle(splitKey, defaultSchedule);
    setOnDays(c.onDays);
    setOffDays(c.offDays);
    setStartDayIndex(c.startDayIndex);
  }, [splitKey, defaultSchedule]);

  const previewSchedule = useMemo(
    () => cycleToSchedule(onDays, offDays, startDayIndex),
    [onDays, offDays, startDayIndex]
  );

  // Shift the week to start from today so the user sees the next 7 days
  const shiftedDayLabels = useMemo(
    () => [...DAY_LABELS.slice(todayMonSun), ...DAY_LABELS.slice(0, todayMonSun)],
    [todayMonSun]
  );
  const shiftedSchedule = useMemo(
    () => [...previewSchedule.slice(todayMonSun), ...previewSchedule.slice(0, todayMonSun)],
    [previewSchedule, todayMonSun]
  );
  const shiftedStartDayIndex = (startDayIndex - todayMonSun + 7) % 7;

  const frequencyLabel = useMemo(() => {
    const onPart = `${onDays} day${onDays !== 1 ? 's' : ''} on`;
    const offPart = `${offDays} day${offDays !== 1 ? 's' : ''} off`;
    return `${onPart}, ${offPart}, repeat`;
  }, [onDays, offDays]);

  const handleLooksGood = () => {
    onClose();
    onConfirm({ onDays, offDays, startDayIndex });
  };

  const handleEdit = () => {
    onClose();
    if (onEdit) onEdit(splitKey);
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="bg-card rounded-2xl p-6 mx-5 max-w-sm w-full shadow-2xl border border-border"
        >
          <h3 className="text-lg font-extrabold text-foreground text-center">Rest Frequency</h3>
          <p className="text-sm text-muted-foreground text-center mt-1 mb-5">
            Confirm your rest day cycle before applying
          </p>

          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 mb-4">
            <p className="text-sm font-bold text-foreground text-center">{frequencyLabel}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase text-center mt-3 mb-2">Starting on</p>
            <div className="flex justify-center gap-1">
              {shiftedSchedule.map((status, i) => {
                const isGymDay = status === 1;
                const isStart = shiftedStartDayIndex === i;
                const isToday = i === 0;
                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center py-1.5 px-2 rounded-lg text-xs font-bold ${
                      isStart ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' : 'bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800'
                    } ${isToday && !isStart ? 'ring-[2px] ring-emerald-500 ring-offset-1' : ''}`}
                  >
                    <span className={`${isStart ? 'text-white/80' : 'text-muted-foreground'} text-[10px]`}>{shiftedDayLabels[i]}</span>
                    <div className={`w-5 h-5 mt-1 rounded-full flex items-center justify-center ${
                      isGymDay
                        ? isStart ? 'bg-white/30' : 'bg-blue-500 shadow-sm shadow-blue-500/30'
                        : isStart ? 'border-2 border-white/40' : 'border-2 border-blue-300 dark:border-blue-700'
                    }`}>
                      {isGymDay && <Dumbbell className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleEdit}
              className="flex-1 py-2.5 rounded-xl bg-muted text-foreground font-semibold text-sm hover:bg-muted/70 transition"
            >
              Edit
            </button>
            <button
              onClick={handleLooksGood}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition"
            >
              Looks Good
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}