import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Check, Download, MessageCircle } from 'lucide-react';
import { drawShareCard } from '@/lib/drawShareCard';

export default function SharePreviewModal({ shareData, onClose }) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 300);
  };

  const handleShareViaText = async () => {
    setSharing(true);
    try {
      const cardCanvas = drawShareCard({ ...shareData, mode: 'card' });
      const blob = await new Promise(resolve => cardCanvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], 'lift-pr.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const link = document.createElement('a');
        link.href = cardCanvas.toDataURL('image/png');
        link.download = 'lift-pr.png';
        link.click();
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
    } finally {
      setSharing(false);
      setTimeout(() => handleClose(), 600);
    }
  };

  const { transparentUrl, transparentCanvas } = useMemo(() => {
    const canvas = drawShareCard({ ...shareData, mode: 'transparent' });
    return { transparentCanvas: canvas, transparentUrl: canvas.toDataURL('image/png') };
  }, [shareData]);

  const handleCopyTransparent = async () => {
    try {
      const blob = await new Promise(resolve => transparentCanvas.toBlob(resolve, 'image/png'));
      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => handleClose(), 800);
      } else {
        const link = document.createElement('a');
        link.href = transparentUrl;
        link.download = 'lift-pr.png';
        link.click();
        setTimeout(() => handleClose(), 800);
      }
    } catch (e) {
      const link = document.createElement('a');
      link.href = transparentUrl;
      link.download = 'lift-pr.png';
      link.click();
      setTimeout(() => handleClose(), 800);
    }
  };

  const checkerStyle = {
    backgroundColor: '#2a2a2a',
    backgroundImage:
      'linear-gradient(45deg, #333 25%, transparent 25%), ' +
      'linear-gradient(-45deg, #333 25%, transparent 25%), ' +
      'linear-gradient(45deg, transparent 75%, #333 75%), ' +
      'linear-gradient(-45deg, transparent 75%, #333 75%)',
    backgroundSize: '24px 24px',
    backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
  };

  return (
    <>
      {/* Dimmed backdrop */}
      <motion.div
        className="fixed inset-0 z-[60] bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: closing ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        onClick={handleClose}
      />
      {/* Bottom sheet — 80% of screen height */}
      <motion.div
        className="fixed left-0 right-0 bottom-0 z-[60] bg-black flex flex-col rounded-t-3xl"
        style={{ height: '80vh' }}
        initial={{ y: '100%' }}
        animate={{ y: closing ? '100%' : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2 pt-3 flex-shrink-0">
          <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center -ml-2">
            <X className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-white font-bold text-lg">Share Your PR!</h2>
          <div className="w-9" />
        </div>

        {/* Preview — transparent PNG on checkered background */}
        <div className="flex-1 flex items-center justify-center px-6 py-2 min-h-0">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={checkerStyle}>
            <img src={transparentUrl} className="block max-h-full max-w-full" alt="PR share preview" style={{ maxHeight: '38vh' }} />
            <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded tracking-widest">
              TRANSPARENT
            </div>
          </div>
        </div>

        {/* Instagram instructions */}
        <div className="px-6 py-2 flex-shrink-0">
          <p className="text-xs text-neutral-400 leading-relaxed text-center">
            Copy the transparent PNG, then open Instagram → add a photo to your story → paste the sticker on top.
          </p>
        </div>

        {/* Actions */}
        <div
          className="px-6 pt-1 pb-5 space-y-2.5 flex-shrink-0"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
        >
          <button
            onClick={handleCopyTransparent}
            className="w-full py-3.5 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            {copied
              ? <><Check className="w-5 h-5" /> Copied to Clipboard!</>
              : <><Copy className="w-5 h-5" /> Copy Transparent PNG</>}
          </button>
          <button
            onClick={handleShareViaText}
            disabled={sharing}
            className="w-full py-3.5 bg-neutral-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 border border-neutral-700 active:scale-[0.98] transition disabled:opacity-50"
          >
            {sharing
              ? <><Download className="w-5 h-5 animate-pulse" /> Preparing…</>
              : <><MessageCircle className="w-5 h-5" /> Share via Text</>}
          </button>
        </div>
      </motion.div>
    </>
  );
}