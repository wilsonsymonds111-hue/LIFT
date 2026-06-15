import { Dumbbell, ChevronRight, MoreHorizontal } from 'lucide-react';

const SPLIT_BG_IMAGES = {
  'upper-lower': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/35a120ac0_generated_image.png',
  'push-pull-legs': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/a86904896_generated_image.png',
  'full-body': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/4f618e97f_generated_image.png',
  'ul-ppl': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/949b26cf8_generated_image.png',
};

const ACCENT_COLORS = {
  blue: { badge: 'bg-[#2A8FFF]', chevron: 'bg-[#2A8FFF]' },
  green: { badge: 'bg-[#43A047]', chevron: 'bg-[#43A047]' },
  purple: { badge: 'bg-[#8E24AA]', chevron: 'bg-[#8E24AA]' },
  orange: { badge: 'bg-[#F57C00]', chevron: 'bg-[#F57C00]' },
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
  const accent = ACCENT_COLORS[colorKey] || ACCENT_COLORS.blue;
  const bgImage = SPLIT_BG_IMAGES[splitKey] || SPLIT_BG_IMAGES[colorKey] || SPLIT_BG_IMAGES['upper-lower'];
  const subtitle = workouts.map(w => w.name).join(' | ');
  const workoutCount = workouts.length;

  return (
    <div
      ref={cardRef}
      onClick={onCardClick}
      className="relative rounded-2xl cursor-pointer group active:scale-[0.98] transition-all duration-200 overflow-hidden"
      style={{ minHeight: 240 }}
    >
      {/* Background image with dark overlay */}
      <div className="absolute inset-0">
        <img
          src={bgImage}
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: '50% 33%' }}
        />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 62% 48%, transparent 30%, rgba(0,0,0,0.1) 55%, rgba(0,0,0,0.65) 90%)'
        }} />
      </div>

      {/* Content layer */}
      <div className="relative h-full flex flex-col justify-between px-5 py-5">
        {/* Top section */}
        <div>
          {/* Top row: icon + title + menu */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Dumbbell className="w-5 h-5 text-white" strokeWidth={1.5} />
              <h4 className="font-extrabold text-white text-base tracking-widest uppercase leading-tight">
                {name.replace(/ Workout$/, '')}
              </h4>
            </div>

            {/* Menu button */}
            <button
              ref={menuRef}
              onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition flex-shrink-0"
            >
              <MoreHorizontal className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Subtitle */}
          <p className="text-sm text-white/70 font-medium mt-3 leading-relaxed">
            {subtitle}
          </p>

          {/* Three dots separator */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          </div>
        </div>

        {/* Bottom row: badge + chevron */}
        <div className="flex items-center justify-between">
          {/* Workout count badge */}
          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white text-black text-xs font-bold tracking-wide">
            {workoutCount} WORKOUT{workoutCount !== 1 ? 'S' : ''}
          </span>

          {/* Chevron button */}
          <div className={`w-9 h-9 rounded-full ${accent.chevron} flex items-center justify-center`}>
            <ChevronRight className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </div>
  );
}