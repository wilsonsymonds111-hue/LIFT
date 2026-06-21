import { useState, memo } from 'react';
import { Check, Dumbbell } from 'lucide-react';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getTooltipText(status, isToday, workoutName) {
  const isGymDay = status >= 1;
  const isCompleted = status === 2;
  if (!isGymDay) return 'Rest day 😌';
  const name = workoutName ? `${workoutName} workout` : 'Workout';
  if (isCompleted) return `${name} completed ✅`;
  if (isToday) return `${name} today — let's go 💪`;
  return `${name} day ahead 💪`;
}

function WeekTracker({ schedule, cycleLabel, startDayIndex = 0, workoutNames = [] }) {
  const todayIndex = new Date().getDay();
  const todayMonSun = todayIndex === 0 ? 6 : todayIndex - 1;

  // Rotate so today is first
  const rotatedSchedule = [...schedule.slice(todayMonSun), ...schedule.slice(0, todayMonSun)];
  const rotatedLabels = [...DAY_LETTERS.slice(todayMonSun), ...DAY_LETTERS.slice(0, todayMonSun)];
  const rawWorkoutNames = workoutNames || [];
  const rotatedNames = rawWorkoutNames.length > 0
    ? [...rawWorkoutNames.slice(todayMonSun), ...rawWorkoutNames.slice(0, todayMonSun)]
    : [];

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
          const isToday = i === 0;
          const isGymDay = status >= 1;
          const isCompleted = status === 2;

          let bgClass = '';
          if (isCompleted) bgClass = 'bg-emerald-500';
          else if (isGymDay) bgClass = 'bg-blue-500';
          else bgClass = 'border border-blue-300 dark:border-blue-700 bg-transparent';

          return (
            <div
              key={i}
              className="flex flex-col items-center w-5"
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
                {isCompleted && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                {isGymDay && !isCompleted && <Dumbbell className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />}
              </div>
              {/* Workout name beneath */}
              <span
                className={`text-[9px] font-semibold mt-1 leading-tight text-center whitespace-nowrap max-w-[48px] truncate ${
                  isToday ? 'text-blue-500 dark:text-blue-400' : 'text-muted-foreground'
                }`}
              >
                {rotatedNames[i] || (isGymDay ? '' : 'Rest')}
              </span>
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
            const isToday = activeDay === 0;
            const name = rotatedNames[activeDay] || null;
            return getTooltipText(s, isToday, name);
          })()}
        </span>
      </div>
    </div>
  );
}

export default memo(WeekTracker);