import { useState, useCallback, useRef, useEffect } from 'react';
import { Share2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { shareToInstagram } from '../../lib/shareToInstagram';

export default function ExerciseShareButton({ exercise, sessionResults, pr }) {
  const [isSharing, setIsSharing] = useState(false);
  const bodyweightRef = useRef(null);
  const { toast } = useToast();

  // Pre-fetch bodyweight on mount so it's available synchronously when
  // the user taps share — any async work before the deep link breaks
  // iOS's user-gesture requirement and the URL scheme is silently blocked.
  useEffect(() => {
    base44.entities.BodyWeight.list('-date', 1)
      .then(weights => {
        if (weights[0]?.weight) bodyweightRef.current = weights[0].weight;
      })
      .catch(() => {});
  }, []);

  const handleShare = useCallback(() => {
    setIsSharing(true);

    const toKg = (h) => typeof h === 'object' ? (h.kg || 0) : (h || 0);
    const toReps = (h) => typeof h === 'object' ? (h.reps || 8) : 8;
    const bestSet = sessionResults.length > 0
      ? sessionResults.reduce((best, s) => (toKg(s) > toKg(best) ? s : best), sessionResults[0])
      : pr;
    const weight = bestSet ? toKg(bestSet) : 0;
    const reps = bestSet ? toReps(bestSet) : 0;
    const isPR = sessionResults.length > 0 && pr && !pr.bodyweight && weight >= pr.kg && weight > 0;
    const bw = bodyweightRef.current;
    const ratio = bw && bw > 0 && weight > 0 ? weight / bw : null;

    // shareToInstagram navigates to instagram-stories:// BEFORE any await,
    // preserving the user gesture. The .then() handles the fallback result.
    shareToInstagram({
      exerciseName: exercise.name,
      weight, reps, ratio, isPR,
      history: exercise.history,
      bodyweight: bw,
    })
      .then(result => {
        if (result?.cancelled) return;
        if (result?.shared) {
          toast({ title: 'Shared!', description: 'Your workout stats have been shared.' });
        } else if (result?.fallback === 'download') {
          toast({ title: 'Image saved', description: 'Share image downloaded to your device.' });
        }
      })
      .catch(e => {
        console.error('Share failed:', e);
        toast({ title: 'Share failed', description: 'Something went wrong. Please try again.', variant: 'destructive' });
      })
      .finally(() => setIsSharing(false));
  }, [exercise, sessionResults, pr, toast]);

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex-shrink-0"
      aria-label="Share to Instagram"
    >
      {isSharing ? (
        <Loader2 className="w-4 h-4 text-gray-700 dark:text-gray-200 animate-spin" />
      ) : (
        <Share2 className="w-4 h-4 text-gray-700 dark:text-gray-200" />
      )}
    </button>
  );
}