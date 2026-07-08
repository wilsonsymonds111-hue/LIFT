import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const CROP_SIZE = 280;
const OUTPUT_SIZE = 400;

export default function ImageCropper({ file, onCancel, onCrop }) {
  const [img, setImg] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const canvasRef = useRef(null);
  const [baseScale, setBaseScale] = useState(1);
  const pinchRef = useRef({ initialDistance: 0, initialZoom: 1 });

  // Load the image from the file
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => {
        setImg(image);
        // Fit so the smaller dimension fills the crop circle
        const scale = CROP_SIZE / Math.min(image.width, image.height);
        setBaseScale(scale);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      };
      image.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, [file]);

  const displayScale = baseScale * zoom;
  const displayW = img ? img.width * displayScale : 0;
  const displayH = img ? img.height * displayScale : 0;

  // Clamp offset so the image always covers the crop circle
  const clampOffset = useCallback((x, y) => {
    if (!img) return { x: 0, y: 0 };
    const maxX = Math.max(0, (displayW - CROP_SIZE) / 2);
    const maxY = Math.max(0, (displayH - CROP_SIZE) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, [img, displayW, displayH]);

  const handlePointerDown = (e) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = {
      x: e.clientX || e.touches?.[0]?.clientX,
      y: e.clientY || e.touches?.[0]?.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX == null) return;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    const clamped = clampOffset(
      dragStart.current.offsetX + dx,
      dragStart.current.offsetY + dy
    );
    setOffset(clamped);
  };

  const handlePointerUp = () => setDragging(false);

  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.5, Math.min(4, prev + delta)));
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const getTouchDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      pinchRef.current = {
        initialDistance: getTouchDistance(e.touches),
        initialZoom: zoom,
      };
      setDragging(false);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchRef.current.initialDistance > 0) {
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches);
      const ratio = currentDistance / pinchRef.current.initialDistance;
      setZoom(Math.max(0.5, Math.min(4, pinchRef.current.initialZoom * ratio)));
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      pinchRef.current = { initialDistance: 0, initialZoom: 1 };
    }
  };

  const handleCrop = () => {
    if (!img) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');

    // Source region in natural image coordinates
    const srcSize = CROP_SIZE / displayScale;
    const srcX = (img.width - srcSize) / 2 - offset.x / displayScale;
    const srcY = (img.height - srcSize) / 2 - offset.y / displayScale;

    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const croppedFile = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
      onCrop(croppedFile);
    }, 'image/jpeg', 0.9);
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80">
      <div
        className="bg-card rounded-2xl p-6 mx-5 max-w-sm w-full shadow-2xl border border-border"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold text-foreground">Crop Photo</h3>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Crop area */}
        <div className="flex justify-center mb-4">
          <div
            className="relative overflow-hidden rounded-full bg-black"
            style={{ width: CROP_SIZE, height: CROP_SIZE, touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {img && (
              <img
                src={img.src}
                alt="Crop preview"
                draggable={false}
                className="absolute select-none pointer-events-none"
                style={{
                  width: displayW,
                  height: displayH,
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  willChange: 'transform',
                }}
              />
            )}
            {/* Circular overlay ring */}
            <div className="absolute inset-0 rounded-full pointer-events-none ring-4 ring-white/30" />
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => handleZoom(-0.2)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-muted active:scale-95 transition"
          >
            <ZoomOut className="w-4 h-4 text-foreground" />
          </button>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.05}
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-blue-500"
          />
          <button
            onClick={() => handleZoom(0.2)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-muted active:scale-95 transition"
          >
            <ZoomIn className="w-4 h-4 text-foreground" />
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 py-2.5 rounded-xl bg-muted text-foreground font-semibold text-sm hover:bg-muted/70 transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={handleCrop}
            className="flex-[2] py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Done
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>,
    document.body
  );
}