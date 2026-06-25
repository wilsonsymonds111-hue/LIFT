import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ArrowLeft, Target } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useWorkoutTemplates } from '../hooks/useWorkoutTemplates';
import { useQueryClient } from '@tanstack/react-query';
import { useExerciseHistory } from '../hooks/useExerciseHistory';
import { useExerciseGoals } from '../hooks/useExerciseGoals';
import EditTemplateModal from '../components/EditTemplateModal';

function relativeTime(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  if (diffMs < 60000) return 'Just now';
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export default function TemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showEdit, setShowEdit] = useState(false);
  const queryClient = useQueryClient();

  // Reuse React Query cache from Home page — data is already loaded, no refetch
  const { data: templates } = useWorkoutTemplates();
  const { data: exerciseData = {} } = useExerciseHistory();
  const { data: goalsData = {} } = useExerciseGoals();
  // History is saved under the capitalised exercise name (WorkoutSheet
  // title-cases names before saving), but the template may store the original
  // (e.g. lowercase) name. Match case-insensitively so sparklines always find
  // their data.
  const exerciseDataByKey = useMemo(() => {
    const m = {};
    Object.entries(exerciseData).forEach(([k, v]) => { m[k.toLowerCase()] = v; });
    return m;
  }, [exerciseData]);
  const goalsByKey = useMemo(() => {
    const m = {};
    Object.entries(goalsData).forEach(([k, v]) => { m[k.toLowerCase()] = v; });
    return m;
  }, [goalsData]);
  const template = templates?.find(t => t.id === id);

  if (!template) {
    return createPortal(
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>,
      document.body
    );
  }

  if (showEdit) {
    return (
      <EditTemplateModal
        template={template}
        onClose={() => setShowEdit(false)}
        onSave={async (updated) => {
          await base44.entities.WorkoutTemplate.update(updated.id, updated);
          queryClient.invalidateQueries({ queryKey: ['workoutTemplates'] });
          setShowEdit(false);
        }}
      />
    );
  }

  const lastPerformed = template.lastPerformed
    ? `Last Performed: ${relativeTime(template.lastPerformed)}`
    : 'Not performed yet';

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
      <div className="relative bg-card rounded-3xl w-[90%] max-w-sm max-h-[85vh] flex flex-col shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <button
            onClick={() => navigate('/')}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-muted hover:bg-muted/70 transition"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="font-bold text-base tracking-wide text-foreground">{template.name}</h2>
          <button
            onClick={() => setShowEdit(true)}
            className="text-blue-500 font-semibold text-sm hover:text-blue-600 transition"
          >
            Edit
          </button>
        </div>

        <p className="px-5 pt-3 pb-1 text-sm text-muted-foreground">{lastPerformed}</p>

        <div className="px-5 py-3 space-y-3 overflow-y-auto flex-1">
          {template.exerciseList?.map((exercise, idx) => {
            const history = exerciseDataByKey[exercise.name.toLowerCase()] || exercise.history || [];
            const goal = goalsByKey[exercise.name.toLowerCase()];
            return (
          <div key={idx} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm leading-snug">{exercise.sets || 2} × {exercise.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-muted-foreground">{exercise.muscle}</p>
                {goal && (
                  <span className="text-[10px] text-blue-500 font-semibold flex items-center gap-0.5">
                    <Target className="w-2.5 h-2.5" /> {goal.kg}kg × {goal.reps}
                  </span>
                )}
              </div>
            </div>
            {history.length > 0 && (() => {
              const toKg = (h) => typeof h === 'object' ? (h.kg || 0) : (h || 0);
              const toReps = (h) => typeof h === 'object' ? (h.reps || 0) : 8;
              const isBodyweight = history.every(h => toKg(h) === 0);
              const pr = isBodyweight
                ? { kg: 0, reps: Math.max(...history.map(toReps)) }
                : (() => {
                    const maxKg = Math.max(...history.map(toKg));
                    const maxReps = Math.max(...history.filter(h => toKg(h) === maxKg).map(toReps));
                    return { kg: maxKg, reps: maxReps };
                  })();
              return (
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-bold text-foreground whitespace-nowrap">
                    {isBodyweight ? `${pr.reps} reps` : `${pr.kg}kg × ${pr.reps}`}
                  </p>
                </div>
              );
            })()}
          </div>
            );
          })}
        </div>

        <div className="px-5 py-5">
          <button
            onClick={() => navigate(`/active-workout/${template.id}`)}
            className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-4 rounded-2xl text-base transition"
          >
            Start Workout
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}