import { Dumbbell, ChevronRight } from 'lucide-react';

const SPLIT_IMAGES = {
  'upper-lower': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/e83e946a6_generated_image.png',
  'push-pull-legs': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/152997e59_generated_image.png',
  'full-body': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/d0951c90c_generated_image.png',
  'ul-ppl': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/a7b899de9_generated_image.png',
};

const ACCENT = {
  blue: {
    stripe: 'from-blue-400 to-cyan-400',
    tagBg: 'bg-blue-50',
    tagText: 'text-blue-600',
    iconBorder: 'border-blue-100',
  },
  green: {
    stripe: 'from-emerald-400 to-teal-400',
    tagBg: 'bg-emerald-50',
    tagText: 'text-emerald-600',
    iconBorder: 'border-emerald-100',
  },
  purple: {
    stripe: 'from-violet-400 to-purple-400',
    tagBg: 'bg-violet-50',
    tagText: 'text-violet-600',
    iconBorder: 'border-violet-100',
  },
  orange: {
    stripe: 'from-amber-400 to-orange-400',
    tagBg: 'bg-amber-50',
    tagText: 'text-amber-600',
    iconBorder: 'border-amber-100',
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
      className="relative rounded-2xl cursor-pointer group active:scale-[0.99] transition-all duration-200 bg-card border border-border shadow-sm hover:shadow-lg hover:scale-[1.02] hover:border-blue-200"
      onClick={onCardClick}
    >
      {/* Left accent gradient strip */}
      <div className={`absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b ${accent.stripe} rounded-full`} />

      <div className="flex items-center gap-3 py-4 pl-5 pr-4">
        {/* Anatomy image */}
        <div className={`w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden border-2 ${accent.iconBorder}`}>
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
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${accent.tagBg} ${accent.tagText}`}
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