import { MoreHorizontal } from 'lucide-react';
import { memo } from 'react';

const SPLIT_ACCENTS = {
  'upper-lower':     { topGradient: 'from-blue-400 to-teal-400', dot: 'bg-teal-400' },
  'push-pull-legs':  { topGradient: 'from-blue-400 to-teal-400', dot: 'bg-teal-400' },
  'full-body':       { topGradient: 'from-blue-400 to-teal-400', dot: 'bg-teal-400' },
  'ul-ppl':          { topGradient: 'from-blue-400 to-teal-400', dot: 'bg-teal-400' },
};

function detectSplitType(workoutNames) {
  const lower = workoutNames.map(n => n.toLowerCase());
  const hasUpper = lower.some(n => n.includes('upper'));
  const hasLower = lower.some(n => n.includes('lower'));
  const hasPush  = lower.some(n => n.includes('push'));
  const hasPull  = lower.some(n => n.includes('pull'));
  const hasLegs  = lower.some(n => n.includes('legs'));
  const hasFull  = lower.some(n => n.includes('full'));

  if (hasFull && !hasUpper && !hasLower) return 'full-body';
  if (hasPush && hasPull && hasLegs) return 'push-pull-legs';
  if (hasUpper && hasLower && hasPush && hasPull && hasLegs) return 'ul-ppl';
  if (hasUpper && hasLower) return 'upper-lower';
  if (hasPush || hasPull || hasLegs) return 'push-pull-legs';
  return 'upper-lower';
}

const SplitCard = memo(function SplitCard({ splitKey, name, workouts, onCardClick, onMenuToggle, menuRef, cardRef }) {
  const colorKey = SPLIT_ACCENTS[splitKey] ? splitKey : detectSplitType(workouts.map(w => w.name));
  const colors = SPLIT_ACCENTS[colorKey] || SPLIT_ACCENTS['upper-lower'];

  return (
    <div ref={cardRef}>
      <div
        onClick={onCardClick}
        className="relative bg-white/70 dark:bg-white/[0.06] backdrop-blur-xl rounded-2xl overflow-hidden cursor-pointer group active:scale-[0.98] hover:scale-[1.01] transition-all duration-200 shadow-[0_8px_32px_rgba(0,0,0,0.07)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] border border-white/40 dark:border-white/[0.06]"
      >
        {/* Top gradient accent bar */}
        <div className={`h-[3px] w-full bg-gradient-to-r ${colors.topGradient}`} />

        <div className="p-5">
          {/* Menu button */}
          {onMenuToggle && (
            <button
              ref={menuRef}
              onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition z-10"
            >
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {/* Title */}
          <h3 className="font-semibold text-[#1a1a1a] dark:text-[#e5e5e5] text-base tracking-wide pr-8">
            {name}
          </h3>

          {/* Workout pills */}
          <div className="mt-4 space-y-2">
            {workouts.map((w, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#e8eaec]/60 dark:bg-white/[0.06] transition-colors"
              >
                <span className="text-sm font-medium text-[#1a1a1a] dark:text-[#d0d0d0]">
                  {w.name}
                </span>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default SplitCard;