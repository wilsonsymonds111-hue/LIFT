import { useState } from 'react';
import { Check, Dumbbell, X } from 'lucide-react';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Day status: 0 = rest, 1 = scheduled (no check), 2 = completed (check)
// Full Body split: one day on, one day off → gym on Mon, Wed, Fri, Sun
const FULL_BODY_SCHEDULE = [1, 0, 1, 0, 1, 0, 1];

function getTooltipText(status, isPast, isToday) {
  const isGymDay = status >= 1;
  const isCompleted = status === 2;
  if (!isGymDay) return 'Rest day 😌';
  if (isPast && isCompleted) return 'Workout completed ✅';
  if (isPast && !isCompleted) return 'Missed workout ❌';
  if (isToday) return 'Workout today — let\'s go! 💪';
  return 'Workout day ahead 💪';
}

export default function WeekTracker({ schedule = FULL_BODY_SCHEDULE }) {
  const todayIndex = new Date().getDay(); // 0=Sun → 6 in Mon-Sun scale
  // Convert JS day (0=Sun,6=Sat) to Mon-Sun (0=Mon,6=Sun)
  const todayMonSun = todayIndex === 0 ? 6 : todayIndex - 1;
  const [activeDay, setActiveDay] = useState(todayMonSun);

  return (
    <div className="px-4 pb-2">
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
        {schedule.map((status, i) => {
          const isToday = i === todayMonSun;
          const isGymDay = status >= 1;
          const isCompleted = status === 2;
          const isPast = i < todayMonSun; // day has already passed
          const missed = isPast && isGymDay && !isCompleted; // due but not done
          const showCheck = isPast && isGymDay && isCompleted;
          const showDumbbell = isGymDay && !isPast; // today or future → upcoming

          let bgClass = '';
          if (missed) bgClass = 'bg-red-500';
          else if (isGymDay) bgClass = 'bg-blue-500';
          else bgClass = 'border border-blue-300 dark:border-blue-700 bg-transparent';

          return (
            <div
              key={i}
              className="flex items-center w-5 justify-center"
              onClick={() => setActiveDay(activeDay === i ? todayMonSun : i)}
              onMouseEnter={() => setActiveDay(i)}
              onMouseLeave={() => setActiveDay(todayMonSun)}
            >
              {/* Circle */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-150 cursor-pointer ${
                  isToday
                    ? 'ring-[1.5px] ring-emerald-500 ring-offset-1 ring-offset-background'
                    : ''
                } ${bgClass}`}
              >
                {showCheck && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                {missed && <X className="w-3 h-3 text-white" strokeWidth={3} />}
                {showDumbbell && <Dumbbell className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      <div className="flex justify-center mt-2">
        <span className="text-[11px] font-medium text-muted-foreground text-center min-h-[16px]">
          {getTooltipText(schedule[activeDay], activeDay < todayMonSun, activeDay === todayMonSun)}
        </span>
      </div>
    </div>
  );
}