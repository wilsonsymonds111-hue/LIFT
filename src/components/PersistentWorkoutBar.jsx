import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { loadWorkoutSession } from '../lib/workoutSession';
import { isSessionStale } from '../lib/staleWorkoutCheck';
import TimerDisplay from './workout/TimerDisplay';

// Shows a persistent minimized workout bar across all tabs when a workout
// session is active but the user is not on the active-workout route.
// Tapping it navigates back to the full workout sheet.
export default function PersistentWorkoutBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(null);

  useEffect(() => {
    const check = () => {
      const s = loadWorkoutSession();
      if (s?.templateId && !isSessionStale(s)) {
        setSession(s);
      } else {
        setSession(null);
      }
    };
    check();
    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, []);

  const isOnActiveWorkout = location.pathname.startsWith('/active-workout');
  const visible = session && !isOnActiveWorkout;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed left-3 right-3 z-30"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
          onClick={() => navigate(`/active-workout/${session.templateId}`)}
        >
          <div
            className="flex items-center justify-between px-5 h-[72px] rounded-2xl cursor-pointer active:scale-[0.98] transition"
            style={{
              background: 'rgba(255,255,255,0.78)',
              backdropFilter: 'blur(60px) saturate(160%)',
              WebkitBackdropFilter: 'blur(60px) saturate(160%)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 0 0 2px rgba(59,130,246,1), inset 0 1px 1px rgba(255,255,255,0.6)',
            }}
          >
            <p className="font-bold text-foreground text-base truncate">{session.templateName || 'Workout'}</p>
            <TimerDisplay startTimestamp={session.startTime} className="text-base text-muted-foreground font-display" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}