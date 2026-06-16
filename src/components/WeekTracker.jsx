import { useState } from 'react';
import { Check, Dumbbell, X, Settings } from 'lucide-react';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getTooltipText(status, isPast, isToday, editing) {
  if (editing) return 'Tap a day to toggle training/rest';
  const isGymDay = status >= 1;
  const isCompleted = status === 2;
  if (!isGymDay) return 'Rest day 😌';
  if (isPast && isCompleted) return 'Workout completed ✅';
  if (isPast && !isCompleted) return 'Missed workout ❌';
  if (isToday) return "Workout today — let's go! 💪";
  return 'Workout day ahead 💪';
}

function loadCustomSchedule(splitKey, fallback) {
  try {
    const raw = localStorage.getItem(`splitSchedule_${splitKey}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return fallback;
}

function saveCustomSchedule(splitKey, schedule) {
  localStorage.setItem(`splitSchedule_${splitKey}`, JSON.stringify(schedule));
}

export default function WeekTracker({ schedule, splitKey, editable = true }) {
  const todayIndex = new Date().getDay();
  const todayMonSun = todayIndex === 0 ? 6 : todayIndex - 1;

  const [customSchedule, setCustomSchedule] = useState(() =>
    splitKey && editable ? loadCustomSchedule(splitKey, schedule) : schedule
  );
  const [editing, setEditing] = useState(false);
  const [activeDay, setActiveDay] = useState(todayMonSun);

  const currentSchedule = customSchedule || schedule;

  const handleToggleDay = (i) => {
    if (!editing || !splitKey) return;
    const next = [...currentSchedule];
    next[i] = next[i] === 0 ? 1 : 0;
    setCustomSchedule(next);
    saveCustomSchedule(splitKey, next);
  };

  const handleEditDone = () => {
    setEditing(false);
    setActiveDay(todayMonSun);
  };

  return (
    <div className="px-4 pb-2">
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          This Week
        </span>
        {editable && splitKey && (
          <button
            onClick={() => setEditing(e => !e)}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
              editing
                ? 'bg-blue-500 text-white'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Day labels */}
      <div className="flex justify-between mb-1 px-0.5">
        {DAY_LETTERS.map((letter, i) => (
          <span
            key={i}
            className="text-[10px] font-semibold w-5 text-center text-muted-foreground"
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Circles row */}
      <div className="flex justify-between px-0.5">
        {currentSchedule.map((status, i) => {
          const isToday = i === todayMonSun;
          const isGymDay = status >= 1;
          const isCompleted = status === 2;
          const isPast = i < todayMonSun;
          const missed = isPast && isGymDay && !isCompleted;
          const showCheck = isPast && isGymDay && isCompleted;
          const showDumbbell = isGymDay && !isPast;

          let bgClass = '';
          if (editing) {
            bgClass = isGymDay
              ? 'bg-blue-500'
              : 'border border-blue-300 dark:border-blue-700 bg-transparent';
          } else if (missed) {
            bgClass = 'bg-red-500';
          } else if (isGymDay) {
            bgClass = 'bg-blue-500';
          } else {
            bgClass = 'border border-blue-300 dark:border-blue-700 bg-transparent';
          }

          return (
            <div
              key={i}
              className="flex items-center w-5 justify-center"
              onClick={() => editing ? handleToggleDay(i) : setActiveDay(activeDay === i ? todayMonSun : i)}
              onMouseEnter={() => !editing && setActiveDay(i)}
              onMouseLeave={() => !editing && setActiveDay(todayMonSun)}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150 ${
                  editing ? 'cursor-pointer scale-110' : 'cursor-pointer'
                } ${
                  isToday && !editing
                    ? 'ring-[1.5px] ring-emerald-500 ring-offset-1 ring-offset-background'
                    : ''
                } ${bgClass}`}
              >
                {!editing && showCheck && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                {!editing && missed && <X className="w-3 h-3 text-white" strokeWidth={3} />}
                {!editing && showDumbbell && <Dumbbell className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />}
                {editing && !isGymDay && (
                  <span className="text-[8px] font-bold text-blue-400">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tooltip / edit bar */}
      <div className="flex justify-center mt-2">
        {editing ? (
          <button
            onClick={handleEditDone}
            className="text-[11px] font-semibold bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition"
          >
            Done
          </button>
        ) : (
          <span className="text-[11px] font-medium text-muted-foreground text-center min-h-[16px]">
            {getTooltipText(currentSchedule[activeDay], activeDay < todayMonSun, activeDay === todayMonSun, false)}
          </span>
        )}
      </div>
    </div>
  );
}