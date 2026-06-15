import { ChevronRight } from 'lucide-react';

const SPLIT_ICONS = {
  'upper-lower': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/cdafd5431_generated_image.png',
  'push-pull-legs': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/4513db152_generated_image.png',
  'full-body': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/9f6a596bd_generated_image.png',
  'ul-ppl': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/da876d60f_generated_image.png',
};

const GLOW_COLORS = {
  blue: { glow: 'shadow-[0_0_20px_rgba(0,242,255,0.3)]', border: 'border-cyan-400/30', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-400/30', iconGlow: 'drop-shadow-[0_0_8px_rgba(0,242,255,0.6)]', chevron: 'text-cyan-400' },
  green: { glow: 'shadow-[0_0_20px_rgba(52,211,153,0.3)]', border: 'border-emerald-400/30', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-400/30', iconGlow: 'drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]', chevron: 'text-emerald-400' },
  purple: { glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]', border: 'border-purple-400/30', badge: 'bg-purple-500/10 text-purple-400 border-purple-400/30', iconGlow: 'drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]', chevron: 'text-purple-400' },
  orange: { glow: 'shadow-[0_0_20px_rgba(251,146,60,0.3)]', border: 'border-orange-400/30', badge: 'bg-orange-500/10 text-orange-400 border-orange-400/30', iconGlow: 'drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]', chevron: 'text-orange-400' },
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
  const glow = GLOW_COLORS[colorKey] || GLOW_COLORS.blue;
  const icon = SPLIT_ICONS[splitKey] || SPLIT_ICONS[colorKey] || SPLIT_ICONS['upper-lower'];

  return (
    <div
      ref={cardRef}
      onClick={onCardClick}
      className={`relative rounded-2xl cursor-pointer group active:scale-[0.98] transition-all duration-200 bg-[#121212] border ${glow.border} ${glow.glow} hover:shadow-[0_0_30px_rgba(0,242,255,0.2)]`}
    >
      {/* Card body */}
      <div className="px-4 pt-4 pb-3">
        {/* Top row: icon + title */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden bg-transparent flex items-center justify-center">
            <img src={icon} alt="" className="w-10 h-10 object-contain" style={{ filter: glow.iconGlow }} />
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h4 className="font-extrabold text-white text-sm tracking-tight leading-tight">
              {name.replace(/ Workout$/, '')}
            </h4>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              {workouts.map(w => w.name).join(' | ')}
            </p>
          </div>
          <button
            ref={menuRef}
            onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition flex-shrink-0 mt-1"
          >
            <svg className="w-3 h-3 text-gray-500" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>
        </div>

        {/* Three cyan dots separator */}
        <div className="flex items-center justify-center gap-1.5 my-3">
          <div className="w-1 h-1 rounded-full bg-cyan-400/60" />
          <div className="w-1 h-1 rounded-full bg-cyan-400/40" />
          <div className="w-1 h-1 rounded-full bg-cyan-400/20" />
        </div>

        {/* Bottom row: badge + chevron */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${glow.badge}`}>
            <span>🏋️</span>
            <span>{workouts.length} workout{workouts.length !== 1 ? 's' : ''}</span>
          </span>
          <ChevronRight className={`w-4 h-4 ${glow.chevron}`} />
        </div>
      </div>
    </div>
  );
}