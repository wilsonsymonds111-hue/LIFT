import { memo } from 'react';
import { MUSCLE_COLORS } from '../lib/exercises';
import Sparkline from './Sparkline';

const ExerciseRow = memo(function ExerciseRow({ exercise, exerciseHistory, exerciseImages, onSelect, isLast }) {
  const colors = MUSCLE_COLORS[exercise.muscle] || MUSCLE_COLORS['Full Body'];
  const historyData = exerciseHistory[exercise.name];
  const chartData = historyData?.map(h => ({ v: h.v })) || [];
  const imageUrl = exerciseImages?.[exercise.name];

  return (
    <div
      onClick={() => onSelect(exercise)}
      className={`flex items-center gap-3 py-3 px-3 cursor-pointer active:bg-black/5 dark:active:bg-muted/50 transition-colors duration-150 ${isLast ? '' : 'border-b border-gray-100 dark:border-border/50'}`}
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

      {/* Mini sparkline */}
      {chartData.length > 0 && (
        <div className="w-16 h-8 ml-auto flex-shrink-0 flex items-center justify-center">
          <Sparkline data={chartData} width={64} height={32} />
        </div>
      )}
    </div>
  );
});

export default ExerciseRow;