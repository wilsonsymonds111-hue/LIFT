import { MoreHorizontal } from 'lucide-react';
import { memo } from 'react';

const SPLIT_ACCENTS = {
  'upper-lower':     { hoverBorder: 'hover:border-blue-500',   dot: 'bg-blue-500',   pill: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  'push-pull-legs':  { hoverBorder: 'hover:border-emerald-500', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  'full-body':       { hoverBorder: 'hover:border-purple-500',  dot: 'bg-purple-500',  pill: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  'ul-ppl':          { hoverBorder: 'hover:border-amber-500',   dot: 'bg-amber-500',   pill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
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
  const workoutCount = workouts.length;

  return (
    <div ref={cardRef}>
      <div
        onClick={onCardClick}
        className={`relative bg-card rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.45)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.22)] dark:hover:shadow-[0_8px_28px_rgba(0,0,0,0.55)] hover:scale-[1.02] transition-all duration-150 cursor-pointer border-2 border-blue-400/30 ${colors.hoverBorder}`}
      >
        {/* Menu button */}
        {onMenuToggle && (
          <button
            ref={menuRef}
            onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition z-10"
          >
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Split name */}
        <h3 className="font-extrabold text-foreground text-lg tracking-tight pr-8 leading-tight">
          {name}
        </h3>

        {/* Colored accent line */}
        <div className={`w-10 h-1 ${colors.dot} rounded-full mt-3 mb-4`} />

        {/* Workout pills */}
        <div className="flex flex-wrap gap-2">
          {workouts.map((w, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold ${colors.pill}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} />
              {w.name}
            </span>
          ))}
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-border/60">
          <span className="text-xs font-semibold text-muted-foreground">
            {workoutCount} workout{workoutCount !== 1 ? 's' : ''}
          </span>
          <span className={`text-[11px] font-bold uppercase tracking-wider ${colorKey === 'upper-lower' ? 'text-blue-500' : colorKey === 'push-pull-legs' ? 'text-emerald-500' : colorKey === 'full-body' ? 'text-purple-500' : 'text-amber-500'}`}>
            {colorKey === 'upper-lower' ? 'Upper/Lower' : colorKey === 'push-pull-legs' ? 'PPL' : colorKey === 'full-body' ? 'Full Body' : 'UL/PPL'}
          </span>
        </div>
      </div>
    </div>
  );
});

export default SplitCard;