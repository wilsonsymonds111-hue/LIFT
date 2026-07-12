import { useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import ExerciseSection from './ExerciseSection';

export default function ReorderableExercise({ exercise, ...props }) {
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);
  return (
    <Reorder.Item
      as="div"
      value={exercise}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      layout="position"
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      transition={{ type: 'spring', stiffness: 1200, damping: 50, mass: 0.15, restSpeed: 0.01, restDelta: 0.5 }}
      whileDrag={{ zIndex: 50 }}
      className="list-none"
    >
      <ExerciseSection exercise={exercise} dragControls={dragControls} isDragging={isDragging} {...props} />
    </Reorder.Item>
  );
}