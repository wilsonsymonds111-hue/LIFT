import { useState, useEffect, useRef } from 'react';

export default function RenameSplitModal({ initialName, onClose, onConfirm }) {
  const [value, setValue] = useState(initialName);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    onConfirm(value);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50" onClick={onClose}>
      <form onClick={e => e.stopPropagation()} onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 mx-5 max-w-sm w-full shadow-2xl border border-border">
        <h3 className="text-lg font-extrabold text-foreground">Rename Split</h3>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Split name"
          className="w-full mt-4 px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-muted text-foreground font-semibold text-sm hover:bg-muted/70 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!value.trim()}
            className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 disabled:opacity-40 transition"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}