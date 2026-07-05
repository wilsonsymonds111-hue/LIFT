import { useState, useEffect, useRef, memo } from 'react';
import { Check } from 'lucide-react';
import { notifyRestComplete, playTick } from '../../lib/workoutSounds';
import SetInputKeypad from './SetInputKeypad';

const SetRow = memo(function SetRow({ setNum, previous, initialKg, initialReps, onComplete, onDelete, restDuration = 120 }) {
  const [kg, setKg] = useState(initialKg ?? previous?.kg ?? '');
  const [reps, setReps] = useState(initialReps ?? previous?.reps ?? '');
  const [done, setDone] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [restSeconds, setRestSeconds] = useState(null);
  const startXRef = useRef(null);
  const hasEdited = useRef(false);
  const restRef = useRef(null);
  const restEndRef = useRef(null);
  const [activeKeypad, setActiveKeypad] = useState(null); // 'kg' | 'reps' | null

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

  return (
    <div>
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
            type="text" inputMode="none" value={kg}
            onChange={() => {}}
            onFocus={(e) => { e.target.blur(); setActiveKeypad('kg'); }}
            onPointerDown={(e) => { e.preventDefault(); setActiveKeypad('kg'); }}
            placeholder="—"
            readOnly
            className={`rounded-lg text-center text-sm font-semibold py-1.5 w-full focus:outline-none ${done ? 'bg-green-400 text-white' : 'bg-gray-100'}`}
          />
          <input
            type="text" inputMode="none" value={reps}
            onChange={() => {}}
            onFocus={(e) => { e.target.blur(); setActiveKeypad('reps'); }}
            onPointerDown={(e) => { e.preventDefault(); setActiveKeypad('reps'); }}
            placeholder="—"
            readOnly
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
      {activeKeypad && (
        <SetInputKeypad
          field={activeKeypad}
          value={activeKeypad === 'kg' ? kg : reps}
          allowDecimal={activeKeypad === 'kg'}
          onChange={(v) => {
            hasEdited.current = true;
            if (activeKeypad === 'kg') {
              setKg(v);
              if (done) onComplete?.({ kg: parseFloat(v) || 0, reps: parseInt(reps) || 0 });
            } else {
              setReps(v);
              if (done) onComplete?.({ kg: parseFloat(kg) || 0, reps: parseInt(v) || 0 });
            }
          }}
          onClose={() => setActiveKeypad(null)}
        />
      )}
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