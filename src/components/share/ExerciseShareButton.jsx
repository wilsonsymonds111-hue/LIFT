import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

const INSTAGRAM_ICON_URL = 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/427c77c15_image.png';
import { useToast } from '@/components/ui/use-toast';
import { shareToInstagram } from '../../lib/shareToInstagram';

export default function ExerciseShareButton({ exercise, sessionResults, pr }) {
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

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

    // shareToInstagram navigates to instagram-stories:// BEFORE any await,
    // preserving the user gesture. No async fetches needed anymore.
    shareToInstagram({
      exerciseName: exercise.name,
      weight, reps, isPR,
      history: exercise.history,
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
      className="w-7 h-7 flex items-center justify-center rounded-lg transition flex-shrink-0 hover:opacity-80 overflow-hidden"
      aria-label="Share to Instagram"
    >
      {isSharing ? (
        <Loader2 className="w-4 h-4 text-gray-700 dark:text-gray-200 animate-spin" />
      ) : (
        <img src={INSTAGRAM_ICON_URL} alt="Share to Instagram" className="w-5 h-5 object-contain" />
      )}
    </button>
  );
}