import { Reorder, useDragControls } from 'framer-motion';
import ExerciseSection from './ExerciseSection';

export default function ReorderableExercise({ exercise, ...props }) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      as="div"
      value={exercise}
      dragControls={dragControls}
      dragListener={false}
      layout="position"
      transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.8, restSpeed: 0.01, restDelta: 0.5 }}
      whileDrag={{ scale: 1.03, zIndex: 20 }}
      className="list-none"
    >
      <ExerciseSection exercise={exercise} dragControls={dragControls} {...props} />
    </Reorder.Item>
  );
}