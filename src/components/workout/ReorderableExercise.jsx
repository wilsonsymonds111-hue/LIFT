import { useState, useRef, useEffect } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import ExerciseSection from './ExerciseSection';

const EDGE_ZONE = 100; // px from edge to trigger auto-scroll
const MAX_SPEED = 14; // max scroll speed per frame

export default function ReorderableExercise({ exercise, ...props }) {
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);
  const scrollContainerRef = useRef(null);
  const rafRef = useRef(null);
  const speedRef = useRef(0);

  const getScrollContainer = () => {
    if (scrollContainerRef.current) return scrollContainerRef.current;
    const el = document.querySelector('[data-workout-scroll]');
    if (el) scrollContainerRef.current = el;
    return el;
  };

  // Continuous auto-scroll loop — runs while pointer is in the edge zone
  const tick = () => {
    const container = scrollContainerRef.current;
    if (!container || speedRef.current === 0) {
      rafRef.current = null;
      return;
    }
    container.scrollTop += speedRef.current;
    rafRef.current = requestAnimationFrame(tick);
  };

  // Called on every drag move — adjusts scroll speed based on pointer proximity to edges
  const handleDrag = (_, info) => {
    const container = getScrollContainer();
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const y = info.point.y;

    if (y < rect.top + EDGE_ZONE) {
      // Near top — scroll up, faster when closer to edge
      const intensity = 1 - Math.max(0, (y - rect.top) / EDGE_ZONE);
      speedRef.current = -Math.max(2, intensity * MAX_SPEED);
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    } else if (y > rect.bottom - EDGE_ZONE) {
      // Near bottom — scroll down
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
      onDragStart={() => setIsDragging(true)}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      // Instant tracking while dragging (no spring lag — card sticks to finger).
      // Smooth spring when not dragging so reordering animations feel fluid.
      transition={isDragging
        ? { duration: 0 }
        : { type: 'spring', stiffness: 700, damping: 35, mass: 0.4 }
      }
      style={{
        position: 'relative',
        zIndex: isDragging ? 9999 : 'auto',
        isolation: isDragging ? 'isolate' : 'auto',
      }}
      className="list-none"
    >
      <ExerciseSection exercise={exercise} dragControls={dragControls} isDragging={isDragging} {...props} />
    </Reorder.Item>
  );
}