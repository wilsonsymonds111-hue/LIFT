import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, RotateCcw } from 'lucide-react';

const CROP_SIZE = 260;
const OUTPUT_SIZE = 400;

export default function ImageCropper({ file, onCancel, onCrop }) {
  const [img, setImg] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const draggingRef = useRef(false);
  const canvasRef = useRef(null);
  const [baseScale, setBaseScale] = useState(1);
  const pinchRef = useRef({ initialDistance: 0, initialZoom: 1 });

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => {
        setImg(image);
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
    if (e.isPrimary === false) return;
    e.preventDefault();
    draggingRef.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current || e.isPrimary === false) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const clamped = clampOffset(
      dragStart.current.offsetX + dx,
      dragStart.current.offsetY + dy
    );
    setOffset(clamped);
  };

  const handlePointerUp = () => { draggingRef.current = false; };

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
      draggingRef.current = false;
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

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleCrop = () => {
    if (!img) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');

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

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <p className="text-sm font-semibold text-muted-foreground text-center">
        Pinch to zoom · Drag to reposition
      </p>

      <div
        className="relative overflow-hidden rounded-full bg-black"
        style={{ width: CROP_SIZE, height: CROP_SIZE, touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
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
        <div className="absolute inset-0 rounded-full pointer-events-none ring-4 ring-white/30" />
      </div>

      <div className="flex gap-3 w-full">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl bg-muted text-foreground font-semibold text-sm hover:bg-muted/70 transition flex items-center justify-center gap-1.5"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
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
  );
}