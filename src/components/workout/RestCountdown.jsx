import { useState, useEffect, useRef, memo } from 'react';
import { notifyRestComplete } from '../../lib/workoutSounds';

// Isolated rest countdown — prevents SetRow re-render every second
const RestCountdown = memo(function RestCountdown({ duration }) {
  const [seconds, setSeconds] = useState(duration);
  const [visible, setVisible] = useState(true);
  const restEndRef = useRef(Date.now() + duration * 1000);
  const notifiedRef = useRef(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    const tick = (silent = false) => {
      const remaining = Math.round((restEndRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        setSeconds(0);
        setVisible(false);
        if (!notifiedRef.current) {
          notifiedRef.current = true;
          notifyRestComplete(silent);
        }
      } else {
        setSeconds(remaining);
      }
    };

    intervalRef.current = setInterval(() => tick(false), 1000);

    const onVisible = () => { if (!document.hidden) tick(true); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  if (!visible || seconds <= 0) return null;

  return (
    <div
      className="w-full bg-blue-500 text-white font-bold text-center py-1.5 rounded-xl mt-2 text-base tracking-wider cursor-pointer select-none"
      onClick={() => { clearInterval(intervalRef.current); setVisible(false); }}
    >
      {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
    </div>
  );
});

export default RestCountdown;