import { memo } from 'react';
import { useTimer } from '../../hooks/useTimer';

// Isolated timer component — prevents parent re-render every second
const TimerDisplay = memo(function TimerDisplay({ startTimestamp, className }) {
  const { display } = useTimer(startTimestamp);
  return <span className={className}>{display}</span>;
});

export default TimerDisplay;