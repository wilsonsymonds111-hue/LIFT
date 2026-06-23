import { MoreHorizontal, Dumbbell, ChevronRight, Check } from 'lucide-react';
import { memo } from 'react';

const SPLIT_COLORS = {
  'upper-lower': { icon: 'text-blue-500', iconBg: 'bg-blue-50 dark:bg-blue-950/40', title: 'text-blue-500', bars: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'] },
  'push-pull-legs': { icon: 'text-purple-500', iconBg: 'bg-purple-50 dark:bg-purple-950/40', title: 'text-purple-500', bars: ['#A855F7', '#C084FC', '#D8B4FE', '#E9D5FF'] },
  'full-body': { icon: 'text-orange-500', iconBg: 'bg-orange-50 dark:bg-orange-950/40', title: 'text-orange-500', bars: ['#F97316', '#FB923C', '#FDBA74', '#FED7AA'] },
  'ul-ppl': { icon: 'text-emerald-500', iconBg: 'bg-emerald-50 dark:bg-emerald-950/40', title: 'text-emerald-500', bars: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'] },
};

const DEFAULT_COLORS = [
  { icon: 'text-blue-500', iconBg: 'bg-blue-50 dark:bg-blue-950/40', title: 'text-blue-500', bars: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'] },
  { icon: 'text-rose-500', iconBg: 'bg-rose-50 dark:bg-rose-950/40', title: 'text-rose-500', bars: ['#F43F5E', '#FB7185', '#FDA4AF', '#FECDD3'] },
  { icon: 'text-amber-500', iconBg: 'bg-amber-50 dark:bg-amber-950/40', title: 'text-amber-500', bars: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A'] },
];

function detectSplitType(workoutNames) {
  const lower = workoutNames.map(n => n.toLowerCase());
  const hasUpper = lower.some(n => n.includes('upper'));
  const hasLower = lower.some(n => n.includes('lower'));
  const hasPush = lower.some(n => n.includes('push'));
  const hasPull = lower.some(n => n.includes('pull'));
  const hasLegs = lower.some(n => n.includes('legs'));
  const hasFull = lower.some(n => n.includes('full'));

  if (hasFull && !hasUpper && !hasLower) return 'full-body';
  if (hasPush && hasPull && hasLegs) return 'push-pull-legs';
  if (hasUpper && hasLower && hasPush && hasPull && hasLegs) return 'ul-ppl';
  if (hasUpper && hasLower) return 'upper-lower';
  if (hasPush || hasPull || hasLegs) return 'push-pull-legs';
  return 'upper-lower';
}

const SplitCard = memo(function SplitCard({ splitKey, name, workouts, onCardClick, onMenuToggle, menuRef, cardRef, isActive, imageIndex }) {
  const isExampleSplit = !!SPLIT_COLORS[splitKey];
  const colorKey = isExampleSplit ? splitKey : detectSplitType(workouts.map(w => w.name));
  const colors = SPLIT_COLORS[colorKey] || DEFAULT_COLORS[
    imageIndex != null
      ? imageIndex % DEFAULT_COLORS.length
      : splitKey
        ? (parseInt(splitKey.match(/\d+/)?.[0] || '0', 10) || 0) % DEFAULT_COLORS.length
        : 0
  ];

  const workoutCount = workouts.length;
  const displayName = name.replace(/ Workout$/, '');

  // Mini bar chart — one bar per workout, heights vary for visual interest
  const barHeights = workouts.map((_, i) => {
    const base = 40 + (i * 13) % 45;
    return Math.min(base, 90);
  });

  return (
    <div ref={cardRef}>
      <div
        onClick={onCardClick}
        className="relative bg-white dark:bg-card rounded-[20px] cursor-pointer group active:scale-[0.98] transition-all duration-150 hover:scale-[1.01] overflow-hidden focus:outline-none border border-gray-100/80 dark:border-border shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
      >
        <div className="p-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colors.iconBg}`}>
                <Dumbbell className={`w-4 h-4 ${colors.icon}`} strokeWidth={2.5} />
              </div>
              <span className={`text-sm font-bold ${colors.title}`}>{displayName}</span>
            </div>
            <div className="flex items-center gap-1">
              {isActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wide">
                  <Check className="w-2.5 h-2.5" strokeWidth={3} />
                  Current
                </span>
              )}
              {onMenuToggle ? (
                <button
                  ref={menuRef}
                  onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted transition"
                >
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Content row: big value + mini bar chart */}
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-black dark:text-foreground leading-none">{workoutCount}</span>
              <span className="text-xs text-gray-400 dark:text-muted-foreground font-medium">workout{workoutCount !== 1 ? 's' : ''}</span>
            </div>

            {/* Mini bar chart */}
            <div className="flex items-end gap-1 h-9">
              {barHeights.map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full"
                  style={{
                    height: `${h}%`,
                    backgroundColor: colors.bars[i % colors.bars.length],
                    opacity: i === barHeights.length - 1 ? 1 : 0.5,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Workout name pills */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {workouts.map((w, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-50 dark:bg-muted text-gray-600 dark:text-muted-foreground text-[11px] font-medium"
              >
                {w.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default SplitCard;