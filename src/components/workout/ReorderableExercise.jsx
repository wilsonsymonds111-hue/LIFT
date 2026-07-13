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

  // Apply compensation directly to DOM — synchronous, same frame as scroll
  const applyComp = () => {
    const el = innerRef.current;
    if (!el) return;
    const v = compensationRef.current;
    el.style.transform = v !== 0 ? `translateY(${v}px)` : '';
  };

  const tick = () => {
    const container = scrollContainerRef.current;
    if (!container || speedRef.current === 0) {
      rafRef.current = null;
      return;
    }
    // Change scrollTop and compensate in the SAME synchronous block —
    // browser paints them together so the card never drifts.
    const prev = container.scrollTop;
    container.scrollTop += speedRef.current;
    const delta = container.scrollTop - prev;
    if (delta !== 0) {
      compensationRef.current += delta;
      applyComp();
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleDragStart = () => {
    setIsDragging(true);
    onDragActiveChange?.(true);
    compensationRef.current = 0;
    applyComp();
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
    // Smoothly settle compensation back to 0 so card snaps into its slot
    if (compensationRef.current !== 0 && innerRef.current) {
      const start = compensationRef.current;
      const startTime = performance.now();
      const duration = 250;
      const ease = (t) => 1 - Math.pow(1 - t, 3);
      const step = (now) => {
        const t = Math.min(1, (now - startTime) / duration);
        const val = start * (1 - ease(t));
        compensationRef.current = val;
        if (innerRef.current) {
          innerRef.current.style.transform = val !== 0 ? `translateY(${val}px)` : '';
        }
        if (t < 1) requestAnimationFrame(step);
        else { compensationRef.current = 0; if (innerRef.current) innerRef.current.style.transform = ''; }
      };
      requestAnimationFrame(step);
    }
  };

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <Reorder.Item
      as="div"
      value={exercise}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      className="list-none"
      style={{ position: 'relative' }}
      whileDrag={{ zIndex: 9999 }}
    >
      {/* Plain div — framer-motion can't override its transform.
          Compensation applied synchronously in tick() so it paints
          in the same frame as the scrollTop change. */}
      <div ref={innerRef}>
        <ExerciseSection exercise={exercise} dragControls={dragControls} isDragging={isDragging} dragActive={dragActive} {...props} />
      </div>
    </Reorder.Item>
  );
}