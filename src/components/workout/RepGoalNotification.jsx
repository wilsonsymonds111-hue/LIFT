import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp } from 'lucide-react';

export default function RepGoalNotification({ message, onDismiss }) {
  const [visible, setVisible] = useState(true);
  const dragYRef = useRef(0);
  const [dragY, setDragY] = useState(0);
  const draggingRef = useRef(false);
  const startYRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => handleClose(), 6000);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onDismiss?.(), 250);
  };

  const onPointerDown = (e) => {
    startYRef.current = e.clientY;
    draggingRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!draggingRef.current || startYRef.current === null) return;
    const delta = Math.min(0, e.clientY - startYRef.current);
    dragYRef.current = delta;
    setDragY(delta);
  };
  const onPointerUp = () => {
    if (dragYRef.current < -40) {
      handleClose();
    } else {
      setDragY(0);
    }
    draggingRef.current = false;
    startYRef.current = null;
  };

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[70] flex justify-center px-4 pt-2"
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)' }}
        >
          <div
            className="relative w-full max-w-sm bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 touch-none cursor-grab active:cursor-grabbing"
            style={{ transform: dragY !== 0 ? `translateY(${dragY}px)` : undefined, transition: draggingRef.current ? 'none' : 'transform 0.2s ease' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium leading-snug flex-1">{message}</p>
            <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition flex-shrink-0">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}