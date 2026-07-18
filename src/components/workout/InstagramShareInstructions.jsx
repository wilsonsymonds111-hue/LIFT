import { X, Download, Copy, ClipboardCheck } from 'lucide-react';
import { useState } from 'react';

export default function InstagramShareInstructions({ imageUrl, onClose }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = 'workout-sticker.png';
    a.click();
  };

  const handleCopy = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
    } catch (e) {
      setCopyFailed(true);
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative bg-gray-50 rounded-3xl w-[92%] max-w-sm max-h-[88vh] flex flex-col shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <button onClick={onClose} className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition">
            <X className="w-5 h-5 text-gray-700" />
          </button>
          <span className="font-bold text-gray-900">Share to Story</span>
          <div className="w-11" />
        </div>

        {/* Preview on a dark background so transparent PNG is visible */}
        <div className="px-4 py-3 flex-shrink-0">
          <div className="rounded-2xl overflow-hidden flex justify-center" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
            <img src={imageUrl} alt="Workout sticker" className="max-h-[260px] w-auto object-contain" />
          </div>
        </div>

        {/* Step-by-step instructions */}
        <div className="px-4 pb-2 space-y-3 flex-shrink-0">
          {[
            'Tap "Copy Sticker" below to copy the transparent image',
            'Open Instagram, add a background photo to your story, then tap the text icon at the top',
            'Paste the sticker on top, position it, and post!',
          ].map((text, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {i + 1}
              </div>
              <p className="text-sm text-gray-700 pt-0.5">{text}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-4 pb-5 pt-2 flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-2xl text-sm transition active:scale-95 shadow-md"
            style={{ background: copied ? '#22c55e' : 'linear-gradient(90deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
          >
            {copied ? <><ClipboardCheck className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Sticker</>}
          </button>
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-2xl text-sm transition"
          >
            <Download className="w-4 h-4" /> Save Image
          </button>
          {copyFailed && (
            <p className="text-xs text-center text-gray-500">Copy not supported — image downloaded instead. Find it in your photos.</p>
          )}
        </div>
      </div>
    </div>
  );
}