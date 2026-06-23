import { useState, useEffect, useRef, useCallback } from 'react';

const THRESHOLD = 70;

export default function usePullToRefresh(onRefresh) {
  const [pulling, setPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(null);
  const pullYRef = useRef(0);
  const containerRef = useRef(null);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const stableOnRefresh = useCallback(async () => {
    await onRefreshRef.current();
  }, []);

  useEffect(() => {
    const onTouchStart = (e) => {
      // Skip touches on fixed-position overlays (modals, bottom sheets) —
      // these are portaled outside the scroll container and shouldn't trigger pull-to-refresh
      if (e.target?.closest?.('.fixed')) return;
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
        const y = Math.min(dy * 0.45, THRESHOLD + 20);
        pullYRef.current = y;
        setPullY(y);
      }
    };

    const onTouchEnd = async () => {
      if (pullYRef.current >= THRESHOLD) {
        setRefreshing(true);
        setPullY(THRESHOLD * 0.6);
        await stableOnRefresh();
        setRefreshing(false);
      }
      setPulling(false);
      setPullY(0);
      pullYRef.current = 0;
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
  }, [stableOnRefresh]);

  return { containerRef, pulling, pullY, refreshing };
}