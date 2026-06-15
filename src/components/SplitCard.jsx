import { Dumbbell, ChevronRight } from 'lucide-react';

const SPLIT_IMAGES = {
  'upper-lower': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/0b33c1635_generated_image.png',
  'push-pull-legs': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/20f6bb485_generated_image.png',
  'full-body': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/9bd01ac0a_generated_image.png',
  'ul-ppl': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/f9cb45692_generated_image.png',
};

const ACCENT = {
  blue: {
    tagBg: 'bg-blue-500/15',
    tagText: 'text-blue-200',
    countBg: 'bg-blue-100',
    countText: 'text-blue-700',
  },
  green: {
    tagBg: 'bg-emerald-500/15',
    tagText: 'text-emerald-200',
    countBg: 'bg-emerald-100',
    countText: 'text-emerald-700',
  },
  purple: {
    tagBg: 'bg-purple-500/15',
    tagText: 'text-purple-200',
    countBg: 'bg-purple-100',
    countText: 'text-purple-700',
  },
  orange: {
    tagBg: 'bg-amber-500/15',
    tagText: 'text-amber-200',
    countBg: 'bg-amber-100',
    countText: 'text-amber-700',
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
  const displayName = name.replace(/ Workout$/, '');
  const workoutLabels = workouts.map(w => w.name).join(' | ');

  return (
    <div
      ref={cardRef}
      className="relative rounded-2xl cursor-pointer group active:scale-[0.99] transition-all duration-200 shadow-md hover:shadow-xl hover:scale-[1.02] overflow-hidden bg-card"
      onClick={onCardClick}
    >
      {/* Header image area */}
      <div className="relative w-full aspect-[16/9] overflow-hidden">
        <img src={image} alt="" className="w-full h-full object-cover" />
        {/* Text overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-4"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)' }}
        >
          <h3 className="text-white font-extrabold text-lg leading-tight tracking-tight">
            {displayName}
          </h3>
          <p className="text-white/80 text-xs font-medium mt-1">
            {workoutLabels}
          </p>
        </div>
      </div>

      {/* Footer bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-card">
        <button
          ref={menuRef}
          onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition select-none"
        >
          <svg className="w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-muted-foreground" />
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${accent.countBg} ${accent.countText}`}>
            {workouts.length}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
        </div>
      </div>
    </div>
  );
}