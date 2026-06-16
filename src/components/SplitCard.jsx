import { MoreHorizontal } from 'lucide-react';
import { memo } from 'react';

const SPLIT_IMAGES = {
  'upper-lower': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/60f426734_image.png',
  'push-pull-legs': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/e9b1aea0d_image.png',
  'full-body': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/2b264bebb_generated_image.png',
  'ul-ppl': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/ac60aca39_generated_image.png',
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
  const colorKey = SPLIT_IMAGES[splitKey] ? splitKey : detectSplitType(workouts.map(w => w.name));
  const bgImage = SPLIT_IMAGES[colorKey] || SPLIT_IMAGES['upper-lower'];
  const subtitle = workouts.map(w => w.name).join(' • ');
  const workoutCount = workouts.length;
  const displayName = name.replace(/ Workout$/, '');

  return (
    <div ref={cardRef}>
      <div
        onClick={onCardClick}
        className="relative rounded-2xl cursor-pointer group active:scale-[0.98] transition-all duration-150 hover:scale-[1.01] overflow-hidden min-h-[160px]"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative p-5 flex flex-col justify-end h-full min-h-[160px]">
          {/* Top row: menu */}
          {onMenuToggle && (
            <button
              ref={menuRef}
              onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 flex items-center justify-center transition"
            >
              <MoreHorizontal className="w-4 h-4 text-white/90" />
            </button>
          )}

          {/* Split name */}
          <h4 className="font-extrabold text-white text-lg uppercase tracking-wider pr-6">
            {displayName}
          </h4>

          {/* Workout names */}
          <p className="text-sm text-white/75 mt-2 leading-relaxed line-clamp-2">
            {subtitle}
          </p>

          {/* Badge */}
          <div className="mt-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs font-semibold tracking-wide">
              {workoutCount} work{workoutCount !== 1 ? 'outs' : 'out'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SplitCard;