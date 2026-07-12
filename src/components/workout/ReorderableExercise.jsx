import { useState, useRef, useEffect } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import ExerciseSection from './ExerciseSection';

const EDGE_ZONE = 100;
const MAX_SPEED = 14;

export default function ReorderableExercise({ exercise, ...props }) {
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);
  const scrollContainerRef = useRef(null);
  const scrollRectRef = useRef(null);
  const rafRef = useRef(null);
  const speedRef = useRef(0);

  const tick = () => {
    const container = scrollContainerRef.current;
    if (!container || speedRef.current === 0) {
      rafRef.current = null;
      return;
    }
    container.scrollTop += speedRef.current;
    rafRef.current = requestAnimationFrame(tick);
  };

  // Cache scroll container + its rect at drag start so we never touch the DOM during drag moves
  const handleDragStart = () => {
    setIsDragging(true);
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
    speedRef.current = 0;
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
      layout="position"
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      transition={{ duration: 0 }}
      style={{
        position: 'relative',
        zIndex: isDragging ? 9999 : 'auto',
      }}
      className="list-none"
    >
      <ExerciseSection exercise={exercise} dragControls={dragControls} isDragging={isDragging} {...props} />
    </Reorder.Item>
  );
}