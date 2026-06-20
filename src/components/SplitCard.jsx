import { MoreHorizontal } from 'lucide-react';
import { memo } from 'react';

const SPLIT_COLORS = {
  'upper-lower': { light: 'from-blue-500/20 to-blue-600/10', pill: 'bg-blue-500/20 text-blue-700 dark:text-blue-300' },
  'push-pull-legs': { light: 'from-emerald-500/20 to-emerald-600/10', pill: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' },
  'full-body': { light: 'from-purple-500/20 to-purple-600/10', pill: 'bg-purple-500/20 text-purple-700 dark:text-purple-300' },
  'ul-ppl': { light: 'from-amber-500/20 to-amber-600/10', pill: 'bg-amber-500/20 text-amber-700 dark:text-amber-300' },
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
  const colorKey = SPLIT_COLORS[splitKey] ? splitKey : detectSplitType(workouts.map(w => w.name));
  const colors = SPLIT_COLORS[colorKey] || SPLIT_COLORS['upper-lower'];
  const workoutCount = workouts.length;
  const displayName = name.replace(/ Workout$/, '');

  return (
    <div ref={cardRef}>
      <div
        onClick={onCardClick}
        className="relative rounded-2xl cursor-pointer group active:scale-[0.98] transition-all duration-150 hover:scale-[1.01] overflow-hidden min-h-[160px]"
      >
        {/* Glassy card background */}
        <div className="absolute inset-0 rounded-2xl bg-white/70 dark:bg-white/[0.05] border border-white/40 dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]" />

        {/* Content */}
        <div className="relative p-5 flex flex-col justify-end h-full min-h-[160px]">
          {/* Top row: menu */}
          {onMenuToggle && (
            <button
              ref={menuRef}
              onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/[0.06] dark:bg-white/[0.08] backdrop-blur-sm hover:bg-black/[0.12] dark:hover:bg-white/[0.15] flex items-center justify-center transition"
            >
              <MoreHorizontal className="w-4 h-4 text-foreground/70" />
            </button>
          )}

          {/* Split name */}
          <h4 className="font-extrabold text-foreground text-sm uppercase tracking-wider pr-6 leading-tight">
            {displayName}
          </h4>

          {/* Workout name pills */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {workouts.map((w, i) => (
              <span key={i} className={`inline-flex items-center px-3 py-1.5 rounded-[6px] backdrop-blur-sm text-xs font-semibold tracking-wide ${colors.pill}`}>
                {w.name}
              </span>
            ))}
          </div>

          {/* Badge */}
          <div className="mt-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-foreground/[0.06] dark:bg-white/[0.08] backdrop-blur-sm text-foreground/70 text-xs font-semibold tracking-wide">
              {workoutCount} work{workoutCount !== 1 ? 'outs' : 'out'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SplitCard;