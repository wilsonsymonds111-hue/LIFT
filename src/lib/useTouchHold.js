/**
 * Returns spreadable props for an element that fires `onHold` after
 * the user presses and holds for ~300ms. Works with touch and mouse.
 * Not a hook — safe to call inside loops/map callbacks.
 */
export function TouchHold(onHold, duration = 300) {
  let timer = null;
  const start = () => {
    timer = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(8);
      onHold();
      timer = null;
    }, duration);
  };
  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: cancel,
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
  };
}