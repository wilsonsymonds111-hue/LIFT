import { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { notifyRestComplete } from '../../lib/workoutSounds';

const SWIPE_THRESHOLD = 60;

// Isolated rest countdown — prevents SetRow re-render every second
const RestCountdown = memo(function RestCountdown({ duration }) {
  const [seconds, setSeconds] = useState(duration);
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState('counting'); // 'counting' | 'done'
  const [animating, setAnimating] = useState(false);
  const restEndRef = useRef(Date.now() + duration * 1000);
  const notifiedRef = useRef(false);
  const intervalRef = useRef(null);
  const doneTimeoutRef = useRef(null);
  const startXRef = useRef(null);
  const swipingRef = useRef(false);
  const currentXRef = useRef(0);
  const barRef = useRef(null);

  const dismiss = () => {
    clearInterval(intervalRef.current);
    clearTimeout(doneTimeoutRef.current);
    setVisible(false);
  };

  useEffect(() => {
    const tick = (silent = false) => {
      const remaining = Math.round((restEndRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        setSeconds(0);
        setPhase('done');
        if (!notifiedRef.current) {
          notifiedRef.current = true;
          notifyRestComplete(silent);
        }
        doneTimeoutRef.current = setTimeout(() => dismiss(), 2500);
      } else {
        setSeconds(remaining);
      }
    };

    intervalRef.current = setInterval(() => tick(false), 1000);

    const onVisible = () => { if (!document.hidden) tick(true); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(doneTimeoutRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const applyTransform = (x) => {
    currentXRef.current = x;
    if (barRef.current) barRef.current.style.transform = `translateX(${x}px)`;
    if (barRef.current) barRef.current.style.opacity = String(Math.max(0.3, 1 + x / 200));
  };

  const onPointerDown = (e) => {
    startXRef.current = e.clientX;
    swipingRef.current = true;
    setAnimating(false);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!swipingRef.current || startXRef.current === null) return;
    const dx = Math.min(0, e.clientX - startXRef.current);
    applyTransform(dx);
  };

  const onPointerUp = () => {
    if (!swipingRef.current) return;
    swipingRef.current = false;
    if (currentXRef.current < -SWIPE_THRESHOLD) {
      setAnimating(true);
      applyTransform(-300);
      if (navigator.vibrate) navigator.vibrate(15);
      setTimeout(() => dismiss(), 250);
    } else {
      setAnimating(true);
      applyTransform(0);
    }
    startXRef.current = null;
  };

  if (!visible) return null;

  const progress = duration > 0 ? seconds / duration : 0;

  return (
    <div className="w-full mt-2 overflow-hidden rounded-xl">
      <div
        ref={barRef}
        className="relative w-full bg-blue-500/25 text-white font-bold text-center py-1.5 rounded-xl text-base tracking-wider cursor-pointer select-none touch-none overflow-hidden"
        style={{
          transition: animating ? 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease' : 'none',
          willChange: 'transform, opacity',
        }}
        onClick={dismiss}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Depleting blue fill — shrinks left as time runs out */}
        <div
          className="absolute inset-y-0 left-0 right-0 bg-blue-500"
          style={{
            transform: `scaleX(${progress})`,
            transformOrigin: 'left',
            transition: 'transform 1s linear',
          }}
        />
        {/* Text overlay */}
        <span className="relative z-10" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
          {phase === 'done' ? (
            <motion.span
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 12 }}
              className="inline-block uppercase"
            >
              Back to work!
            </motion.span>
          ) : (
            `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
          )}
        </span>
      </div>
    </div>
  );
});

export default RestCountdown;