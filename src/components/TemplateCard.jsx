import { memo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Pencil, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const relativeTime = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();

  const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((nowMidnight - dateMidnight) / 86400000);

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return DAY_NAMES[date.getDay()];
  if (diffDays < 14) return 'Last week';
  return `${Math.floor(diffDays / 7)}w ago`;
};

const TemplateCard = memo(function TemplateCard({ template, isTodayCard, accent, dotColor, isMenuOpen, onToggleMenu, menuRef, onRemove }) {
  const navigate = useNavigate();
  const btnRef = useRef(null);

  const setBtnRef = (el) => {
    btnRef.current = el;
    if (menuRef && el) menuRef.current[template.id] = el;
  };

  const exercises = template.exerciseList || [];

  return (
    <div className="relative">
      <div
        className={`relative w-full rounded-2xl p-4 transition-all duration-150 active:scale-[0.99] border bg-white dark:bg-card overflow-hidden ${
          isTodayCard
            ? 'border-blue-400/60 dark:border-blue-500/50 shadow-[0_10px_36px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(255,255,255,0.7)] dark:shadow-[0_10px_36px_rgba(0,0,0,0.25),inset_0_0_0_1px_rgba(255,255,255,0.08)]'
            : 'border-border/60 shadow-[0_6px_24px_rgba(0,0,0,0.07),0_1px_4px_rgba(0,0,0,0.03),inset_0_0_0_1px_rgba(255,255,255,0.6)] dark:shadow-[0_6px_24px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.06)]'
        }`}
      >
      {/* Three-dot menu button — top right */}
      <button
        ref={setBtnRef}
        onClick={(e) => { e.stopPropagation(); onToggleMenu(template.id); }}
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted/60 transition z-10"
      >
        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
      </button>

      <div onClick={() => navigate(`/active-workout/${template.id}`)} className={`cursor-pointer ${isTodayCard ? 'pl-1.5' : ''}`}>
        {/* Title row */}
        <div className="flex items-center gap-2 pr-10">
          <h4 className="text-base font-extrabold text-foreground tracking-tight">{template.name}</h4>
          {isTodayCard && (
            <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-blue-500 text-white">
              Today
            </span>
          )}
        </div>

        {/* Meta row — last performed + exercise count */}
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">
            {template.lastPerformed ? relativeTime(template.lastPerformed) : 'Not yet performed'}
          </p>
          {exercises.length > 0 && (
            <>
              <span className="text-muted-foreground/40 text-xs">·</span>
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <Dumbbell className="w-3 h-3" strokeWidth={2.5} />
                {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
              </span>
            </>
          )}
        </div>

        {/* Exercise pills */}
        {exercises.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {exercises.map((ex, i) => (
              <span
                key={i}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-muted/70 dark:bg-muted/40 text-foreground/70 dark:text-foreground/60"
              >
                {ex.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {isMenuOpen && createPortal(
        <div
          onClick={e => e.stopPropagation()}
          className="fixed bg-card rounded-xl shadow-2xl border border-border py-1 min-w-[220px]"
          style={{
            top: `${(btnRef.current?.getBoundingClientRect()?.bottom ?? 0) + 4}px`,
            right: `${window.innerWidth - (btnRef.current?.getBoundingClientRect()?.right ?? 0)}px`,
            zIndex: 100,
          }}
        >
          <button
            onClick={() => { onToggleMenu(null); navigate(`/template/${template.id}`); }}
            className="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition rounded-xl flex items-center gap-2"
          >
            <Pencil className="w-4 h-4 text-blue-500" />
            Edit workout
          </button>
        </div>,
        document.body
      )}
    </div>
    </div>
  );
});

export default TemplateCard;