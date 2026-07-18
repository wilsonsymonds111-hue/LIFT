import { useState, useMemo } from 'react';
import { X, Copy, Share2, Check, Download } from 'lucide-react';
import { drawShareCard } from '@/lib/drawShareCard';

export default function SharePreviewModal({ shareData, onClose }) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

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
        setTimeout(() => setCopied(false), 2500);
      } else {
        const link = document.createElement('a');
        link.href = transparentUrl;
        link.download = 'lift-pr.png';
        link.click();
      }
    } catch (e) {
      const link = document.createElement('a');
      link.href = transparentUrl;
      link.download = 'lift-pr.png';
      link.click();
    }
  };

  const handleShareCard = async () => {
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
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pb-2 relative z-10"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center -ml-2">
          <X className="w-6 h-6 text-white" />
        </button>
        <h2 className="text-white font-bold text-lg">Share PR</h2>
        <div className="w-10" />
      </div>

      {/* Preview — transparent PNG on checkered background */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-0">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={checkerStyle}>
          <img src={transparentUrl} className="block max-h-full max-w-full" alt="PR share preview" style={{ maxHeight: '55vh' }} />
          <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded tracking-widest">
            TRANSPARENT
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        className="p-6 space-y-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
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
          onClick={handleShareCard}
          disabled={sharing}
          className="w-full py-3.5 bg-neutral-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 border border-neutral-700 active:scale-[0.98] transition disabled:opacity-50"
        >
          {sharing
            ? <><Download className="w-5 h-5 animate-pulse" /> Preparing…</>
            : <><Share2 className="w-5 h-5" /> Share as Card</>}
        </button>
      </div>
    </div>
  );
}