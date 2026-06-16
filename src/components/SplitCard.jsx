import { Dumbbell, ChevronRight, MoreHorizontal } from 'lucide-react';

const SPLIT_BG_IMAGES = {
  'upper-lower': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/394d180a1_generated_image.png',
  'push-pull-legs': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/3c205ad33_generated_image.png',
  'full-body': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/23b80260a_generated_image.png',
  'ul-ppl': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/3dc240698_generated_image.png',
};

const ACCENT_COLORS = {
  blue: { badge: 'bg-[#2A8FFF]', chevron: 'bg-[#2A8FFF]', tint: 'rgba(30, 100, 220, 0.18)' },
  green: { badge: 'bg-[#43A047]', chevron: 'bg-[#43A047]', tint: 'rgba(50, 140, 50, 0.18)' },
  purple: { badge: 'bg-[#8E24AA]', chevron: 'bg-[#8E24AA]', tint: 'rgba(120, 30, 150, 0.18)' },
  orange: { badge: 'bg-[#F57C00]', chevron: 'bg-[#F57C00]', tint: 'rgba(220, 100, 0, 0.18)' },
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
    <div ref={cardRef} className="relative">
      <div
        onClick={onCardClick}
        className="relative rounded-2xl cursor-pointer group active:scale-[0.98] transition-all duration-150 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.35)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.65)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.8)] hover:scale-[1.02]"
        style={{
          height: 200,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 50%',
          backgroundColor: '#0f0f1a',
        }}
      >
        {/* Bottom gradient for text readability */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.3) 65%, rgba(0,0,0,0.1) 100%)'
        }} />

        {/* Content layer */}
        <div className="relative h-full flex flex-col justify-between px-4 py-3.5">
          {/* Top section */}
          <div>
            {/* Top row: icon + title + menu */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-white" strokeWidth={1.5} />
                <h4 className="font-extrabold text-white text-sm tracking-widest uppercase leading-tight">
                  {name.replace(/ Workout$/, '')}
                </h4>
              </div>

              {/* Menu button — only for user-created splits */}
              {onMenuToggle && (
                <button
                  ref={menuRef}
                  onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition flex-shrink-0"
                >
                  <MoreHorizontal className="w-3.5 h-3.5 text-white" />
                </button>
              )}
            </div>

            {/* Subtitle */}
            <p className="text-xs text-white/90 font-medium mt-2 leading-relaxed line-clamp-2" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
              {subtitle}
            </p>
          </div>

          {/* Bottom row: badge + chevron */}
          <div className="flex items-center justify-between">
            {/* Workout count badge */}
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white text-black text-[11px] font-bold tracking-wide">
              {workoutCount} WORKOUT{workoutCount !== 1 ? 'S' : ''}
            </span>

            {/* Chevron button */}
            <div className={`w-7 h-7 rounded-full ${accent.chevron} flex items-center justify-center`}>
              <ChevronRight className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}