import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import ReorderableExercise from './workout/ReorderableExercise';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import ExercisePicker from './ExercisePicker';
import { getExerciseDetailList, getCachedImageMap, saveCachedImageMap } from '../lib/exerciseCache';
import { ensureExerciseDetail } from '../lib/ensureExerciseDetail';

const capitalize = (s) => s.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

export default function EditTemplateModal({ template, onClose, onSave }) {
  const [name, setName] = useState(template.name);
  const [exercises, setExercises] = useState(
    (template.exerciseList || []).map(ex => ({ ...ex, name: capitalize(ex.name) }))
  );
  const [showPicker, setShowPicker] = useState(false);
  const [exerciseImages, setExerciseImages] = useState({});
  const [exerciseDragActive, setExerciseDragActive] = useState(false);
  const exerciseStateRef = useRef({});
  const exercisesRef = useRef(exercises);
  exercisesRef.current = exercises;

  // --- Image fetching (same pattern as WorkoutSheet) ---
  const buildImageMap = useCallback((results, exerciseList) => {
    const detailByName = {};
    (results || []).forEach(d => {
      if (d.image_url) detailByName[d.name.toLowerCase()] = d.image_url;
    });
    const map = {};
    const missing = [];
    (exerciseList || []).forEach(ex => {
      const key = ex.name.toLowerCase();
      if (detailByName[key]) {
        map[key] = detailByName[key];
      } else {
        const normalized = key.replace(/\s*\(.*?\)\s*/g, '').replace(/\bmachine\b/gi, ' ').replace(/\s+/g, ' ').replace(/es$/g, '').replace(/s$/g, '').trim();
        const fuzzyKey = Object.keys(detailByName).find(k => {
          const normK = k.replace(/\s*\(.*?\)\s*/g, '').replace(/\bmachine\b/gi, ' ').replace(/\s+/g, ' ').replace(/es$/g, '').replace(/s$/g, '').trim();
          return normK === normalized || k.includes(normalized) || normalized.includes(normK);
        });
        if (fuzzyKey) {
          map[key] = detailByName[fuzzyKey];
        } else {
          missing.push(ex.name);
        }
      }
    });
    return { map, missing };
  }, []);

  useEffect(() => {
    const exerciseList = template?.exerciseList || [];
    const cachedMap = getCachedImageMap();
    if (cachedMap) {
      const { map } = buildImageMap(
        Object.entries(cachedMap).map(([name, url]) => ({ name, image_url: url })),
        exerciseList
      );
      setExerciseImages(map);
    }
    getExerciseDetailList().then(async (results) => {
      const { map, missing } = buildImageMap(results, exerciseList);
      setExerciseImages(map);
      const detailByName = {};
      (results || []).forEach(d => {
        if (d.image_url) detailByName[d.name.toLowerCase()] = d.image_url;
      });
      saveCachedImageMap(detailByName);
      missing.forEach(async (name) => {
        try {
          const detail = await ensureExerciseDetail(name);
          if (detail?.image_url) {
            setExerciseImages(prev => ({ ...prev, [name.toLowerCase()]: detail.image_url }));
          }
        } catch {}
      });
    });
  }, [template?.id, buildImageMap]);

  // --- Drag auto-scroll (mirrors WorkoutSheet) ---
  const scrollContainerRef = useRef(null);
  const dragPointerYRef = useRef(null);
  const isDraggingRef = useRef(false);
  const autoScrollRAFRef = useRef(null);
  const dragContainerRectRef = useRef(null);

  const handleDragPointerMove = useCallback((e) => {
    dragPointerYRef.current = e.touches?.[0]?.clientY ?? e.clientY;
  }, []);

  const dragAutoScroll = useCallback(() => {
    if (!isDraggingRef.current) return;
    const container = scrollContainerRef.current;
    const rect = dragContainerRectRef.current;
    if (container && rect && dragPointerYRef.current != null) {
      const y = dragPointerYRef.current - rect.top;
      const threshold = 130;
      const maxSpeed = 20;
      if (y < threshold) {
        container.scrollTop -= maxSpeed * Math.min(1, 1 - y / threshold);
      } else if (y > rect.height - threshold) {
        container.scrollTop += maxSpeed * Math.min(1, 1 - (rect.height - y) / threshold);
      }
    }
    autoScrollRAFRef.current = requestAnimationFrame(dragAutoScroll);
  }, []);

  const handleDragStart = useCallback(() => {
    setExerciseDragActive(true);
    isDraggingRef.current = true;
    dragContainerRectRef.current = scrollContainerRef.current?.getBoundingClientRect() ?? null;
    window.addEventListener('pointermove', handleDragPointerMove, { passive: true });
    window.addEventListener('touchmove', handleDragPointerMove, { passive: true });
    autoScrollRAFRef.current = requestAnimationFrame(dragAutoScroll);
  }, [handleDragPointerMove, dragAutoScroll]);

  const pendingScrollTargetRef = useRef(null);

  const handleDragEnd = useCallback((result) => {
    scrollContainerRef.current?.classList.remove('drag-active');
    scrollContainerRef.current?.querySelectorAll('.drag-preserve').forEach(el => el.classList.remove('drag-preserve'));
    isDraggingRef.current = false;
    setExerciseDragActive(false);
    window.removeEventListener('pointermove', handleDragPointerMove);
    window.removeEventListener('touchmove', handleDragPointerMove);
    const dropY = (dragPointerYRef.current != null && dragContainerRectRef.current)
      ? dragPointerYRef.current - dragContainerRectRef.current.top
      : null;
    dragPointerYRef.current = null;
    if (autoScrollRAFRef.current) cancelAnimationFrame(autoScrollRAFRef.current);
    if (!result.destination || result.source.index === result.destination.index) return;
    const reordered = Array.from(exercisesRef.current);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    pendingScrollTargetRef.current = { name: moved.name, dropY };
    setExercises(reordered);
  }, [handleDragPointerMove]);

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handleDragPointerMove);
      window.removeEventListener('touchmove', handleDragPointerMove);
      if (autoScrollRAFRef.current) cancelAnimationFrame(autoScrollRAFRef.current);
    };
  }, [handleDragPointerMove]);

  useLayoutEffect(() => {
    const target = pendingScrollTargetRef.current;
    if (!target || !scrollContainerRef.current) return;
    pendingScrollTargetRef.current = null;
    const container = scrollContainerRef.current;
    const findTargetEl = () => {
      const allDraggables = container.querySelectorAll('[data-rfd-draggable-id]');
      return Array.from(allDraggables).find(
        el => el.getAttribute('data-rfd-draggable-id') === target.name
      );
    };
    const targetEl = findTargetEl();
    if (targetEl) targetEl.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    const scrollTimer = setTimeout(() => {
      const el = findTargetEl();
      if (!el || !scrollContainerRef.current) return;
      const c = scrollContainerRef.current;
      const targetRect = el.getBoundingClientRect();
      const containerRect = c.getBoundingClientRect();
      const elementTopInContainer = targetRect.top - containerRect.top + c.scrollTop;
      const y = target.dropY != null ? target.dropY : containerRect.height / 4;
      c.scrollTop = Math.max(0, elementTopInContainer - y);
    }, 330);
    return () => clearTimeout(scrollTimer);
  }, [exercises]);

  // --- Per-exercise state tracking ---
  const handleExerciseStateChange = useCallback((exerciseName, state) => {
    exerciseStateRef.current[exerciseName] = state;
  }, []);

  const handleDeleteExercise = useCallback((idx) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleAddExercises = (picked) => {
    setExercises(prev => {
      const existing = new Set(prev.map(e => e.name));
      const newOnes = picked
        .filter(e => !existing.has(e.name))
        .map(e => ({ ...e, sets: 1, history: e.history || [] }));
      return [...prev, ...newOnes];
    });
    setShowPicker(false);
    const newNames = picked.filter(e => !exerciseImages[e.name.toLowerCase()]).map(e => e.name);
    if (newNames.length > 0) {
      Promise.all(newNames.map(name => ensureExerciseDetail(name))).then(results => {
        const generated = {};
        newNames.forEach((name, i) => {
          if (results[i]?.image_url) generated[name.toLowerCase()] = results[i].image_url;
        });
        setExerciseImages(prev => ({ ...prev, ...generated }));
      });
    }
  };

  const handleSave = () => {
    const updated = {
      ...template,
      name: name.trim() || template.name,
      exercises: exercises.length > 0
        ? exercises.map(e => e.name).join(', ') + '...'
        : 'No exercises yet',
      exerciseList: exercises.map(ex => {
        const state = exerciseStateRef.current[ex.name];
        return {
          ...ex,
          sets: state?.sets?.length || ex.sets || 1,
          note: state?.note ?? ex.note ?? '',
        };
      }),
    };
    onSave(updated);
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex flex-col bg-card pointer-events-auto">
        {/* Top bar — X (left), title (center), Save (right) */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 dark:border-neutral-700">
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 transition">
            <X className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
          <span className="font-bold text-base text-gray-900 dark:text-white">Edit Template</span>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition"
          >
            Save
          </button>
        </div>

        {/* Body */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 pt-5 pb-28 edit-exercise-list">
          {/* Exercises — same ExerciseSection cards as live workout */}
          <DragDropContext
            onBeforeCapture={(before) => {
              const container = scrollContainerRef.current;
              if (!container) return;
              const draggedEl = container.querySelector(`[data-rfd-draggable-id="${before.draggableId}"]`);
              if (!draggedEl) return;
              const screenYBefore = draggedEl.getBoundingClientRect().top;
              container.classList.add('drag-active');
              const screenYAfter = draggedEl.getBoundingClientRect().top;
              container.scrollTop += screenYAfter - screenYBefore;
            }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <Droppable droppableId="edit-exercises" direction="vertical">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {exercises.map((exercise, idx) => (
                    <ReorderableExercise
                      key={exercise.name}
                      exercise={exercise}
                      index={idx}
                      onDeleteExercise={() => handleDeleteExercise(idx)}
                      exerciseImage={exerciseImages[exercise.name.toLowerCase()]}
                      initialState={exerciseStateRef.current[exercise.name]}
                      onStateChange={(state) => handleExerciseStateChange(exercise.name, state)}
                      dragActive={exerciseDragActive}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Add Exercises */}
          <button
            onClick={() => setShowPicker(true)}
            className="mt-2 w-full py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-500 font-semibold rounded-xl text-sm transition"
          >
            Add Exercises
          </button>
        </div>
      </div>

      {showPicker && (
        <ExercisePicker onClose={() => setShowPicker(false)} onAdd={handleAddExercises} />
      )}
    </>
  );
}