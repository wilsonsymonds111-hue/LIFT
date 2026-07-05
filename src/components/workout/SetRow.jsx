import { useState, useEffect, useRef, memo } from 'react';
import { Check } from 'lucide-react';
import { notifyRestComplete, playTick } from '../../lib/workoutSounds';

const SetRow = memo(function SetRow({ setNum, previous, initialKg, initialReps, onComplete, onDelete, restDuration = 120, showHeader = false }) {
  const [kg, setKg] = useState(initialKg ?? previous?.kg ?? '');
  const [reps, setReps] = useState(initialReps ?? previous?.reps ?? '');
  const [done, setDone] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [restSeconds, setRestSeconds] = useState(null);
  const startXRef = useRef(null);
  const restRef = useRef(null);
  const restEndRef = useRef(null);
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

  useEffect(() => {
    if (done) {
      const end = Date.now() + restDuration * 1000;
      restEndRef.current = end;
      setRestSeconds(restDuration);
      const tick = () => {
        const remaining = Math.round((end - Date.now()) / 1000);
        if (remaining <= 0) {
          clearInterval(restRef.current);
          setRestSeconds(0);
          notifyRestComplete();
        } else {
          setRestSeconds(remaining);
        }
      };
      restRef.current = setInterval(tick, 250);
      const onVisible = () => { if (!document.hidden) tick(); };
      document.addEventListener('visibilitychange', onVisible);
      return () => {
        clearInterval(restRef.current);
        document.removeEventListener('visibilitychange', onVisible);
      };
    } else {
      clearInterval(restRef.current);
      setRestSeconds(null);
      restEndRef.current = null;
    }
    return () => clearInterval(restRef.current);
  }, [done]);
  const DELETE_THRESHOLD = 80;

  const handleToggle = () => {
    const next = !done;
    setDone(next);
    if (next) {
      if (navigator.vibrate) navigator.vibrate(15);
      playTick();
      onComplete?.({ kg: kg !== '' ? parseFloat(kg) : 0, reps: reps !== '' ? parseInt(reps) : 0 });
    } else {
      onComplete?.(null);
    }
  };

  const onPointerDown = (e) => {
    startXRef.current = e.clientX;
    setSwiping(true);
  };
  const onPointerMove = (e) => {
    if (!swiping || startXRef.current === null) return;
    const dx = Math.min(0, e.clientX - startXRef.current);
    setSwipeX(Math.max(dx, -DELETE_THRESHOLD - 20));
  };
  const onPointerUp = () => {
    if (swipeX < -DELETE_THRESHOLD) {
      onDelete?.();
    } else {
      setSwipeX(0);
    }
    setSwiping(false);
    startXRef.current = null;
  };

  // Scroll the input into view above the native keyboard
  const handleFocus = (e) => {
    const el = e.target;
    // Wait for the keyboard to appear, then scroll the input into view
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const handleKgChange = (e) => {
    userEditedKg.current = true;
    let v = e.target.value;
    // Allow only numbers and a single decimal point
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
        <div className="grid grid-cols-[36px_1fr_72px_72px_40px] gap-1 px-2 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          <span className="text-center">Set</span>
          <span className="text-center">Previous</span>
          <span className="text-center">kg</span>
          <span className="text-center">Reps</span>
          <span></span>
        </div>
      )}
      <div className="relative overflow-hidden rounded-lg">
        <div className="absolute inset-y-0 right-0 flex items-center justify-end px-4 bg-red-500 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </div>
        <div
          className={`grid grid-cols-[36px_1fr_72px_72px_40px] items-center gap-1 py-1.5 px-2 rounded-lg transition-colors ${done ? 'bg-green-200' : 'bg-white'}`}
          style={{ transform: `translateX(${swipeX}px)`, transition: swiping ? 'none' : 'transform 0.2s ease' }}
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
      {done && restSeconds !== null && restSeconds > 0 && (
        <div
          className="w-full bg-blue-500 text-white font-bold text-center py-1.5 rounded-xl mt-2 text-base tracking-wider cursor-pointer select-none"
          onClick={() => { clearInterval(restRef.current); setRestSeconds(0); }}
        >
          {String(Math.floor(restSeconds/60)).padStart(2,'0')}:{String(restSeconds%60).padStart(2,'0')}
        </div>
      )}
    </div>
  );
});

export default SetRow;