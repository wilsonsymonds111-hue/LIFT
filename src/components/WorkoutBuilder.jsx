import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import ExercisePicker from './ExercisePicker';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function WorkoutBuilder({ onClose, onSave, initialExercises = [] }) {
  const [exerciseList, setExerciseList] = useState(
    initialExercises.map(ex => ({
      ...ex,
      defaultSets: ex.defaultSets?.length
        ? ex.defaultSets
        : Array.from({ length: ex.sets || 2 }, () => ({ kg: '', reps: '' })),
    }))
  );
  const [showPicker, setShowPicker] = useState(false);

  const handleAddExercises = (exercises) => {
    setExerciseList(prev => {
      const existing = new Set(prev.map(e => e.name));
      const newOnes = exercises
        .filter(e => !existing.has(e.name))
        .map(e => ({ ...e, sets: 2, history: e.history || [], defaultSets: [{ kg: '', reps: '' }, { kg: '', reps: '' }] }));
      return [...prev, ...newOnes];
    });
    setShowPicker(false);
  };

  const handleSave = () => {
    onSave(exerciseList);
  };

  const updateSet = (exIdx, setIdx, field, value) => {
    setExerciseList(prev => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      return { ...ex, defaultSets: ex.defaultSets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s) };
    }));
  };

  const addSet = (exIdx) => {
    setExerciseList(prev => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      const last = ex.defaultSets[ex.defaultSets.length - 1] || { kg: '', reps: '' };
      return { ...ex, defaultSets: [...ex.defaultSets, { ...last }] };
    }));
  };

  const removeSet = (exIdx, setIdx) => {
    setExerciseList(prev => prev.map((ex, i) => {
      if (i !== exIdx || ex.defaultSets.length <= 1) return ex;
      return { ...ex, defaultSets: ex.defaultSets.filter((_, j) => j !== setIdx) };
    }));
  };

  const removeExercise = (exIdx) => {
    setExerciseList(prev => prev.filter((_, i) => i !== exIdx));
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex flex-col bg-card">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border flex-shrink-0" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-muted hover:bg-muted/70 transition">
            <X className="w-4 h-4 text-foreground" />
          </button>
          <span className="font-extrabold text-base text-foreground">Build Workout</span>
          <button
            onClick={handleSave}
            disabled={exerciseList.length === 0}
            className="px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition"
          >
            Save
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 pt-5 pb-28">
          {/* Exercises */}
          {exerciseList.length > 0 ? (
            <DragDropContext onDragEnd={({ source, destination }) => {
              if (!destination) return;
              const next = [...exerciseList];
              const [moved] = next.splice(source.index, 1);
              next.splice(destination.index, 0, moved);
              setExerciseList(next);
            }}>
              <Droppable droppableId="build-exercises">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {exerciseList.map((ex, exIdx) => (
                      <Draggable key={ex.name + exIdx} draggableId={ex.name + exIdx} index={exIdx}>
                        {(p) => (
                          <div ref={p.innerRef} {...p.draggableProps} className="mb-7">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <h3 {...p.dragHandleProps} className="text-blue-500 font-semibold text-base truncate cursor-grab active:cursor-grabbing select-none">{ex.name}</h3>
                              </div>
                              <button onClick={() => removeExercise(exIdx)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition flex-shrink-0">
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>

                            {/* Set headers */}
                            <div className="grid grid-cols-[32px_1fr_1fr_32px] gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-1">
                              <span className="text-center">Set</span>
                              <span className="text-center">kg</span>
                              <span className="text-center">Reps</span>
                              <span />
                            </div>

                            {ex.defaultSets.map((s, setIdx) => (
                              <div key={setIdx} className="grid grid-cols-[32px_1fr_1fr_32px] gap-1 items-center mb-1.5">
                                <span className="text-sm font-semibold text-center text-muted-foreground">{setIdx + 1}</span>
                                <input
                                  type="number"
                                  value={s.kg}
                                  onChange={e => updateSet(exIdx, setIdx, 'kg', e.target.value)}
                                  placeholder="—"
                                  className="rounded-lg text-center text-sm font-semibold py-1.5 w-full bg-muted focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                                <input
                                  type="number"
                                  value={s.reps}
                                  onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                                  placeholder="—"
                                  className="rounded-lg text-center text-sm font-semibold py-1.5 w-full bg-muted focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                                <button
                                  onClick={() => removeSet(exIdx, setIdx)}
                                  disabled={ex.defaultSets.length <= 1}
                                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-100 dark:hover:bg-red-950/20 transition disabled:opacity-30"
                                >
                                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                                </button>
                              </div>
                            ))}

                            <button
                              onClick={() => addSet(exIdx)}
                              className="mt-1.5 w-full py-1.5 bg-card hover:bg-muted border border-border rounded-xl text-sm font-medium text-muted-foreground transition"
                            >
                              + Add Set
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <p className="text-center text-muted-foreground text-sm mt-16">
              No exercises yet — tap below to start adding
            </p>
          )}

          {/* Add Exercises */}
          <button
            onClick={() => setShowPicker(true)}
            className="mt-2 w-full py-3.5 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 text-blue-500 font-semibold rounded-xl text-sm transition"
          >
            + Add Exercises
          </button>
        </div>
      </div>

      {showPicker && (
        <ExercisePicker onClose={() => setShowPicker(false)} onAdd={handleAddExercises} />
      )}
    </>
  );
}