import { Draggable } from '@hello-pangea/dnd';
import ExerciseSection from './ExerciseSection';

export default function ReorderableExercise({ exercise, index, dragActive, ...props }) {
  return (
    <Draggable draggableId={exercise.name} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            ...provided.draggableProps.style,
            zIndex: snapshot.isDragging ? 9999 : 'auto',
            ...(snapshot.isDragging ? { willChange: 'transform' } : {}),
          }}
        >
          <ExerciseSection
            exercise={exercise}
            dragHandleProps={provided.dragHandleProps}
            isDragging={snapshot.isDragging}
            dragActive={dragActive}
            {...props}
          />
        </div>
      )}
    </Draggable>
  );
}