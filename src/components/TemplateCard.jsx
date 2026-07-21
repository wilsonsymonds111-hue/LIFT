import { memo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Pencil, Dumbbell, GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TouchHold } from '../lib/useTouchHold';

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

const TemplateCard = memo(function TemplateCard({ template, isTodayCard, accent, dotColor, isMenuOpen, onToggleMenu, menuRef, onRemove, isReorderMode, dragHandleProps, onLongPress }) {
  const navigate = useNavigate();
  const btnRef = useRef(null);

  const setBtnRef = (el) => {
    btnRef.current = el;
    if (menuRef && el) menuRef.current[template.id] = el;
  };

  const exercises = template.exerciseList || [];
  const holdProps = TouchHold(onLongPress, 400);

  return (
    <div
      {...(isReorderMode ? dragHandleProps : holdProps)}
    >
      <div
        className={`relative w-full rounded-2xl p-5 transition-all duration-150 border bg-white/40 dark:bg-card/40 backdrop-blur-xl backdrop-saturate-150 overflow-hidden ${
          isReorderMode
            ? 'border-blue-400 dark:border-blue-500 shadow-[0_12px_40px_rgba(59,130,246,0.18)] scale-[1.02] cursor-grab active:cursor-grabbing'
            : `active:scale-[0.99] ${
                isTodayCard
                  ? 'border-border shadow-[0_10px_36px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(255,255,255,0.7)] dark:shadow-[0_10px_36px_rgba(0,0,0,0.25),inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                  : 'border-border shadow-[0_6px_24px_rgba(0,0,0,0.07),0_1px_4px_rgba(0,0,0,0.03),inset_0_0_0_1px_rgba(255,255,255,0.6)] dark:shadow-[0_6px_24px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.06)]'
              }`
        }`}
      >
      {/* Three-dot menu button — top right (hidden in reorder mode) */}
      {!isReorderMode && (
      <button
        ref={setBtnRef}
        onClick={(e) => { e.stopPropagation(); onToggleMenu(template.id); }}
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted/60 transition z-10"
      >
        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
      </button>
      )}

      {/* Grip indicator — shown in reorder mode */}
      {isReorderMode && (
        <div className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center z-10">
          <GripVertical className="w-4 h-4 text-blue-500" />
        </div>
      )}

      <div onClick={isReorderMode ? undefined : () => navigate(`/active-workout/${template.id}`)} className={`${isReorderMode ? '' : 'cursor-pointer'} ${isTodayCard && !isReorderMode ? 'pl-1.5' : ''}`}>
        {/* Title row */}
        <div className="flex items-center gap-2 pr-10">
          <h4 className="text-lg font-extrabold text-foreground tracking-tight">{template.name}</h4>
          {isTodayCard && !isReorderMode && (
            <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-emerald-500 text-white">
              Today
            </span>
          )}
        </div>

        {/* Meta row — exercise count */}
        {exercises.length > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Dumbbell className="w-3 h-3" strokeWidth={2.5} />
              {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
            </span>
          </div>
        )}

        {/* Exercise pills */}
        {exercises.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {exercises.map((ex, i) => (
              <span
                key={i}
                className="frosted-pill text-[13px] font-semibold px-3 py-1 text-foreground/80 dark:text-foreground/70"
              >
                {ex.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {!isReorderMode && isMenuOpen && createPortal(
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