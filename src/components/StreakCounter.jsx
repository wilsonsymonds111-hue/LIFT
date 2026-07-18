import { useMemo } from 'react';
import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { useExerciseHistory } from '@/hooks/useExerciseHistory';
import { computeScheduleStreak } from '@/lib/streakCalculator';

export default function StreakCounter({ onDays, offDays, startDayIndex }) {
  const { data: exerciseHistoryData } = useExerciseHistory();

  const streak = useMemo(() => {
    if (!onDays || !offDays || onDays < 1 || startDayIndex == null || isNaN(startDayIndex)) return 0;
    const historyMap = exerciseHistoryData?.history || {};
    const dates = new Set();
    Object.values(historyMap).forEach((entries) => {
      (entries || []).forEach((h) => {
        if (h?.date) dates.add(h.date.slice(0, 10));
      });
    });
    return computeScheduleStreak({ workoutDates: dates, onDays, offDays, startDayIndex });
  }, [exerciseHistoryData, onDays, offDays, startDayIndex]);

  if (streak < 1) return null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50"
    >
      <Flame className="w-4 h-4 text-orange-500" strokeWidth={2.2} />
      <span className="text-sm font-bold text-orange-600 dark:text-orange-400 leading-none">
        {streak} <span className="font-semibold text-orange-500/80 dark:text-orange-500/70">day{streak !== 1 ? 's' : ''}</span>
      </span>
    </motion.div>
  );
}