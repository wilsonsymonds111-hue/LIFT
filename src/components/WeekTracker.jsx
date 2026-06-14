import { Check } from 'lucide-react';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Full Body split: one day on, one day off → gym on Mon, Wed, Fri, Sun
const FULL_BODY_SCHEDULE = [true, false, true, false, true, false, true];

export default function WeekTracker({ schedule = FULL_BODY_SCHEDULE }) {
  const todayIndex = new Date().getDay(); // 0=Sun → 6 in Mon-Sun scale
  // Convert JS day (0=Sun,6=Sat) to Mon-Sun (0=Mon,6=Sun)
  const todayMonSun = todayIndex === 0 ? 6 : todayIndex - 1;

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
        {schedule.map((isGymDay, i) => {
          const isToday = i === todayMonSun;
          return (
            <div key={i} className="flex flex-col items-center w-5">
              {/* Today indicator dot */}
              {isToday && (
                <div className="w-1 h-1 rounded-full bg-emerald-500 mb-0.5" />
              )}
              {!isToday && <div className="w-1 h-1 mb-0.5" />}

              {/* Circle */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-150 ${
                  isToday
                    ? 'ring-[1.5px] ring-emerald-500 ring-offset-1 ring-offset-background'
                    : ''
                } ${
                  isGymDay
                    ? 'bg-blue-500'
                    : 'border border-blue-300 dark:border-blue-700 bg-transparent'
                }`}
              >
                {isGymDay && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}