import { useState, useEffect, useCallback } from 'react';
import { X, Trash2 } from 'lucide-react';
import ExercisePicker from './ExercisePicker';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ProgressGraph from './ProgressGraph';
import { getExerciseDetailList, getCachedImageMap, saveCachedImageMap } from '../lib/exerciseCache';
import { ensureExerciseDetail } from '../lib/ensureExerciseDetail';

export default function EditTemplateModal({ template, onClose, onSave }) {
  const [name, setName] = useState(template.name);
  const [exerciseList, setExerciseList] = useState(
    template.exerciseList.map(ex => ({
      ...ex,
      defaultSets: ex.defaultSets?.length
        ? ex.defaultSets
        : Array.from({ length: ex.sets || 1 }, () => {
            const last = ex.history?.[ex.history.length - 1];
            return {
              kg: last ? (typeof last === 'object' ? (last.kg ?? '') : last) : '',
              reps: last ? (typeof last === 'object' ? (last.reps ?? '') : 8) : '',
            };
          })
    }))
  );
  const [showPicker, setShowPicker] = useState(false);
  const [exerciseImages, setExerciseImages] = useState({});

  // Fetch exercise images — same pattern as WorkoutSheet
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

  const handleAddExercises = (exercises) => {
    setExerciseList(prev => {
      const existing = new Set(prev.map(e => e.name));
      const newOnes = exercises
        .filter(e => !existing.has(e.name))
        .map(e => ({ ...e, sets: 1, history: e.history || [], defaultSets: [{ kg: '', reps: '' }] }));
      return [...prev, ...newOnes];
    });
    setShowPicker(false);
  };

  const handleSave = () => {
    const updated = {
      ...template,
      name: name.trim() || template.name,
      exercises: exerciseList.length > 0
        ? exerciseList.map(e => e.name).join(', ') + '...'
        : 'No exercises yet',
      exerciseList: exerciseList.map(ex => ({ ...ex, sets: ex.defaultSets.length })),
    };
    onSave(updated);
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
      <div className="fixed inset-0 z-[60] flex flex-col bg-card pointer-events-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-200 hover:bg-gray-300 transition">
            <X className="w-4 h-4 text-gray-700" />
          </button>
          <span className="font-bold text-base text-gray-900">Edit Template</span>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition"
          >
            Save
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 pt-5 pb-28">
          {/* Template name */}
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="text-2xl font-extrabold text-gray-900 bg-transparent focus:outline-none w-full mb-6 border-b border-transparent focus:border-gray-200 pb-1"
          />

          {/* Exercises */}
          <DragDropContext onDragEnd={({ source, destination }) => {
            if (!destination) return;
            const next = [...exerciseList];
            const [moved] = next.splice(source.index, 1);
            next.splice(destination.index, 0, moved);
            setExerciseList(next);
          }}>
            <Droppable droppableId="edit-exercises">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
          {exerciseList.map((ex, exIdx) => (
            <Draggable key={ex.name + exIdx} draggableId={ex.name + exIdx} index={exIdx}>
              {(p) => (
            <div ref={p.innerRef} {...p.draggableProps} className="mb-7">
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <h3 {...p.dragHandleProps} className="text-blue-500 font-semibold text-base truncate cursor-grab active:cursor-grabbing select-none">{ex.name}</h3>
                </div>
                {exerciseImages[ex.name.toLowerCase()] ? (
                  <img
                    src={exerciseImages[ex.name.toLowerCase()]}
                    alt={ex.name}
                    className="rounded-xl object-contain flex-shrink-0 w-24 h-16"
                    decoding="async"
                    loading="lazy"
                  />
                ) : (
                  <div className="rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 w-24 h-16">
                    <span className="text-sm font-bold text-gray-400">{ex.name[0]}</span>
                  </div>
                )}
                <button onClick={() => removeExercise(exIdx)} className="p-1 rounded-lg hover:bg-red-50 transition flex-shrink-0">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>

              <ProgressGraph
                history={ex.history || []}
                animKey={0}
                animDir="add"
                isBodyweight={(ex.history || []).length > 0 && (ex.history || []).every(h => {
                  const kg = typeof h === 'object' ? (h.kg ?? 0) : (h ?? 0);
                  return kg === 0 || kg == null;
                })}
                compact
                exerciseName={ex.name}
              />

              {/* Set headers */}
              <div className="grid grid-cols-[32px_1fr_1fr_32px] gap-1 text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">
                <span className="text-center">Set</span>
                <span className="text-center">kg</span>
                <span className="text-center">Reps</span>
                <span />
              </div>

              {ex.defaultSets.map((s, setIdx) => (
                <div key={setIdx} className="grid grid-cols-[32px_1fr_1fr_32px] gap-1 items-center mb-1.5">
                  <span className="text-sm font-semibold text-center text-gray-500">{setIdx + 1}</span>
                  <input
                    type="number"
                    value={s.kg}
                    onChange={e => updateSet(exIdx, setIdx, 'kg', e.target.value)}
                    placeholder="—"
                    className="rounded-lg text-center text-sm font-semibold py-1.5 w-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    type="number"
                    value={s.reps}
                    onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                    placeholder="—"
                    className="rounded-lg text-center text-sm font-semibold py-1.5 w-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    onClick={() => removeSet(exIdx, setIdx)}
                    disabled={ex.defaultSets.length <= 1}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-100 transition disabled:opacity-30"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              ))}

              <button
                onClick={() => addSet(exIdx)}
                className="mt-1.5 w-full py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 transition"
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