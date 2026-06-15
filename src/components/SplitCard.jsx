import { Dumbbell, ChevronRight } from 'lucide-react';

const SPLIT_IMAGES = {
  'upper-lower': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/e29160df2_generated_image.png',
  'push-pull-legs': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/6eff308c1_generated_image.png',
  'full-body': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/d0951c90c_generated_image.png',
  'ul-ppl': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/580205ec8_generated_image.png',
};

const ACCENT = {
  blue: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    border: 'border-l-green-500',
    bg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-600 dark:text-green-400',
  },
  purple: {
    border: 'border-l-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    text: 'text-purple-600 dark:text-purple-400',
  },
  orange: {
    border: 'border-l-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    text: 'text-orange-600 dark:text-orange-400',
  },
};

const SPLIT_COLORS = {
  'upper-lower': 'blue',
  'push-pull-legs': 'green',
  'full-body': 'purple',
  'ul-ppl': 'orange',
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

export default function SplitCard({ splitKey, name, workouts, onCardClick, onMenuToggle, menuRef, cardRef }) {
  const colorKey = SPLIT_COLORS[splitKey] || detectSplitType(workouts.map(w => w.name));
  const accent = ACCENT[colorKey] || ACCENT.blue;
  const image = SPLIT_IMAGES[splitKey] || SPLIT_IMAGES[colorKey] || SPLIT_IMAGES['upper-lower'];

  return (
    <div
      ref={cardRef}
      className={`relative bg-card rounded-2xl shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer group border-l-[4px] ${accent.border} overflow-hidden active:scale-[0.99]`}
      onClick={onCardClick}
    >
      <div className="flex items-center gap-3 p-4">
        {/* Anatomy image */}
        <div className="w-14 h-14 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
          <img src={image} alt="" className="w-full h-full object-cover" />
        </div>

        {/* Center content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-extrabold text-foreground text-sm tracking-tight">
            {name.replace(/ Workout$/, '')}
          </h4>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {workouts.map((w, i) => (
              <span
                key={i}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${accent.bg} ${accent.text}`}
              >
                {w.name}
              </span>
            ))}
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <button
            ref={menuRef}
            onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted transition select-none"
          >
            <svg className="w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Dumbbell className="w-3 h-3" />
            <span className="font-semibold">{workouts.length}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
        </div>
      </div>
    </div>
  );
}