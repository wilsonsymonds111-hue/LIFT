import { useState, useEffect, useRef, memo } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { playTick } from '../../lib/workoutSounds';
import RestCountdown from './RestCountdown';

const SetRow = memo(function SetRow({ setNum, previous, initialKg, initialReps, initialDone, onComplete, onDelete, restDuration = 120, showHeader = false }) {
  const [kg, setKg] = useState(initialKg ?? previous?.kg ?? '');
  const [reps, setReps] = useState(initialReps ?? previous?.reps ?? '');
  const [done, setDone] = useState(initialDone || false);
  const [animating, setAnimating] = useState(false);
  const startXRef = useRef(null);
  const swipingRef = useRef(false);
  const currentXRef = useRef(0);
  const rowRef = useRef(null);
  const bgRef = useRef(null);
  const trashRef = useRef(null);
  const userEditedKg = useRef(false);
  const userEditedReps = useRef(false);

  const DELETE_THRESHOLD = 80;

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

  // Direct DOM manipulation — avoids React re-render on every pointermove for 1:1 finger tracking
  const applyTransform = (x) => {
    currentXRef.current = x;
    if (rowRef.current) rowRef.current.style.transform = `translateX(${x}px)`;
    const progress = Math.min(1, Math.abs(x) / DELETE_THRESHOLD);
    if (bgRef.current) bgRef.current.style.opacity = String(progress * 0.95);
    if (trashRef.current) {
      trashRef.current.style.transform = `scale(${0.7 + progress * 0.5})`;
      trashRef.current.style.opacity = String(0.4 + progress * 0.6);
    }
  };

  const onPointerDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    startXRef.current = e.clientX;
    swipingRef.current = true;
    setAnimating(false);
  };

  const onPointerMove = (e) => {
    if (!swipingRef.current || startXRef.current === null) return;
    const dx = Math.min(0, e.clientX - startXRef.current);
    const clamped = dx < -DELETE_THRESHOLD
      ? -DELETE_THRESHOLD - (Math.min(-dx - DELETE_THRESHOLD, 30)) * 0.4
      : dx;
    const wasPast = currentXRef.current < -DELETE_THRESHOLD;
    applyTransform(clamped);
    if (clamped < -DELETE_THRESHOLD && !wasPast) {
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  const onPointerUp = () => {
    if (!swipingRef.current) return;
    swipingRef.current = false;
    if (currentXRef.current < -DELETE_THRESHOLD) {
      setAnimating(true);
      applyTransform(-300);
      if (navigator.vibrate) navigator.vibrate(20);
      setTimeout(() => onDelete?.(), 250);
    } else {
      setAnimating(true);
      applyTransform(0);
    }
    startXRef.current = null;
  };

  const handleFocus = (e) => {
    const el = e.target;
    const len = el.value.length;
    requestAnimationFrame(() => {
      el.setSelectionRange(len, len);
    });
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

  return (
    <div>
      {showHeader && (
        <div className="grid grid-cols-[40px_1fr_80px_80px_44px] gap-1.5 px-2 mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
          <span className="text-center">Set</span>
          <span className="text-center">Previous</span>
          <span className="text-center">kg</span>
          <span className="text-center">Reps</span>
          <span></span>
        </div>
      )}
      <div className="relative overflow-hidden rounded-lg">
        <div
          ref={bgRef}
          className="absolute inset-y-0 right-0 flex items-center justify-end px-4 rounded-lg"
          style={{ backgroundColor: '#ef4444', opacity: 0 }}
        >
          <span ref={trashRef} style={{ display: 'inline-flex', transform: 'scale(0.7)', opacity: 0.4 }}>
            <Trash2 className="w-5 h-5 text-white" />
          </span>
        </div>
        <div
          ref={rowRef}
          className={`grid grid-cols-[40px_1fr_80px_80px_44px] items-center gap-1.5 py-2 px-3 rounded-lg transition-colors ${done ? 'bg-green-200 dark:bg-green-900/50' : 'bg-white dark:bg-neutral-700'}`}
          style={{
            transform: 'translateX(0px)',
            transition: animating ? 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
            willChange: 'transform',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <span className="text-base font-semibold text-center text-gray-500 dark:text-gray-400">{setNum}</span>
          <span className="text-sm text-gray-400 dark:text-gray-500 text-center leading-tight">
            {previous ? (
              <>
                <span className="whitespace-nowrap">{previous.kg}kg</span>
                <br />
                <span className="whitespace-nowrap">× {previous.reps}</span>
              </>
            ) : '—'}
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={kg}
            onChange={handleKgChange}
            onFocus={handleFocus}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="—"
            className={`rounded-lg text-center text-base font-semibold py-2.5 w-full focus:outline-none ${done ? 'bg-green-400 text-white dark:bg-green-600' : 'bg-gray-100 dark:bg-neutral-600 dark:text-white'}`}
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
            className={`rounded-lg text-center text-base font-semibold py-2.5 w-full focus:outline-none ${done ? 'bg-green-400 text-white dark:bg-green-600' : 'bg-gray-100 dark:bg-neutral-600 dark:text-white'}`}
          />
          <button
            onClick={handleToggle}
            className={`w-11 h-11 flex items-center justify-center rounded-lg transition ${done ? 'bg-green-400 text-white dark:bg-green-600' : 'bg-gray-200 dark:bg-neutral-600 text-gray-400 dark:text-gray-300'}`}
          >
            <Check className="w-6 h-6" />
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