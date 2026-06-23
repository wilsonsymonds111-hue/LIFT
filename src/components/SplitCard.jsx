import { MoreHorizontal, Dumbbell, ChevronRight, Check } from 'lucide-react';
import { memo } from 'react';

const SPLIT_COLORS = {
  'upper-lower': {},
  'push-pull-legs': {},
  'full-body': {},
  'ul-ppl': {},
};

const DEFAULT_COLORS = [
  {},
  {},
  {},
];

const EXERCISE_IMAGES = [
  'https://images.unsplash.com/photo-1587280413256-afc9d30aede4?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1594381898411-84ec4f5cd234?w=500&h=300&fit=crop',
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

  const imageUrl = EXERCISE_IMAGES[
    imageIndex != null
      ? imageIndex % EXERCISE_IMAGES.length
      : splitKey
        ? (parseInt(splitKey.match(/\d+/)?.[0] || '0', 10) || 0) % EXERCISE_IMAGES.length
        : 0
  ];

  return (
    <div ref={cardRef}>
      <div
        onClick={onCardClick}
        className="relative bg-white dark:bg-card rounded-[24px] cursor-pointer group active:scale-[0.98] transition-all duration-150 hover:scale-[1.01] overflow-hidden focus:outline-none border border-gray-100/80 dark:border-border shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
      >
        {/* Subtle background image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url('${imageUrl}')` }}
        />

        <div className="relative p-5 z-10">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-lg font-bold text-gray-950 dark:text-white tracking-tight leading-tight">{displayName}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {isActive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100/50 dark:bg-emerald-900/30 backdrop-blur-sm text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold uppercase tracking-wide border border-emerald-200/50 dark:border-emerald-700/30">
                  <Check className="w-3 h-3" strokeWidth={2.5} />
                  Current
                </span>
              )}
              {onMenuToggle ? (
                <button
                  ref={menuRef}
                  onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-400/20 dark:hover:bg-white/10 transition"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </div>
          </div>

          {/* Workout count */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-950 dark:text-white leading-none">{workoutCount}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">workout{workoutCount !== 1 ? 's' : ''}</span>
          </div>

          {/* Workout name pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {workouts.map((w, i) => (
              <span
                key={i}
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-400/20 dark:bg-white/10 backdrop-blur-sm text-gray-700 dark:text-gray-300 text-[12px] font-medium border border-gray-300/40 dark:border-white/10"
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