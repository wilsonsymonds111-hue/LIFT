import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Copy, Check, ArrowRight } from 'lucide-react';
import { drawShareCard } from '@/lib/drawShareCard';

const GYM_PHOTO = 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/acb45489c_image.png';
const JAKE_AVATAR = 'https://i.pravatar.cc/150?img=12';

export default function SharePreviewModal({ shareData, onClose }) {
  const [copied, setCopied] = useState(false);
  const [closing, setClosing] = useState(false);
  const [zoomed, setZoomed] = useState(null); // null | 'overlay' | 'example'

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
    backgroundColor: '#0a0a0a',
    backgroundImage:
      'linear-gradient(45deg, #141414 25%, transparent 25%), ' +
      'linear-gradient(-45deg, #141414 25%, transparent 25%), ' +
      'linear-gradient(45deg, transparent 75%, #141414 75%), ' +
      'linear-gradient(-45deg, transparent 75%, #141414 75%)',
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
        className="fixed inset-0 z-[101] bg-white flex flex-col justify-around py-4"
        initial={{ y: '100%' }}
        animate={{ y: closing ? '100%' : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 flex-shrink-0">
          <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center -ml-2">
            <X className="w-6 h-6 text-neutral-900" />
          </button>
          <h2 className="text-neutral-900 font-bold text-base px-6 text-center leading-tight flex items-center justify-center gap-1 flex-wrap">
            <span>Share your PR on your Instagram Story!</span>
            <img
              src="https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/019005143_image.png"
              width="28"
              height="28"
              className="flex-shrink-0 rounded-[6px] -ml-0.5"
              alt="Instagram"
            />
          </h2>
          <div className="w-9" />
        </div>

        {/* Previews — overlay (left) + example on a story (right) */}
        <div className="flex items-center justify-center gap-3 px-6 flex-shrink-0">
          {/* Overlay PNG on checkered background */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => setZoomed('overlay')}
              className="relative rounded-xl overflow-hidden shadow-xl active:scale-[0.98] transition"
              style={{ height: '38vh', aspectRatio: '9 / 16', ...checkerStyle }}
            >
              <img src={transparentUrl} className="absolute inset-0 w-full h-full object-contain scale-90" alt="PR overlay" />
            </button>
            <span className="text-[10px] text-neutral-600 font-medium">Your overlay</span>
          </div>

          {/* Arrow showing before → after */}
          <ArrowRight className="w-5 h-5 text-blue-500 flex-shrink-0" />

          {/* Example: the real overlay composited onto a gym story background */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => setZoomed('example')}
              className="relative rounded-xl overflow-hidden shadow-xl active:scale-[0.98] transition"
              style={{ height: '38vh', aspectRatio: '9 / 16' }}
            >
              <img
                src={GYM_PHOTO}
                className="absolute inset-0 w-full h-full object-cover"
                alt="Gym story background"
              />
              <img
                src={transparentUrl}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[72%] w-auto object-contain"
                alt="Your overlay on a gym story"
              />
              {/* Instagram Story chrome — progress bars (thin, high) */}
              <div className="absolute top-0 left-0 right-0 flex gap-[2px] px-[6px] pt-[5px]">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`flex-1 h-[1.5px] rounded-full overflow-hidden ${i < 3 ? 'bg-white' : 'bg-white/30'}`} />
                ))}
              </div>
              {/* Profile + username (compact) */}
              <div className="absolute top-[14px] left-[6px] flex items-center gap-[4px]">
                <img src={JAKE_AVATAR} className="w-[12px] h-[12px] rounded-full object-cover ring-[1px] ring-white/90 flex-shrink-0" alt="" />
                <span className="text-white text-[6px] font-semibold leading-none drop-shadow-sm">jake.deleon</span>
                <span className="text-white/60 text-[6px] leading-none drop-shadow-sm">2h</span>
              </div>
              {/* Close (X) */}
              <div className="absolute top-[12px] right-[5px] w-[10px] h-[10px] flex items-center justify-center">
                <X className="w-[9px] h-[9px] text-white" strokeWidth={2.5} />
              </div>
            </button>
            <span className="text-[10px] text-neutral-600 font-medium">On a story</span>
          </div>
        </div>

        {/* Fullscreen zoom view */}
        {zoomed && createPortal(
          <motion.div
            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center overflow-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            onClick={() => setZoomed(null)}
          >
            <button
              onClick={() => setZoomed(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            {zoomed === 'example' ? (
            <div
              className="relative select-none rounded-xl overflow-hidden"
              style={{ height: '85vh', aspectRatio: '9 / 16' }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={GYM_PHOTO}
                className="absolute inset-0 w-full h-full object-cover"
                alt="Gym story background"
              />
              <img
                src={transparentUrl}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[72%] w-auto object-contain"
                alt="Your overlay on a gym story"
              />
              {/* Instagram Story chrome — progress bars */}
              <div className="absolute top-0 left-0 right-0 flex gap-[3px] px-3 pt-[8px]">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`flex-1 h-[2.5px] rounded-full overflow-hidden ${i < 3 ? 'bg-white' : 'bg-white/30'}`} />
                ))}
              </div>
              {/* Profile + username */}
              <div className="absolute top-[22px] left-3 flex items-center gap-[6px]">
                <img src={JAKE_AVATAR} className="w-[22px] h-[22px] rounded-full object-cover ring-[1.5px] ring-white/90 flex-shrink-0" alt="" />
                <span className="text-white text-[11px] font-semibold leading-none drop-shadow-sm">jake.deleon</span>
                <span className="text-white/60 text-[11px] leading-none drop-shadow-sm">2h</span>
              </div>
              {/* Close (X) */}
              <div className="absolute top-[20px] right-3 w-[18px] h-[18px] flex items-center justify-center">
                <X className="w-[15px] h-[15px] text-white" strokeWidth={2.5} />
              </div>
            </div>
            ) : (
              <div
                className="relative select-none overflow-hidden rounded-xl"
                style={{ ...checkerStyle, maxHeight: '90vh', aspectRatio: '9 / 16', height: '85vh' }}
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={transparentUrl}
                  className="absolute inset-0 w-full h-full object-contain"
                  alt="PR preview zoomed"
                />
              </div>
            )}
          </motion.div>,
          document.body
        )}

        {/* Instructions — Apple-quality step layout */}
        <div className="px-6 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center">1</span>
            <p className="text-[13px] text-neutral-700 leading-snug">Copy the transparent PNG overlay above.</p>
          </div>
          <div className="flex items-center gap-2.5 mt-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center">2</span>
            <p className="text-[13px] text-neutral-700 leading-snug">Open Instagram → add a photo to your story.</p>
          </div>
          <div className="flex items-center gap-2.5 mt-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center">3</span>
            <p className="text-[13px] text-neutral-700 leading-snug">Tap the text icon, then paste!</p>
          </div>
        </div>

        {/* Actions */}
        <div
          className="px-6 flex-shrink-0"
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