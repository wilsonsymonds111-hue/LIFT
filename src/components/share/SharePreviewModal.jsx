import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Copy, Check } from 'lucide-react';
import { drawShareCard } from '@/lib/drawShareCard';

export default function SharePreviewModal({ shareData, onClose }) {
  const [copied, setCopied] = useState(false);
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 300);
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

  return createPortal(
    <>
      {/* Dimmed backdrop */}
      <motion.div
        className="fixed inset-0 z-[100] bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: closing ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        onClick={handleClose}
      />
      {/* Full-screen sheet — extends to the very top, over the nav bar */}
      <motion.div
        className="fixed inset-0 z-[101] bg-black flex flex-col"
        initial={{ y: '100%' }}
        animate={{ y: closing ? '100%' : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-3 flex-shrink-0">
          <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center -ml-2">
            <X className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-white font-bold text-base px-6 text-center leading-tight">Share your PR on your Instagram Story!</h2>
          <div className="w-9" />
        </div>

        {/* Preview — transparent PNG on checkered background */}
        <div className="flex-1 flex items-center justify-center px-6 min-h-0">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={checkerStyle}>
            <img src={transparentUrl} className="block max-h-full max-w-full" alt="PR share preview" style={{ maxHeight: '45vh' }} />
          </div>
        </div>

        {/* Instructions — Apple-quality step layout */}
        <div className="px-6 py-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-700 text-white text-[10px] font-bold flex items-center justify-center">1</span>
            <p className="text-[13px] text-neutral-300 leading-snug">Copy the transparent PNG overlay above.</p>
          </div>
          <div className="flex items-center gap-2.5 mt-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-700 text-white text-[10px] font-bold flex items-center justify-center">2</span>
            <p className="text-[13px] text-neutral-300 leading-snug">Open Instagram → add a photo to your story.</p>
          </div>
          <div className="flex items-center gap-2.5 mt-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-700 text-white text-[10px] font-bold flex items-center justify-center">3</span>
            <p className="text-[13px] text-neutral-300 leading-snug">Tap the text icon, then paste!</p>
          </div>
        </div>

        {/* Actions */}
        <div
          className="px-6 pt-3 pb-5 space-y-2 flex-shrink-0"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
        >
          <button
            onClick={handleCopyTransparent}
            className="mx-auto py-2 px-5 bg-blue-500 text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            {copied
              ? <><Check className="w-4 h-4" /> Copied!</>
              : <><Copy className="w-4 h-4" /> Copy overlay</>}
          </button>
        </div>
      </motion.div>
    </>,
    document.body
  );
}