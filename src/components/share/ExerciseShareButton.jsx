import { useState } from 'react';
import { Share2 } from 'lucide-react';
import SharePreviewModal from './SharePreviewModal';

const toKg = (v) => typeof v === 'object' ? (v.kg || 0) : (v || 0);
const toReps = (v) => typeof v === 'object' ? (v.reps || 0) : (v || 0);

export default function ExerciseShareButton({ exercise, sessionResults, pr }) {
  const [showModal, setShowModal] = useState(false);

  const shareData = (() => {
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
      return null;
    }

    let isPR = false;
    if (sets.length > 0 && history.length > 0) {
      isPR = isBodyweight
        ? reps > Math.max(...history.map(toReps))
        : weight > Math.max(...history.map(toKg));
    } else if (sets.length > 0 && history.length === 0) {
      isPR = true;
    }

    return { exerciseName: exercise.name, weight, reps, history, isPR, sessionResults: sets };
  })();

  if (!shareData) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-7 h-7 flex items-center justify-center rounded-lg transition flex-shrink-0 hover:opacity-80"
        aria-label="Share PR"
      >
        <Share2 className="w-[18px] h-[18px] text-blue-500" />
      </button>
      {showModal && (
        <SharePreviewModal shareData={shareData} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}