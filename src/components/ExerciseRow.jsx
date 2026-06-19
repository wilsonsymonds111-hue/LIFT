import { memo } from 'react';
import { MUSCLE_COLORS } from '../lib/exercises';
import Sparkline from './Sparkline';

const ExerciseRow = memo(function ExerciseRow({ exercise, exerciseHistory, onClick }) {
  const colors = MUSCLE_COLORS[exercise.muscle] || MUSCLE_COLORS['Full Body'];
  const historyData = exerciseHistory[exercise.name];
  const chartData = historyData?.slice(-6).map(h => ({ v: h.v })) || [];

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 py-2.5 border-b border-border/50 cursor-pointer active:bg-muted/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
    >
      {/* Letter avatar */}
      <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
        <span className={`text-sm font-bold ${colors.text}`}>{exercise.name[0]}</span>
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