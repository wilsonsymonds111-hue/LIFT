import { Dumbbell, ChevronRight, MoreHorizontal } from 'lucide-react';
import { memo } from 'react';

const ACCENT = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800' },
  violet: { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
};

const SPLIT_COLORS = {
  'upper-lower': 'blue',
  'push-pull-legs': 'teal',
  'full-body': 'violet',
  'ul-ppl': 'amber',
};

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

const SplitCard = memo(function SplitCard({ splitKey, name, workouts, onCardClick, onMenuToggle, menuRef, cardRef }) {
  const colorKey = SPLIT_COLORS[splitKey] || detectSplitType(workouts.map(w => w.name));
  const accent = ACCENT[colorKey] || ACCENT.blue;
  const subtitle = workouts.map(w => w.name).join(' | ');
  const workoutCount = workouts.length;
  const displayName = name.replace(/ Workout$/, '');

  return (
    <div ref={cardRef}>
      <div
        onClick={onCardClick}
        className={`relative rounded-2xl cursor-pointer group active:scale-[0.98] transition-all duration-150 bg-card border ${accent.border} shadow-sm hover:shadow-md hover:scale-[1.01] overflow-hidden`}
      >
        {/* Subtle top accent bar */}
        <div className={`h-1 w-full ${accent.text.replace('text-', 'bg-')}`} />

        <div className="p-4">
          {/* Top row: icon + title + menu */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl ${accent.bg} flex items-center justify-center`}>
                <Dumbbell className={`w-4 h-4 ${accent.text}`} strokeWidth={1.8} />
              </div>
              <h4 className="font-bold text-foreground text-sm uppercase tracking-wide">
                {displayName}
              </h4>
            </div>

            {onMenuToggle && (
              <button
                ref={menuRef}
                onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
                className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center transition flex-shrink-0"
              >
                <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Subtitle */}
          <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed line-clamp-2">
            {subtitle}
          </p>

          {/* Bottom row: badge + chevron */}
          <div className="flex items-center justify-between mt-3.5">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full ${accent.bg} ${accent.text} text-[11px] font-semibold tracking-wide`}>
              {workoutCount} work{workoutCount !== 1 ? 'outs' : 'out'}
            </span>

            <div className={`w-7 h-7 rounded-full ${accent.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <ChevronRight className={`w-4 h-4 ${accent.text}`} strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SplitCard;