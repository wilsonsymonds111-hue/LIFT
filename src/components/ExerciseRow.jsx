import { memo } from 'react';
import { MUSCLE_COLORS } from '../lib/exercises';

const ExerciseRow = memo(function ExerciseRow({ exercise, exerciseHistory, exerciseImages, onSelect, isLast }) {
  const colors = MUSCLE_COLORS[exercise.muscle] || MUSCLE_COLORS['Full Body'];
  const historyData = exerciseHistory[exercise.name];
  const imageUrl = exerciseImages?.[exercise.name];

  // Get the latest (most recent) weight + reps as PR
  const pr = historyData && historyData.length > 0 ? historyData[historyData.length - 1] : null;

  return (
    <div
      onClick={() => onSelect(exercise)}
      className="flex items-center gap-3 py-3 px-3 mb-1.5 cursor-pointer bg-white/60 dark:bg-card/40 rounded-xl active:bg-black/5 dark:active:bg-muted/50 transition-colors duration-150"
    >
      {/* Exercise image or letter fallback */}
      <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden bg-gray-50 dark:bg-muted/60">
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

      {/* PR display */}
      {pr && (
        <div className="ml-auto flex-shrink-0 text-right mr-7">
          <p className="text-sm text-muted-foreground">{pr.kg} kg (×{pr.v})</p>
        </div>
      )}
    </div>
  );
});

export default ExerciseRow;