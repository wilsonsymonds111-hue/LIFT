import { memo } from 'react';
import { Check, Dumbbell } from 'lucide-react';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function WeekTracker({ schedule, cycleLabel, startDayIndex = 0, workoutNames = [], dayColors = [] }) {
  const todayIndex = new Date().getDay();
  const todayMonSun = todayIndex === 0 ? 6 : todayIndex - 1;

  // schedule & workoutNames are already today-first; only the day letters need rotating
  const rotatedSchedule = schedule;
  const rotatedLabels = [...DAY_LETTERS.slice(todayMonSun), ...DAY_LETTERS.slice(0, todayMonSun)];
  const rotatedNames = workoutNames || [];

  return (
    <div className="px-4 pb-2">
      {/* Day labels */}
      <div className="flex justify-between mb-1.5 px-0.5">
        {rotatedLabels.map((letter, i) => (
          <span
            key={i}
            className={`text-xs font-semibold w-7 text-center ${i === 0 ? 'text-foreground' : 'text-muted-foreground'}`}
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
              className="flex flex-col items-center w-7"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-150 cursor-pointer ${
                  isToday
                    ? 'ring-2 ring-emerald-500 ring-offset-1 ring-offset-background'
                    : ''
                } ${bgClass}`}
              >
                {isCompleted && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                {isGymDay && !isCompleted && <Dumbbell className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />}
              </div>
              <div className="w-1 h-1 mt-1.5" />
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default memo(WeekTracker);