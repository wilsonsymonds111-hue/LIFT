import { createPortal } from 'react-dom';
import { EXAMPLE_SPLITS_DATA } from '../lib/splitData';

export default function SplitCardMenu({
  menuOpen,
  mySplitGroups,
  swapping,
  menuRef,
  onChangeCurrent,
  onDelete,
  onClose,
}) {
  if (!menuOpen) return null;

  const isExample = EXAMPLE_SPLITS_DATA[menuOpen] != null;
  const menuGroup = isExample ? null : mySplitGroups.find(g => g.groupId === menuOpen);

  const btnEl = menuRef.current[menuOpen];
  const btnRect = btnEl?.getBoundingClientRect();
  const top = btnRect ? btnRect.bottom + 4 : 0;
  const right = btnRect ? window.innerWidth - btnRect.right : 0;

  return createPortal(
    <div
      onClick={e => e.stopPropagation()}
      className="fixed bg-card rounded-xl shadow-2xl border border-border py-1 min-w-[200px]"
      style={{ top: `${top}px`, right: `${right}px`, zIndex: 100 }}
    >
      <button
        onClick={() => {
          if (isExample) {
            onChangeCurrent(menuOpen);
          } else if (menuGroup) {
            onChangeCurrent(menuGroup);
          }
        }}
        disabled={swapping}
        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition rounded-xl disabled:opacity-50"
      >
        {swapping ? 'Applying…' : 'Make this my current split'}
      </button>
      {menuGroup && (
        <button
          onClick={() => onDelete(menuGroup)}
          className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition rounded-xl"
        >
          Delete split
        </button>
      )}
    </div>,
    document.body
  );
}