import { Reorder, useDragControls } from 'framer-motion';
import ExerciseSection from './ExerciseSection';

export default function ReorderableExercise({ exercise, onDragStart, onDragEnd, ...props }) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      as="div"
      value={exercise}
      dragControls={dragControls}
      dragListener={false}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      layout
      transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.5 }}
      className="list-none"
    >
      <ExerciseSection exercise={exercise} dragControls={dragControls} {...props} />
    </Reorder.Item>
  );
}