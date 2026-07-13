import { useState } from 'react';
import { shareToInstagram } from '@/lib/shareToInstagram';

const INSTAGRAM_ICON_URL = 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/427c77c15_image.png';

const toKg = (v) => typeof v === 'object' ? (v.kg || 0) : (v || 0);
const toReps = (v) => typeof v === 'object' ? (v.reps || 0) : (v || 0);

export default function ExerciseShareButton({ exercise, sessionResults, pr }) {
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const history = exercise.history || [];
      const sets = (sessionResults && sessionResults.length > 0) ? sessionResults : [];
      const isBodyweight = pr?.bodyweight || (history.length === 0 && sets.every(s => toKg(s) === 0));

      let weight = 0, reps = 0;
      if (sets.length > 0) {
        if (isBodyweight) {
          reps = Math.max(...sets.map(toReps));
        } else {
          const maxKg = Math.max(...sets.map(toKg));
          const atMax = sets.filter(s => toKg(s) === maxKg);
          weight = maxKg;
          reps = Math.max(...atMax.map(toReps));
        }
      } else if (pr) {
        weight = pr.kg || 0;
        reps = pr.reps || 0;
      } else {
        return;
      }

      let isPR = false;
      if (sets.length > 0 && history.length > 0) {
        isPR = isBodyweight
          ? reps > Math.max(...history.map(toReps))
          : weight > Math.max(...history.map(toKg));
      } else if (sets.length > 0 && history.length === 0) {
        isPR = true;
      }

      await shareToInstagram({ exerciseName: exercise.name, weight, reps, history, isPR, sessionResults: sets });
    } finally {
      setSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      className="w-7 h-7 flex items-center justify-center rounded-lg transition flex-shrink-0 hover:opacity-80 overflow-hidden disabled:opacity-50"
      aria-label="Share to Instagram"
    >
      <img src={INSTAGRAM_ICON_URL} alt="Share to Instagram" className={`w-5 h-5 object-contain ${sharing ? 'animate-pulse' : ''}`} />
    </button>
  );
}