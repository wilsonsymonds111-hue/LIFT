// SVG human anatomy figures — each figure highlights specific muscle groups in red (#FF3B30)

const MUSCLE_PATHS = {
  chest: [
    // Pectorals — front view
    { d: 'M35 72 Q40 68 45 72 L42 90 Q38 92 35 90 Z', view: 'front' },
    { d: 'M55 72 Q60 68 65 72 L65 90 Q62 92 58 90 Z', view: 'front' },
  ],
  shoulders: [
    // Deltoids — front view
    { d: 'M30 70 Q33 65 38 68 L35 78 Q32 80 30 78 Z', view: 'front' },
    { d: 'M62 68 Q67 65 70 70 L70 78 Q68 80 65 78 Z', view: 'front' },
  ],
  arms: [
    // Biceps — front view
    { d: 'M28 78 Q30 72 33 70 L34 88 Q32 92 28 92 Z', view: 'front' },
    { d: 'M67 70 Q70 72 72 78 L72 92 Q68 92 66 88 Z', view: 'front' },
    // Forearms
    { d: 'M28 92 L30 88 L34 88 L34 104 Q32 106 28 104 Z', view: 'front' },
    { d: 'M66 88 L70 88 L72 92 L72 104 Q68 106 66 104 Z', view: 'front' },
  ],
  back: [
    // Lats / back — front view representation (sides)
    { d: 'M38 68 L35 82 L40 98 Q36 104 30 100 L28 82 Q28 74 30 68 Z', view: 'front' },
    { d: 'M62 68 L65 82 L60 98 Q64 104 70 100 L72 82 Q72 74 70 68 Z', view: 'front' },
  ],
  core: [
    // Abs — front view
    { d: 'M43 90 L40 100 Q40 106 44 108 L56 108 Q60 106 60 100 L57 90 Q55 86 50 86 Q45 86 43 90 Z', view: 'front' },
  ],
  legs: [
    // Quads — front view
    { d: 'M36 104 Q34 108 35 118 Q36 130 34 138 L38 140 L42 138 Q40 126 40 118 Q40 108 42 104 Z', view: 'front' },
    { d: 'M58 104 Q60 108 60 118 Q60 126 58 138 L62 140 L66 138 Q64 130 65 118 Q66 108 64 104 Z', view: 'front' },
    // Inner thighs / adductors
    { d: 'M42 108 Q44 118 44 126 L43 134 L48 134 L48 126 Q48 118 50 108 Z', view: 'front' },
    // Calves
    { d: 'M34 140 L38 142 L42 140 L42 154 Q40 158 38 158 L34 154 Z', view: 'front' },
    { d: 'M58 140 L62 142 L66 140 L66 154 Q64 158 62 158 L58 154 Z', view: 'front' },
  ],
  glutes: [
    // Glutes — slight representation visible
  ],
};

const OUTLINE_PATHS = [
  // Head
  { d: 'M43 24 Q44 16 50 14 Q56 14 57 24 Q58 30 55 34 L50 37 L45 34 Q42 30 43 24 Z' },
  // Neck
  { d: 'M47 37 L46 42 L54 42 L53 37 Z' },
  // Torso
  { d: 'M30 68 Q28 45 46 42 L54 42 Q72 45 70 68 Q72 90 60 100 Q64 104 65 108 L35 108 Q36 104 40 100 Q28 90 30 68 Z' },
  // Left arm
  { d: 'M30 68 Q26 54 28 78 L28 92 Q28 104 26 106 L24 104 L24 80 Q24 62 28 44 Z' },
  // Right arm
  { d: 'M70 68 Q74 54 72 78 L72 92 Q72 104 74 106 L76 104 L76 80 Q76 62 72 44 Z' },
  // Left leg
  { d: 'M35 108 L34 120 Q33 134 34 140 L38 144 L42 140 Q41 126 41 114 L41 108 Z' },
  // Right leg
  { d: 'M65 108 L65 114 Q65 126 64 140 L66 144 L68 140 Q69 134 68 120 L67 108 Z' },
  // Left foot
  { d: 'M32 142 Q32 156 34 158 L42 156 Q44 156 42 142 Z' },
  // Right foot
  { d: 'M60 142 Q58 156 60 158 L68 156 Q70 156 68 142 Z' },
];

export default function AnatomyFigure({ variant, size = 'md' }) {
  // variant: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full'
  const highlights = getHighlights(variant);

  const sizes = { sm: 180, md: 220, lg: 260 };
  const svgSize = sizes[size] || sizes.md;

  return (
    <svg
      viewBox="20 8 60 155"
      width={svgSize}
      height={svgSize}
      className="mx-auto"
      style={{ overflow: 'visible' }}
    >
      {/* Highlighted muscle groups */}
      {MUSCLE_PATHS.chest.filter(p => highlights.includes('chest')).map((p, i) => (
        <path key={`chest-${i}`} d={p.d} fill="#FF3B30" opacity="0.85" />
      ))}
      {MUSCLE_PATHS.shoulders.filter(p => highlights.includes('shoulders')).map((p, i) => (
        <path key={`shoulders-${i}`} d={p.d} fill="#FF3B30" opacity="0.85" />
      ))}
      {MUSCLE_PATHS.arms.filter(p => highlights.includes('arms')).map((p, i) => (
        <path key={`arms-${i}`} d={p.d} fill="#FF3B30" opacity="0.85" />
      ))}
      {MUSCLE_PATHS.back.filter(p => highlights.includes('back')).map((p, i) => (
        <path key={`back-${i}`} d={p.d} fill="#FF3B30" opacity="0.85" />
      ))}
      {MUSCLE_PATHS.core.filter(p => highlights.includes('core')).map((p, i) => (
        <path key={`core-${i}`} d={p.d} fill="#FF3B30" opacity="0.85" />
      ))}
      {MUSCLE_PATHS.legs.filter(p => highlights.includes('legs')).map((p, i) => (
        <path key={`legs-${i}`} d={p.d} fill="#FF3B30" opacity="0.85" />
      ))}

      {/* Outline — drawn over the highlights for clean edges */}
      {OUTLINE_PATHS.map((p, i) => (
        <path key={`outline-${i}`} d={p.d} fill="none" stroke="#D1D5DB" strokeWidth="1.2" strokeLinejoin="round" />
      ))}

      {/* Eyes / face detail */}
      <circle cx="47" cy="26" r="1.5" fill="#9CA3AF" />
      <circle cx="53" cy="26" r="1.5" fill="#9CA3AF" />
      <path d="M47 31 Q50 33 53 31" fill="none" stroke="#9CA3AF" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

function getHighlights(variant) {
  switch (variant) {
    case 'push':
      return ['chest', 'shoulders', 'arms'];
    case 'pull':
      return ['back', 'arms'];
    case 'legs':
      return ['legs', 'core'];
    case 'upper':
      return ['chest', 'shoulders', 'arms', 'back'];
    case 'lower':
      return ['legs', 'core'];
    case 'full':
      return ['chest', 'shoulders', 'arms', 'back', 'core', 'legs'];
    default:
      return [];
  }
}