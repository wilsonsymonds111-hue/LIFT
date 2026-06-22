import { memo } from 'react';
import { Check, Dumbbell } from 'lucide-react';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

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

    </div>
  );
}

export default memo(WeekTracker);