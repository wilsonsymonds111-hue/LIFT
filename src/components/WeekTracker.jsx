import { useState, memo } from 'react';
import { Check, Dumbbell, Minus } from 'lucide-react';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getTooltipText(status, isPast, isToday, isNoData) {
  const isGymDay = status >= 1;
  const isCompleted = status === 2;
  if (!isGymDay) return 'Rest day 😌';
  if (isNoData) return 'Split starts here — no data yet';
  if (isPast && isCompleted) return 'Workout completed ✅';
  if (isPast && !isCompleted) return 'Missed workout ❌';
  if (isToday) return "Workout today — let's go! 💪";
  return 'Workout day ahead 💪';
}

function WeekTracker({ schedule, cycleLabel, startDayIndex = 0 }) {
  const todayIndex = new Date().getDay();
  const todayMonSun = todayIndex === 0 ? 6 : todayIndex - 1;

  // Rotate so today is first
  const rotatedSchedule = [...schedule.slice(todayMonSun), ...schedule.slice(0, todayMonSun)];
  const rotatedLabels = [...DAY_LETTERS.slice(todayMonSun), ...DAY_LETTERS.slice(0, todayMonSun)];

  const [activeDay, setActiveDay] = useState(0);

  return (
    <div className="px-4 pb-2">
      {/* Day labels */}
      <div className="flex justify-between mb-1 px-0.5">
        {rotatedLabels.map((letter, i) => (
          <span
            key={i}
            className={`text-[10px] font-semibold w-5 text-center ${i === 0 ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Circles row */}
      <div className="flex justify-between px-0.5">
        {rotatedSchedule.map((status, i) => {
          const origIdx = (todayMonSun + i) % 7;
          const isToday = i === 0;
          const isGymDay = status >= 1;
          const isCompleted = status === 2;
          const isPast = i < 0; // no past days in rotated view — today is always first
          const beforeSplitStart = origIdx < startDayIndex && origIdx < todayMonSun;
          const noData = false;
          const missed = false;
          const showCheck = false;
          const showDumbbell = isGymDay && !isPast;

          let bgClass = '';
          if (missed) bgClass = 'border border-gray-300 dark:border-gray-600 bg-transparent';
          else if (noData) bgClass = 'border border-gray-300 dark:border-gray-600 bg-transparent';
          else if (isGymDay) bgClass = 'bg-blue-500';
          else bgClass = 'border border-blue-300 dark:border-blue-700 bg-transparent';

          return (
            <div
              key={i}
              className="flex items-center w-5 justify-center"
              onMouseEnter={() => setActiveDay(i)}
              onMouseLeave={() => setActiveDay(0)}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-150 cursor-pointer ${
                  isToday
                    ? 'ring-[1.5px] ring-emerald-500 ring-offset-1 ring-offset-background'
                    : ''
                } ${bgClass}`}
              >
                {showCheck && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                {missed && <Minus className="w-3 h-3 text-gray-400 dark:text-gray-500" strokeWidth={3} />}
                {noData && <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 leading-none">—</span>}
                {showDumbbell && <Dumbbell className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      <div className="flex flex-col items-center mt-2">
        {cycleLabel && (
          <span className="text-[10px] font-semibold text-blue-500 dark:text-blue-400 text-center">
            {cycleLabel}
          </span>
        )}
        <span className="text-[11px] font-medium text-muted-foreground text-center min-h-[16px]">
          {(() => {
            const origIdx = (todayMonSun + activeDay) % 7;
            const s = schedule[origIdx];
            const isPast = activeDay < 0;
            const isToday = activeDay === 0;
            const noData = origIdx < startDayIndex && origIdx < todayMonSun;
            return getTooltipText(s, isPast, isToday, noData);
          })()}
        </span>
      </div>
    </div>
  );
}

export default memo(WeekTracker);