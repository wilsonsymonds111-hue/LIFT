import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Image as ImageIcon, Share2, Loader2, Trash2 } from 'lucide-react';
import { drawShareCard } from '../../lib/drawShareCard';
import { shareToInstagram } from '../../lib/shareToInstagram';
import { useToast } from '@/components/ui/use-toast';

export default function StoryShareSheet({ exercise, sessionResults, pr, exerciseImage, onClose }) {
  const [backgroundPhoto, setBackgroundPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const shareData = useMemo(() => {
    const toKg = (h) => typeof h === 'object' ? (h.kg || 0) : (h || 0);
    const toReps = (h) => typeof h === 'object' ? (h.reps || 8) : 8;
    const bestSet = sessionResults.length > 0
      ? sessionResults.reduce((best, s) => (toKg(s) > toKg(best) ? s : best), sessionResults[0])
      : pr;
    const weight = bestSet ? toKg(bestSet) : 0;
    const reps = bestSet ? toReps(bestSet) : 0;
    const isPR = sessionResults.length > 0 && pr && !pr.bodyweight && weight >= pr.kg && weight > 0;
    return {
      exerciseName: exercise.name,
      weight, reps, isPR,
      history: exercise.history,
      sessionResults,
    };
  }, [exercise, sessionResults, pr]);

  // Live preview — redraws whenever data or photo changes
  useEffect(() => {
    try {
      const canvas = drawShareCard({ ...shareData, backgroundPhoto });
      setPreviewUrl(canvas.toDataURL('image/jpeg', 0.8));
    } catch (e) {
      console.error('Preview failed:', e);
    }
  }, [shareData, backgroundPhoto]);

  const handlePhotoSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setBackgroundPhoto(img);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast({ title: 'Could not load photo', variant: 'destructive' });
    };
    img.src = url;
    e.target.value = '';
  }, [toast]);

  const handleShare = useCallback(() => {
    setIsSharing(true);
    shareToInstagram({ ...shareData, backgroundPhoto })
      .then(result => {
        if (result?.cancelled) return;
        if (result?.shared) {
          toast({ title: 'Shared!', description: 'Your workout stats have been shared.' });
          onClose();
        } else if (result?.fallback === 'download') {
          toast({ title: 'Image saved', description: 'Share image downloaded to your device.' });
          onClose();
        }
      })
      .catch(() => {
        toast({ title: 'Share failed', description: 'Something went wrong. Please try again.', variant: 'destructive' });
      })
      .finally(() => setIsSharing(false));
  }, [shareData, backgroundPhoto, toast, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 38 }}
        className="w-full max-w-md bg-neutral-950 rounded-t-3xl p-5 pb-8 max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 rounded-full bg-white/20 mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">Share to Story</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="flex justify-center mb-5">
          {previewUrl ? (
            <img src={previewUrl} alt="Story preview" className="h-80 rounded-2xl shadow-2xl" />
          ) : (
            <div className="h-80 w-44 rounded-2xl bg-white/5 animate-pulse" />
          )}
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 bg-white/10 active:bg-white/15 text-white font-semibold rounded-xl flex items-center justify-center gap-2 mb-2 transition"
        >
          <ImageIcon className="w-5 h-5" />
          {backgroundPhoto ? 'Change Background Photo' : 'Add Background Photo'}
        </button>
        {backgroundPhoto && (
          <button
            onClick={() => setBackgroundPhoto(null)}
            className="w-full py-2 text-white/40 text-sm flex items-center justify-center gap-1.5 mb-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove Photo
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />

        <button
          onClick={handleShare}
          disabled={isSharing}
          className="w-full py-3.5 bg-[#D4B483] active:bg-[#C9A961] text-black font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {isSharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
          Share to Instagram Story
        </button>

        <p className="text-center text-white/30 text-xs mt-3">
          {backgroundPhoto ? 'Your photo will be the background' : 'Clean gradient will be used — no photo needed'}
        </p>
      </motion.div>
    </motion.div>
  );
}