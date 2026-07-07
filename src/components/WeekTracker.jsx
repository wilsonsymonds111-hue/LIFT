import { memo, useRef, useEffect } from 'react';
import { Check, Dumbbell } from 'lucide-react';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function WeekTracker({ schedule, cycleLabel, startDayIndex = 0, workoutNames = [], dayColors = [], todayDisplayIndex = 0 }) {
  const scrollRef = useRef(null);
  const todayIndex = new Date().getDay();
  const todayMonSun = todayIndex === 0 ? 6 : todayIndex - 1;

  const dayLabels = schedule.map((_, i) => {
    const offset = i - todayDisplayIndex;
    return DAY_LETTERS[((todayMonSun + offset) % 7 + 7) % 7];
  });

  // Auto-scroll so today is at the leftmost visible position
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const todayEl = container.children[todayDisplayIndex];
    if (todayEl) container.scrollLeft = todayEl.offsetLeft;
  }, [todayDisplayIndex]);

  return (
    <div className="px-4 pb-2">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x mandatory',
        }}
      >
        {schedule.map((status, i) => {
          const isToday = i === todayDisplayIndex;
          const isGymDay = status >= 1;
          const isCompleted = status === 2;

          let bgClass = '';
          if (isCompleted) bgClass = 'bg-emerald-500';
          else if (isGymDay) bgClass = 'bg-blue-500';
          else bgClass = 'border border-blue-300 dark:border-blue-700 bg-transparent';

          return (
            <div
              key={i}
              className="flex flex-col items-center flex-shrink-0 px-1"
              style={{ width: 'calc(100% / 7)', scrollSnapAlign: 'start' }}
            >
              <span className={`text-xs font-semibold mb-1.5 text-center ${isToday ? 'text-foreground' : 'text-muted-foreground'}`}>
                {dayLabels[i]}
              </span>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ease-out active:scale-90 ${
                  isToday ? 'ring-2 ring-emerald-500 ring-offset-1 ring-offset-background' : ''
                } ${bgClass}`}
              >
                {isCompleted && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                {isGymDay && !isCompleted && <Dumbbell className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(WeekTracker);