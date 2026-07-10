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

    // Restart the interval — iOS kills setInterval when the PWA is backgrounded
    const startInterval = () => {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => tick(false), 1000);
    };

    startInterval();

    // iOS PWAs don't reliably fire visibilitychange when switching apps.
    // pageshow + focus catch the resume event where visibilitychange doesn't.
    const onResume = () => {
      if (!document.hidden) {
        tick(true);
        startInterval();
      }
    };

    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('pageshow', onResume);
    window.addEventListener('focus', onResume);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('pageshow', onResume);
      window.removeEventListener('focus', onResume);
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