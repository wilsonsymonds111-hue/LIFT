import { Delete } from 'lucide-react';

export default function SetInputKeypad({ field, value, allowDecimal, onChange, onClose }) {
  const local = value != null ? String(value) : '';

  const handleKey = (key) => {
    let next;
    if (key === 'del') {
      next = local.slice(0, -1);
    } else if (key === '.') {
      if (!allowDecimal || local.includes('.')) return;
      next = local === '' ? '0.' : local + '.';
    } else {
      if (local.length >= 6) return;
      if (local === '0' && key !== '.') next = key;
      else next = local + key;
    }
    onChange(next);
  };

  const keys = allowDecimal
    ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del']
    : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="mt-1.5">
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'rgba(248, 248, 248, 0.98)', backdropFilter: 'blur(20px)' }}
      >
        {/* Keypad grid — Apple numeric keyboard style */}
        <div className="grid grid-cols-3 gap-px bg-black/5">
          {keys.map((k, i) => (
            k === '' ? (
              <div key={i} className="h-11 bg-transparent" />
            ) : (
              <button
                key={i}
                onClick={() => handleKey(k)}
                className="h-11 flex items-center justify-center active:bg-blue-500 active:text-white transition-colors select-none"
                style={{ background: 'rgba(255,255,255,0.92)' }}
              >
                {k === 'del' ? (
                  <Delete className="w-5 h-5 text-black dark:text-foreground" style={{ color: '#000' }} />
                ) : (
                  <span className="text-xl font-medium text-black" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>{k}</span>
                )}
              </button>
            )
          ))}
        </div>
        {/* Done bar */}
        <button
          onClick={onClose}
          className="w-full h-9 flex items-center justify-center bg-white/90 text-sm font-medium text-blue-500 active:bg-blue-50 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}