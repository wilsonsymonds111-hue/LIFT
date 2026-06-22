import { useState, useEffect, useRef } from 'react';

export function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const ref = useRef(seconds);
  ref.current = seconds;
  useEffect(() => {
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return { display: `${mm}:${ss}` };
}