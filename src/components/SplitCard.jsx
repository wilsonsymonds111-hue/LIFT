import AnatomyFigure from './AnatomyFigure';

// Maps split keys to anatomy figure variants
const ANATOMY_MAP = {
  'push-pull-legs': [
    { variant: 'push', label: 'Push' },
    { variant: 'pull', label: 'Pull' },
    { variant: 'legs', label: 'Legs' },
  ],
  'upper-lower': [
    { variant: 'upper', label: 'Upper' },
    { variant: 'lower', label: 'Lower' },
  ],
  'full-body': [
    { variant: 'full', label: 'Full Body' },
  ],
  'ul-ppl': [
    { variant: 'upper', label: 'Upper' },
    { variant: 'lower', label: 'Lower' },
    { variant: 'push', label: 'Push' },
    { variant: 'pull', label: 'Pull' },
    { variant: 'legs', label: 'Legs' },
  ],
};

export default function SplitCard({ splitKey, split, isExample, menuRef, menuOpen, setMenuOpen, onCardClick, cardRef }) {
  const anatomy = isExample ? ANATOMY_MAP[splitKey] : null;
  const figureCount = anatomy?.length || 0;
  const figureSize = figureCount <= 2 ? 'md' : figureCount === 3 ? 'sm' : 'sm';

  return (
    <div
      ref={cardRef}
      className="relative bg-card border border-[#E0E0E0] dark:border-gray-600 rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-150 cursor-pointer group overflow-hidden"
      onClick={onCardClick}
    >
      {/* Header */}
      <div className="text-center pt-5 pb-1 relative">
        <h4 className="font-extrabold text-foreground text-base tracking-tight uppercase px-8">
          {split.name || splitKey}
        </h4>
        <button
          ref={el => { if (menuRef) menuRef.current[splitKey] = el; }}
          onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === splitKey ? null : splitKey); }}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition select-none group/btn"
        >
          <svg className="w-4 h-4 text-muted-foreground group-hover/btn:text-foreground transition-colors" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </button>
      </div>

      {/* Anatomy figures or blue pills */}
      {anatomy ? (
        <div className="flex justify-center items-start gap-1 pb-3 pt-1">
          {anatomy.map((fig, i) => (
            <div key={i} className="flex flex-col items-center">
              <AnatomyFigure variant={fig.variant} size={figureSize} />
              <span className="text-[11px] font-bold text-foreground mt-1 tracking-wide">
                {fig.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2 pt-1 justify-center">
          {split.templates?.map((t, i) => (
            <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-[#E3F2FD] dark:bg-blue-950/50 text-[#1565C0] dark:text-blue-400 font-medium">
              {t.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-center pb-4">
        <p className="text-xs text-muted-foreground">
          {split.workouts?.length || split.templates?.length || 0} workout{((split.workouts?.length || split.templates?.length || 0)) !== 1 ? 's' : ''}{' '}
          {split.label && `— ${split.label}`}
        </p>
      </div>
    </div>
  );
}