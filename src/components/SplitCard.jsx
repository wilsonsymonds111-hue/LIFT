import { MoreHorizontal } from 'lucide-react';
import { memo } from 'react';

const SPLIT_ACCENTS = {
  'upper-lower':     { border: 'border-l-blue-500',   pill: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
  'push-pull-legs':  { border: 'border-l-emerald-500', pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  'full-body':       { border: 'border-l-purple-500',  pill: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' },
  'ul-ppl':          { border: 'border-l-amber-500',   pill: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
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
        className={`relative bg-card rounded-2xl cursor-pointer group active:scale-[0.98] transition-all duration-200 hover:scale-[1.01] hover:shadow-lg shadow-sm border border-border ${colors.border} border-l-[3px] min-h-[160px] p-5`}
      >
        {/* Menu button */}
        {onMenuToggle && (
          <button
            ref={menuRef}
            onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition"
          >
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        {/* Split name */}
        <h3 className="font-bold text-foreground text-sm uppercase tracking-wide pr-6 leading-tight">
          {name}
        </h3>

        {/* Divider */}
        <div className="w-8 h-0.5 bg-border rounded-full mt-3 mb-3" />

        {/* Workout list */}
        <div className="space-y-1.5">
          {workouts.map((w, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colorKey === 'upper-lower' ? 'bg-blue-500' : colorKey === 'push-pull-legs' ? 'bg-emerald-500' : colorKey === 'full-body' ? 'bg-purple-500' : 'bg-amber-500'}`} />
              <span className="text-sm text-muted-foreground">{w.name}</span>
            </div>
          ))}
        </div>

        {/* Badge */}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/60">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${colors.pill}`}>
            {workoutCount} workout{workoutCount !== 1 ? 's' : ''}
          </span>
          <span className="text-[11px] text-muted-foreground">{name.replace(/ Workout$/, '').replace(/(?<!Full) Body$/, '')}</span>
        </div>
      </div>
    </div>
  );
});

export default SplitCard;