import { MoreHorizontal, Dumbbell, ChevronRight, Check } from 'lucide-react';
import { memo } from 'react';

const SPLIT_COLORS = {
  'upper-lower': {},
  'push-pull-legs': {},
  'full-body': {},
  'ul-ppl': {},
};

const DEFAULT_COLORS = [
  {},
  {},
  {},
];

const SPLIT_IMAGES = {
  'upper-lower': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/e8cb3e56c_image.png',
  'push-pull-legs': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/a9ff09fcf_image.png',
  'full-body': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/1f3b4e760_image.png',
  'ul-ppl': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/831e29602_image.png',
};

const SPLIT_LABELS = {
  'upper-lower': 'Mikey T split',
  'push-pull-legs': 'CBUM Split',
  'full-body': 'Reg Park Split',
  'ul-ppl': 'Jeff Nippard Split',
};

const EXERCISE_IMAGES = [
  'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/0e890b4e6_generated_image.png',
  'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/6c19ca21c_generated_image.png',
  'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/36a580eac_generated_image.png',
  'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/8ac0f57d5_generated_image.png',
];

const TEXT_COLORS = [
  { title: 'text-blue-600', subtitle: 'text-blue-500', accent: 'bg-blue-100/50 text-blue-700' },
  { title: 'text-amber-600', subtitle: 'text-amber-500', accent: 'bg-amber-100/50 text-amber-700' },
  { title: 'text-emerald-600', subtitle: 'text-emerald-500', accent: 'bg-emerald-100/50 text-emerald-700' },
  { title: 'text-rose-600', subtitle: 'text-rose-500', accent: 'bg-rose-100/50 text-rose-700' },
];

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

const SplitCard = memo(function SplitCard({ splitKey, name, workouts, onCardClick, onMenuToggle, menuRef, cardRef, isActive, imageIndex, backgroundImage }) {
  const isExampleSplit = !!SPLIT_COLORS[splitKey];
  const colorKey = isExampleSplit ? splitKey : detectSplitType(workouts.map(w => w.name));
  const colors = SPLIT_COLORS[colorKey] || DEFAULT_COLORS[
    imageIndex != null
      ? imageIndex % DEFAULT_COLORS.length
      : splitKey
        ? (parseInt(splitKey.match(/\d+/)?.[0] || '0', 10) || 0) % DEFAULT_COLORS.length
        : 0
  ];

  const workoutCount = workouts.length;
  const displayName = name.replace(/ Workout$/, '');

  // Mini bar chart — one bar per workout, heights vary for visual interest
  const barHeights = workouts.map((_, i) => {
    const base = 40 + (i * 13) % 45;
    return Math.min(base, 90);
  });

  const detectedType = detectSplitType(workouts.map(w => w.name));
  const fallbackImage = SPLIT_IMAGES[isExampleSplit ? splitKey : detectedType] || EXERCISE_IMAGES[
    imageIndex != null
      ? imageIndex % EXERCISE_IMAGES.length
      : splitKey
        ? (parseInt(splitKey.match(/\d+/)?.[0] || '0', 10) || 0) % EXERCISE_IMAGES.length
        : 0
  ];
  const imageUrl = backgroundImage || fallbackImage;

  const colorIndex = imageIndex != null
    ? imageIndex % TEXT_COLORS.length
    : splitKey
      ? (parseInt(splitKey.match(/\d+/)?.[0] || '0', 10) || 0) % TEXT_COLORS.length
      : 0;
  const cardColors = TEXT_COLORS[colorIndex];

  const isPhotoBackground = isExampleSplit || !!backgroundImage;
  const splitLabel = isExampleSplit ? SPLIT_LABELS[splitKey] : null;

  return (
    <div ref={cardRef}>
      <div
        onClick={onCardClick}
        style={{ backgroundColor: 'rgba(249, 249, 249, 0.85)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)' }}
        className={`relative rounded-[24px] cursor-pointer group active:scale-[0.98] transition-all duration-150 hover:scale-[1.01] overflow-hidden focus:outline-none border border-white/80 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.06),inset_0_0_0_1px_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.1)] ${isPhotoBackground ? 'h-[180px]' : ''}`}
      >
        {/* Background image — full color <img> for photo splits, blurred B&W div for others */}
        {isPhotoBackground ? (
          <>
            <img
              src={imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
              style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', imageRendering: '-webkit-optimize-contrast' }}
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.15) 0%, transparent 25%)' }} />
          </>
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url('${imageUrl}')`,
              filter: 'blur(3px) saturate(0) contrast(1.1)'
            }}
          />
        )}

        {/* Photo layout: all text bottom-left, title case, smaller */}
        {isPhotoBackground ? (
          <>
            {/* Top-right controls */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
              {isActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/80 backdrop-blur-sm text-white text-[9px] font-semibold tracking-wide border border-emerald-300/40">
                  <Check className="w-2.5 h-2.5" strokeWidth={2.5} />
                  Current
                </span>
              )}
              {onMenuToggle ? (
                <button
                  ref={menuRef}
                  onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition"
                >
                  <MoreHorizontal className="w-4 h-4 text-white" />
                </button>
              ) : (
                <ChevronRight className="w-4 h-4 text-white" />
              )}
            </div>

            {/* Bottom-left content with feathered blur behind text */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-10" style={{ transform: 'translateZ(0)' }}>
              <span className="relative inline-block text-lg font-extrabold font-display leading-tight text-white uppercase" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
                <span
                  className="absolute"
                  style={{
                    inset: '-24px -32px',
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    filter: 'blur(28px)',
                    WebkitFilter: 'blur(18px)',
                    borderRadius: '8px',
                  }}
                />
                <span className="relative">{displayName.toUpperCase()}{splitLabel && <span className="normal-case"> ({splitLabel})</span>}</span>
              </span>
            </div>
          </>
        ) : (
          /* Original layout for non-photo cards */
          <div className="relative p-5 z-10" style={{ transform: 'translateZ(0)' }}>
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-lg font-bold font-display uppercase tracking-wide leading-tight text-foreground dark:text-white">{displayName}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isActive && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100/50 dark:bg-emerald-900/30 backdrop-blur-sm text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold uppercase tracking-wide border border-emerald-200/50 dark:border-emerald-700/30">
                    <Check className="w-3 h-3" strokeWidth={2.5} />
                    Current
                  </span>
                )}
                {onMenuToggle ? (
                  <button
                    ref={menuRef}
                    onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-400/20 dark:hover:bg-white/10 transition"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
              </div>
            </div>

            {/* Workout count */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-display leading-none text-foreground dark:text-white">{workoutCount}</span>
              <span className="text-sm font-display font-normal text-muted-foreground">workout{workoutCount !== 1 ? 's' : ''}</span>
            </div>

            {/* Workout name pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {workouts.map((w, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted dark:bg-white/10 backdrop-blur-sm text-foreground dark:text-gray-300 text-[12px] font-display uppercase tracking-wide font-medium border border-border dark:border-white/10"
                >
                  {w.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default SplitCard;