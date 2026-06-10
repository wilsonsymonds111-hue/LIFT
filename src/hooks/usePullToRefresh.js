import { useState, useEffect, useRef } from 'react';

const THRESHOLD = 70;

export default function usePullToRefresh(onRefresh) {
  const [pulling, setPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current || window;

    const onTouchStart = (e) => {
      const scrollTop = containerRef.current
        ? containerRef.current.scrollTop
        : document.documentElement.scrollTop;
      if (scrollTop === 0) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e) => {
      if (startYRef.current === null) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy > 0) {
        setPulling(true);
        setPullY(Math.min(dy * 0.45, THRESHOLD + 20));
      }
    };

    const onTouchEnd = async () => {
      if (pullY >= THRESHOLD) {
        setRefreshing(true);
        setPullY(THRESHOLD * 0.6);
        await onRefresh();
        setRefreshing(false);
      }
      setPulling(false);
      setPullY(0);
      startYRef.current = null;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [pullY, onRefresh]);

  return { containerRef, pulling, pullY, refreshing };
}