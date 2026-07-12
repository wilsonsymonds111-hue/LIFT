import { useState, useRef, useEffect } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import ExerciseSection from './ExerciseSection';

const EDGE_ZONE = 100;
const MAX_SPEED = 14;

export default function ReorderableExercise({ exercise, onDragActiveChange, dragActive, ...props }) {
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);
  const scrollContainerRef = useRef(null);
  const scrollRectRef = useRef(null);
  const rafRef = useRef(null);
  const speedRef = useRef(0);
  const compensationRef = useRef(0);
  const innerRef = useRef(null);
  const settleRafRef = useRef(null);

  // Direct DOM update — no motion value batching, applied synchronously
  // in the same rAF callback as the scrollTop change.
  const applyCompensation = () => {
    if (innerRef.current) {
      const v = compensationRef.current;
      innerRef.current.style.transform = v !== 0 ? `translateY(${v}px)` : '';
    }
  };

  const tick = () => {
    const container = scrollContainerRef.current;
    if (!container || speedRef.current === 0) {
      rafRef.current = null;
      return;
    }
    // Change scrollTop and apply compensation in the SAME synchronous
    // block — the browser paints them together so there's zero drift.
    const prevScroll = container.scrollTop;
    container.scrollTop += speedRef.current;
    const actualDelta = container.scrollTop - prevScroll;
    if (actualDelta !== 0) {
      compensationRef.current += actualDelta;
      applyCompensation();
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleDragStart = () => {
    setIsDragging(true);
    onDragActiveChange?.(true);
    compensationRef.current = 0;
    applyCompensation();
    const container = document.querySelector('[data-workout-scroll]');
    scrollContainerRef.current = container;
    scrollRectRef.current = container?.getBoundingClientRect() ?? null;
  };

  const handleDrag = (_, info) => {
    const rect = scrollRectRef.current;
    if (!rect) return;
    const y = info.point.y;

    if (y < rect.top + EDGE_ZONE) {
      const intensity = 1 - Math.max(0, (y - rect.top) / EDGE_ZONE);
      speedRef.current = -Math.max(2, intensity * MAX_SPEED);
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    } else if (y > rect.bottom - EDGE_ZONE) {
      const intensity = 1 - Math.max(0, (rect.bottom - y) / EDGE_ZONE);
      speedRef.current = Math.max(2, intensity * MAX_SPEED);
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    } else {
      speedRef.current = 0;
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragActiveChange?.(false);
    speedRef.current = 0;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // Settle compensation to 0 so the card snaps into its final slot smoothly
    if (innerRef.current && compensationRef.current !== 0) {
      const start = compensationRef.current;
      const startTime = performance.now();
      const duration = 300;
      const ease = (t) => 1 - Math.pow(1 - t, 3);

      const step = (now) => {
        const t = Math.min(1, (now - startTime) / duration);
        const val = start * (1 - ease(t));
        compensationRef.current = val;
        if (innerRef.current) {
          innerRef.current.style.transform = val !== 0 ? `translateY(${val}px)` : '';
        }
        if (t < 1) {
          settleRafRef.current = requestAnimationFrame(step);
        } else {
          compensationRef.current = 0;
          if (innerRef.current) innerRef.current.style.transform = '';
        }
      };
      settleRafRef.current = requestAnimationFrame(step);
    }
  };

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (settleRafRef.current) cancelAnimationFrame(settleRafRef.current);
  }, []);

  return (
    <Reorder.Item
      as="div"
      value={exercise}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      layout={isDragging ? false : "position"}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      transition={isDragging ? { duration: 0 } : { type: 'spring', stiffness: 700, damping: 35, mass: 0.4 }}
      style={{
        position: 'relative',
        zIndex: isDragging ? 9999 : 'auto',
      }}
      className="list-none"
    >
      {/* Plain div — framer-motion can't override its transform.
          Compensation is applied synchronously in tick() so it paints
          in the same frame as the scrollTop change. */}
      <div ref={innerRef}>
        <ExerciseSection exercise={exercise} dragControls={dragControls} isDragging={isDragging} dragActive={dragActive} {...props} />
      </div>
    </Reorder.Item>
  );
}