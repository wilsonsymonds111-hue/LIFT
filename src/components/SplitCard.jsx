import { Dumbbell, ChevronRight } from 'lucide-react';

const GLASS_BG = 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/83fc56b79_generated_image.png';

const SPLIT_IMAGES = {
  'upper-lower': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/e29160df2_generated_image.png',
  'push-pull-legs': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/6eff308c1_generated_image.png',
  'full-body': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/d0951c90c_generated_image.png',
  'ul-ppl': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/580205ec8_generated_image.png',
};

const ACCENT = {
  blue: {
    stripe: 'from-cyan-400 to-emerald-400',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]',
    tagBg: 'bg-white/10',
    tagText: 'text-cyan-300',
  },
  green: {
    stripe: 'from-emerald-400 to-teal-400',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.3)]',
    tagBg: 'bg-white/10',
    tagText: 'text-emerald-300',
  },
  purple: {
    stripe: 'from-violet-400 to-fuchsia-400',
    glow: 'shadow-[0_0_20px_rgba(167,139,250,0.3)]',
    tagBg: 'bg-white/10',
    tagText: 'text-violet-300',
  },
  orange: {
    stripe: 'from-amber-400 to-orange-400',
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]',
    tagBg: 'bg-white/10',
    tagText: 'text-amber-300',
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
      className="relative rounded-2xl cursor-pointer group active:scale-[0.99] transition-transform duration-150"
      onClick={onCardClick}
      style={{
        background: 'linear-gradient(135deg, #06b6d4 0%, #a855f7 50%, #f97316 100%)',
        padding: '1.5px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35), 0 0 20px rgba(6,182,212,0.15), 0 0 20px rgba(251,146,60,0.1)',
      }}
    >
      {/* Glass card body */}
      <div
        className="relative rounded-[15px] overflow-hidden"
        style={{
          backgroundImage: `url(${GLASS_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: 'rgba(15,15,30,0.85)',
          backgroundBlendMode: 'overlay',
        }}
      >
        {/* Left accent gradient strip */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${accent.stripe} rounded-l-full opacity-90`} />

        <div className="flex items-center gap-3 p-4 pl-5">
          {/* Anatomy image with glow */}
          <div className={`w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden ${accent.glow}`}>
            <div className="w-full h-full rounded-xl bg-gradient-to-br from-white/5 to-white/10 p-[1px]">
              <div className="w-full h-full rounded-[11px] overflow-hidden">
                <img src={image} alt="" className="w-full h-full object-cover opacity-90" />
              </div>
            </div>
          </div>

          {/* Center content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-extrabold text-white text-sm tracking-tight">
              {name.replace(/ Workout$/, '')}
            </h4>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {workouts.map((w, i) => (
                <span
                  key={i}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${accent.tagBg} ${accent.tagText} backdrop-blur-sm`}
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
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition select-none"
            >
              <svg className="w-3.5 h-3.5 text-white/60" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </button>
            <div className="flex items-center gap-1 text-xs text-white/60">
              <Dumbbell className="w-3 h-3" />
              <span className="font-semibold">{workouts.length}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}