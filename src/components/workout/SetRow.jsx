import { useState, useEffect, useRef, memo } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { playTick } from '../../lib/workoutSounds';
import RestCountdown from './RestCountdown';

const SetRow = memo(function SetRow({ setNum, previous, initialKg, initialReps, onComplete, onDelete, restDuration = 120, showHeader = false }) {
  const [kg, setKg] = useState(initialKg ?? previous?.kg ?? '');
  const [reps, setReps] = useState(initialReps ?? previous?.reps ?? '');
  const [done, setDone] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [pastThreshold, setPastThreshold] = useState(false);
  const startXRef = useRef(null);
  const userEditedKg = useRef(false);
  const userEditedReps = useRef(false);

  // Update suggestions when parent changes them (e.g., after completing set 1, set 2 updates)
  useEffect(() => {
    if (!done && !userEditedKg.current && initialKg != null && initialKg !== '') {
      setKg(initialKg);
    }
  }, [initialKg, done]);

  useEffect(() => {
    if (!done && !userEditedReps.current && initialReps != null && initialReps !== '') {
      setReps(initialReps);
    }
  }, [initialReps, done]);

  const DELETE_THRESHOLD = 80;

  const handleToggle = () => {
    const next = !done;
    setDone(next);
    if (next) {
      playTick();
      onComplete?.({ kg: kg !== '' ? parseFloat(kg) : 0, reps: reps !== '' ? parseInt(reps) : 0 });
    } else {
      onComplete?.(null);
    }
  };

  const onPointerDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    startXRef.current = e.clientX;
    setSwiping(true);
    setPastThreshold(false);
  };
  const onPointerMove = (e) => {
    if (!swiping || startXRef.current === null) return;
    const dx = Math.min(0, e.clientX - startXRef.current);
    // Rubber-band resistance beyond threshold
    const clamped = dx < -DELETE_THRESHOLD
      ? -DELETE_THRESHOLD - (Math.min(-dx - DELETE_THRESHOLD, 30)) * 0.4
      : dx;
    setSwipeX(clamped);
    const isPast = clamped < -DELETE_THRESHOLD;
    if (isPast !== pastThreshold) {
      setPastThreshold(isPast);
      if (isPast && navigator.vibrate) navigator.vibrate(10);
    }
  };
  const onPointerUp = () => {
    if (!swiping) return;
    if (swipeX < -DELETE_THRESHOLD) {
      // Animate slide-out then delete
      setSwiping(false);
      setSwipeX(-300);
      if (navigator.vibrate) navigator.vibrate(20);
      setTimeout(() => onDelete?.(), 250);
    } else {
      setSwipeX(0);
      setSwiping(false);
    }
    setPastThreshold(false);
    startXRef.current = null;
  };

  // Scroll the input into view above the native keyboard
  const handleFocus = (e) => {
    const el = e.target;
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const handleKgChange = (e) => {
    userEditedKg.current = true;
    let v = e.target.value;
    v = v.replace(/[^0-9.]/g, '');
    const parts = v.split('.');
    if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
    setKg(v);
    if (done) onComplete?.({ kg: parseFloat(v) || 0, reps: parseInt(reps) || 0 });
  };

  const handleRepsChange = (e) => {
    userEditedReps.current = true;
    let v = e.target.value.replace(/[^0-9]/g, '');
    setReps(v);
    if (done) onComplete?.({ kg: parseFloat(kg) || 0, reps: parseInt(v) || 0 });
  };

  const deleteProgress = Math.min(1, Math.abs(swipeX) / DELETE_THRESHOLD);

  return (
    <div>
      {showHeader && (
        <div className="grid grid-cols-[36px_1fr_72px_72px_40px] gap-1 px-2 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <span className="text-center">Set</span>
          <span className="text-center">Previous</span>
          <span className="text-center">kg</span>
          <span className="text-center">Reps</span>
          <span></span>
        </div>
      )}
      <div className="relative overflow-hidden rounded-lg">
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-end px-4 rounded-lg"
          style={{
            backgroundColor: '#ef4444',
            opacity: deleteProgress * 0.95,
          }}
        >
          <Trash2
            className="w-5 h-5 text-white"
            style={{
              transform: `scale(${0.7 + deleteProgress * 0.5})`,
              transition: swiping ? 'none' : 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              opacity: 0.4 + deleteProgress * 0.6,
            }}
          />
        </div>
        <div
          className={`grid grid-cols-[36px_1fr_72px_72px_40px] items-center gap-1 py-1.5 px-3 rounded-lg transition-colors ${done ? 'bg-green-200' : 'bg-white'}`}
          style={{
            transform: `translateX(${swipeX}px)`,
            transition: swiping ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            willChange: 'transform',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <span className="text-sm font-semibold text-center text-gray-500">{setNum}</span>
          <span className="text-sm text-gray-400 text-center">
            {previous ? `${previous.kg} kg × ${previous.reps}` : '—'}
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={kg}
            onChange={handleKgChange}
            onFocus={handleFocus}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="—"
            className={`rounded-lg text-center text-sm font-semibold py-1.5 w-full focus:outline-none ${done ? 'bg-green-400 text-white' : 'bg-gray-100'}`}
          />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={reps}
            onChange={handleRepsChange}
            onFocus={handleFocus}
            onPointerDown={(e) => e.stopPropagation()}
            onBlur={(e) => { if (reps !== '' && !done && !e.relatedTarget) { handleToggle(); } }}
            placeholder="—"
            className={`rounded-lg text-center text-sm font-semibold py-1.5 w-full focus:outline-none ${done ? 'bg-green-400 text-white' : 'bg-gray-100'}`}
          />
          <button
            onClick={handleToggle}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition ${done ? 'bg-green-400 text-white' : 'bg-gray-200 text-gray-400'}`}
          >
            <Check className="w-5 h-5" />
          </button>
        </div>
      </div>
      {done && restDuration > 0 && (
        <RestCountdown duration={restDuration} />
      )}
    </div>
  );
});

export default SetRow;