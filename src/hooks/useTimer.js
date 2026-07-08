import { useState, useEffect, useRef } from 'react';

export function useTimer(startTimestamp = null) {
  const [seconds, setSeconds] = useState(() => {
    if (startTimestamp) {
      return Math.max(0, Math.floor((Date.now() - startTimestamp) / 1000));
    }
    return 0;
  });
  const ref = useRef(seconds);
  ref.current = seconds;
  useEffect(() => {
    const id = setInterval(() => {
      if (startTimestamp) {
        setSeconds(Math.max(0, Math.floor((Date.now() - startTimestamp) / 1000)));
      } else {
        setSeconds(s => s + 1);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [startTimestamp]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return { display: `${mm}:${ss}` };
}