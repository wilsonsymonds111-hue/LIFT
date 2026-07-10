import { useState, useRef, useMemo, useCallback } from 'react';
import { Share2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import ShareTemplate from './ShareTemplate';
import { shareToInstagram } from '../../lib/shareToInstagram';

export default function ExerciseShareButton({ exercise, sessionResults, pr }) {
  const [isSharing, setIsSharing] = useState(false);
  const [bodyweight, setBodyweight] = useState(null);
  const templateRef = useRef(null);
  const { toast } = useToast();

  const shareData = useMemo(() => {
    const toKg = (h) => typeof h === 'object' ? (h.kg || 0) : (h || 0);
    const toReps = (h) => typeof h === 'object' ? (h.reps || 8) : 8;

    // Best set from current session, or all-time PR
    const bestSet = sessionResults.length > 0
      ? sessionResults.reduce((best, s) => (toKg(s) > toKg(best) ? s : best), sessionResults[0])
      : pr;

    const weight = bestSet ? toKg(bestSet) : 0;
    const reps = bestSet ? toReps(bestSet) : 0;

    // Is it a PR? (current session best matches/exceeds all-time PR)
    const isPR = sessionResults.length > 0 && pr && !pr.bodyweight && weight >= pr.kg && weight > 0;

    const ratio = bodyweight && bodyweight > 0 && weight > 0 ? weight / bodyweight : null;

    return { exerciseName: exercise.name, weight, reps, ratio, history: exercise.history, isPR };
  }, [exercise, sessionResults, pr, bodyweight]);

  const handleShare = useCallback(async () => {
    setIsSharing(true);
    setBodyweight(null);

    try {
      // Fetch latest bodyweight
      try {
        const weights = await base44.entities.BodyWeight.list('-date', 1);
        if (weights[0]?.weight) setBodyweight(weights[0].weight);
      } catch {}

      // Wait for template to render with bodyweight data
      await new Promise(r => setTimeout(r, 400));

      if (!templateRef.current) {
        toast({ title: 'Share failed', description: 'Could not generate share image. Please try again.', variant: 'destructive' });
        return;
      }

      const result = await shareToInstagram(templateRef.current);

      if (result?.cancelled) return; // user dismissed the share sheet

      if (result?.shared) {
        toast({ title: 'Shared!', description: 'Your workout stats have been shared.' });
      } else if (result?.fallback === 'download') {
        toast({ title: 'Image saved', description: 'Share image downloaded to your device.' });
      }
    } catch (e) {
      console.error('Share failed:', e);
      toast({ title: 'Share failed', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setIsSharing(false);
      setBodyweight(null);
    }
  }, [toast]);

  return (
    <>
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

      {/* Off-screen template for html2canvas capture */}
      {isSharing && (
        <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none', opacity: 1 }}>
          <ShareTemplate ref={templateRef} {...shareData} bodyweight={bodyweight} />
        </div>
      )}
    </>
  );
}