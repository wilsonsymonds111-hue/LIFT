import { useState } from 'react';
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      </button>
      {showModal && (
        <SharePreviewModal shareData={shareData} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}