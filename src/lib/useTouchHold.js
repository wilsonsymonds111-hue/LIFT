import { useRef, useCallback } from 'react';

/**
 * Returns spreadable props for an element that fires `onHold` after
 * the user presses and holds for ~500ms. Works with touch and mouse.
 */
export function TouchHold(onHold, duration = 300) {
  const timerRef = useRef(null);

  const start = useCallback(() => {
    timerRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(8);
      onHold();
      timerRef.current = null;
    }, duration);
  }, [onHold, duration]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: cancel,
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
  };
}