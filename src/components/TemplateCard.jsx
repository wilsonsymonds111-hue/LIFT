import { memo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const relativeTime = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  if (diffMs < 60000) return 'Just now';
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
};

const TemplateCard = memo(function TemplateCard({ template, isTodayCard, isCompleted, accent, isMenuOpen, onToggleMenu, menuRef, onRemove }) {
  const navigate = useNavigate();
  const btnRef = useRef(null);

  const setBtnRef = (el) => {
    btnRef.current = el;
    if (menuRef && el) menuRef.current[template.id] = el;
  };

  return (
    <div
      style={{ backgroundColor: isCompleted ? 'rgba(209, 250, 229, 0.7)' : 'rgba(249, 249, 249, 0.85)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)' }}
      className={`relative rounded-2xl p-4 transition-all duration-150 hover:scale-[1.01] border border-white/80 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.06),inset_0_0_0_1px_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.1)] ${
        isTodayCard ? 'ring-2 ring-emerald-400/60' : ''
      }`}
    >
      {/* Green checkmark — completed today */}
      {isCompleted && (
        <div className="absolute top-2 left-2 w-6 h-6 flex items-center justify-center rounded-full bg-emerald-500 text-white z-10 shadow-sm">
          <Check className="w-4 h-4" strokeWidth={3} />
        </div>
      )}

      <button
        ref={setBtnRef}
        onClick={e => { e.stopPropagation(); onToggleMenu(template.id); }}
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition z-10"
      >
        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
      </button>

      <div onClick={() => navigate(`/template/${template.id}`)} className={`cursor-pointer ${isCompleted ? 'pl-6' : ''}`}>
        <h4 className="text-base font-bold text-foreground pr-8">{template.name}</h4>
        <p className="text-sm text-muted-foreground mt-1.5 line-clamp-1">
          {(template.exerciseList?.length > 0
            ? template.exerciseList.map(e => e.name).join(', ')
            : (template.exercises || '').split(',').map(s => s.trim()).filter(Boolean).join(', ')
          )}
        </p>
        <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1">
          ⏱ {template.lastPerformed ? relativeTime(template.lastPerformed) : 'Not yet performed'}
        </p>
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
            onClick={() => onRemove(template)}
            className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-muted transition rounded-xl"
          >
            Remove from current split
          </button>
        </div>,
        document.body
      )}
    </div>
  );
});

export default TemplateCard;