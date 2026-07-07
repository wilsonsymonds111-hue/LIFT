import { memo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Check, Pencil, Trash2 } from 'lucide-react';
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

const TemplateCard = memo(function TemplateCard({ template, isTodayCard, isCompleted, accent, dotColor, isMenuOpen, onToggleMenu, menuRef, onRemove }) {
  const navigate = useNavigate();
  const btnRef = useRef(null);

  const setBtnRef = (el) => {
    btnRef.current = el;
    if (menuRef && el) menuRef.current[template.id] = el;
  };

  const exercises = template.exerciseList || [];

  return (
    <div className="relative">
      {dotColor && (
        <div className="absolute left-[-14px] top-1/2 -translate-y-1/2 z-10">
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: dotColor }} />
        </div>
      )}
      <div
        className={`relative w-full rounded-2xl p-4 transition-all duration-150 hover:scale-[1.01] border border-white/80 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.06),inset_0_0_0_1px_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.1)] ${
          isCompleted
            ? 'bg-emerald-50 dark:bg-emerald-950/40'
            : 'bg-[rgb(249,249,249)] dark:bg-card'
        }`}
      >
      {/* Green checkmark — completed today */}
      {isCompleted && (
        <div className="absolute top-2 left-2 w-6 h-6 flex items-center justify-center rounded-full bg-emerald-500 text-white z-10 shadow-sm">
          <Check className="w-4 h-4" strokeWidth={3} />
        </div>
      )}

      {/* Three-dot menu button — top right */}
      <button
        ref={setBtnRef}
        onClick={(e) => { e.stopPropagation(); onToggleMenu(template.id); }}
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted/60 transition z-10"
      >
        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
      </button>

      <div onClick={() => navigate(`/active-workout/${template.id}`)} className={`cursor-pointer ${isCompleted ? 'pl-6' : ''}`}>
        <h4 className="text-base font-bold text-foreground pr-10">{template.name}</h4>
        <p className="text-xs text-muted-foreground/70 mt-1">
          {template.lastPerformed ? relativeTime(template.lastPerformed) : 'Not yet performed'}
        </p>

        {/* Exercise pills */}
        {exercises.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {exercises.slice(0, 5).map((ex, i) => (
              <span
                key={i}
                className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground"
              >
                {ex.name}
              </span>
            ))}
            {exercises.length > 5 && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground">
                +{exercises.length - 5}
              </span>
            )}
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
          <button
            onClick={() => onRemove(template)}
            className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-muted transition rounded-xl flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Remove from current split
          </button>
        </div>,
        document.body
      )}
    </div>
    </div>
  );
});

export default TemplateCard;