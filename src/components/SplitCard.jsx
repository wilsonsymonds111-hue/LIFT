const FULL_CARD_IMAGES = {
  'push-pull-legs': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/f33440014_image.png',
  'upper-lower': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/cf4988248_image.png',
  'full-body': 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/9a2a05990_image.png',
};

const BLUEPILL_STYLE = 'text-[11px] px-2.5 py-1 rounded-full bg-[#E3F2FD] dark:bg-blue-950/50 text-[#1565C0] dark:text-blue-400 font-medium';

export default function SplitCard({ splitKey, split, isExample, menuRef, menuOpen, setMenuOpen, onCardClick, cardRef }) {
  const fullCardImage = isExample ? FULL_CARD_IMAGES[splitKey] : null;

  // Full card image mode — the uploaded image is the entire card
  if (fullCardImage) {
    return (
      <div
        ref={cardRef}
        className="relative rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-150 cursor-pointer group overflow-hidden aspect-[4/3]"
        onClick={onCardClick}
      >
        <img src={fullCardImage} alt={split.name} className="w-full h-full object-contain" />
        {/* Invisible overlay for the kebab menu — positioned top-right */}
        <button
          ref={el => { if (menuRef) menuRef.current[splitKey] = el; }}
          onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === splitKey ? null : splitKey); }}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition select-none"
        >
          <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </button>
      </div>
    );
  }

  // Blue pill mode — custom user splits
  return (
    <div
      ref={cardRef}
      className="relative bg-card border border-[#E0E0E0] dark:border-gray-600 rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-150 cursor-pointer group overflow-hidden"
      onClick={onCardClick}
    >
      {/* Header */}
      <div className="text-center pt-3 pb-0.5 relative">
        <h4 className="font-extrabold text-foreground text-sm tracking-tight uppercase px-8">
          {split.name || splitKey}
        </h4>
        <button
          ref={el => { if (menuRef) menuRef.current[splitKey] = el; }}
          onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === splitKey ? null : splitKey); }}
          className="absolute top-2.5 right-3 w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted transition select-none group/btn"
        >
          <svg className="w-3.5 h-3.5 text-muted-foreground group-hover/btn:text-foreground transition-colors" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </button>
      </div>

      {/* Blue pills */}
      <div className="flex flex-wrap gap-1 px-3 pb-1.5 pt-0.5 justify-center">
        {split.templates?.map((t, i) => (
          <span key={i} className={BLUEPILL_STYLE}>
            {t.name}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center pb-3">
        <p className="text-[11px] text-muted-foreground">
          {split.templates?.length || 0} workout{(split.templates?.length || 0) !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}