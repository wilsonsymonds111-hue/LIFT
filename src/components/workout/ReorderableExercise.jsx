import { useState, useRef, useEffect } from 'react';
import { Reorder, useDragControls, useMotionValue, animate } from 'framer-motion';
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
  // Compensates the card's Y position during auto-scroll so it stays
  // glued to the finger. Without this, scrollTop changes move the card
  // with the container while the pointer stays still — causing drift.
  const yCompensation = useMotionValue(0);
  const lastPointerYRef = useRef(0);

  const tick = () => {
    const container = scrollContainerRef.current;
    if (!container || speedRef.current === 0) {
      rafRef.current = null;
      return;
    }
    const delta = speedRef.current;
    container.scrollTop += delta;
    // Counter-scroll: move the card by the same delta so it visually
    // stays exactly where the finger is.
    yCompensation.set(yCompensation.get() + delta);
    rafRef.current = requestAnimationFrame(tick);
  };

  // Cache scroll container + its rect at drag start so we never touch the DOM during drag moves
  const handleDragStart = () => {
    setIsDragging(true);
    onDragActiveChange?.(true);
    yCompensation.set(0);
    const container = document.querySelector('[data-workout-scroll]');
    scrollContainerRef.current = container;
    scrollRectRef.current = container?.getBoundingClientRect() ?? null;
  };

  const handleDrag = (_, info) => {
    const rect = scrollRectRef.current;
    if (!rect) return;
    const y = info.point.y;
    lastPointerYRef.current = y;

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
    // Smoothly return compensation to 0 so the card settles into its
    // natural slot without a jump. Spring matches Reorder.Item's transition
    // so the combined motion is a single smooth spring.
    animate(yCompensation, 0, { type: 'spring', stiffness: 700, damping: 35, mass: 0.4 });
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
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
      dragElastic={0}
      layout={isDragging ? false : "position"}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      transition={isDragging ? { duration: 0 } : { type: 'spring', stiffness: 700, damping: 35, mass: 0.4 }}
      style={{
        position: 'relative',
        zIndex: isDragging ? 9999 : 'auto',
        y: yCompensation,
      }}
      className="list-none"
    >
      <ExerciseSection exercise={exercise} dragControls={dragControls} isDragging={isDragging} dragActive={dragActive} {...props} />
    </Reorder.Item>
  );
}