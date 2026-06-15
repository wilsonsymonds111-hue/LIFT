import { createPortal } from 'react-dom';

export default function SplitCardMenu({ menuOpen, onClose, menuRef, onMakeCurrent, onDelete, swapping, isExample }) {
  const btnEl = menuRef.current?.[menuOpen];
  const rect = btnEl?.getBoundingClientRect();

  return createPortal(
    <div
      className="fixed bg-card rounded-xl shadow-2xl border border-border py-1 min-w-[200px]"
      style={{
        top: `${rect ? rect.bottom + 4 : 0}px`,
        right: `${rect ? window.innerWidth - rect.right : 0}px`,
        zIndex: 100,
      }}
    >
      <button
        onClick={() => {
          onClose();
          onMakeCurrent();
        }}
        disabled={swapping}
        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition rounded-xl disabled:opacity-50"
      >
        {swapping ? 'Applying…' : 'Make this my current split'}
      </button>
      {!isExample && (
        <button
          onClick={() => {
            onClose();
            onDelete();
          }}
          className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition rounded-xl"
        >
          Delete split
        </button>
      )}
    </div>,
    document.body
  );
}