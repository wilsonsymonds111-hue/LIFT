import { memo } from 'react';
import { MUSCLE_COLORS } from '../lib/exercises';

const ExerciseRow = memo(function ExerciseRow({ exercise, exerciseHistory, exerciseImages, onSelect, isLast }) {
  const colors = MUSCLE_COLORS[exercise.muscle] || MUSCLE_COLORS['Full Body'];
  const historyData = exerciseHistory[exercise.name];
  const imageUrl = exerciseImages?.[exercise.name];

  // Compute PR from history — find the entry with the highest weight (kg),
  // or if no weight entries, the highest reps.
  let prLabel = null;
  if (historyData?.length > 0) {
    const hasWeight = historyData.some(h => h.kg > 0);
    if (hasWeight) {
      const best = historyData.reduce((best, h) => (h.kg > best.kg ? h : best), historyData[0]);
      prLabel = `${best.kg} kg (×${best.reps || 1})`;
    } else {
      const best = historyData.reduce((best, h) => ((h.reps || 0) > (best.reps || 0) ? h : best), historyData[0]);
      prLabel = `${best.reps || 0} reps`;
    }
  }

  return (
    <div
      onClick={() => onSelect(exercise)}
      className={`flex items-center gap-3 py-3 px-3 cursor-pointer active:bg-black/5 dark:active:bg-muted/50 transition-colors duration-150 ${isLast ? '' : 'border-b border-gray-200/60 dark:border-border/50'}`}
    >
      {/* Exercise image or letter fallback */}
      <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt={exercise.name} loading="lazy" decoding="async" className="w-full h-full object-contain" />
        ) : (
          <div className={`w-full h-full ${colors.bg} flex items-center justify-center`}>
            <span className={`text-base font-bold ${colors.text}`}>{exercise.name[0]}</span>
          </div>
        )}
      </div>

      {/* Name + muscle */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{exercise.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{exercise.muscle}</p>
      </div>

      {/* PR pill */}
      {prLabel && (
        <span className="ml-auto flex-shrink-0 text-xs font-semibold text-gray-600 dark:text-muted-foreground bg-[#ececed] dark:bg-muted px-2.5 py-1 rounded-full">
          {prLabel}
        </span>
      )}
    </div>
  );
});

export default ExerciseRow;