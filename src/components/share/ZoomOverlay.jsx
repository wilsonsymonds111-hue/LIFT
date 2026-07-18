import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { X } from 'lucide-react';

const GYM_PHOTO = 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/acb45489c_image.png';
const JAKE_AVATAR = 'https://media.base44.com/images/public/6a16b583ab0ebad6332038a3/6d1143193_generated_image.png';

export default function ZoomOverlay({ zoomed, transparentUrl, checkerStyle, onClose }) {
  const [closing, setClosing] = useState(false);
  const y = useMotionValue(0);
  const bgOpacity = useTransform(y, [0, 400], [1, 0], { clamp: true });
  const dragStartY = useRef(null);

  const dismiss = () => {
    if (closing) return;
    setClosing(true);
    onClose();
  };

  const handleDragEnd = (_, info) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      dismiss();
    } else {
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 35 });
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center overflow-hidden"
      style={{ opacity: bgOpacity }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Draggable content — drag down to dismiss */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.6}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="relative select-none cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button — onPointerDown for reliable iOS taps */}
        <button
          type="button"
          onPointerDown={(e) => { e.stopPropagation(); dismiss(); }}
          className="absolute -top-12 right-0 z-20 w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center"
          style={{ touchAction: 'manipulation' }}
        >
          <X className="w-5 h-5 text-white" strokeWidth={2.5} />
        </button>

        {zoomed === 'example' ? (
          <div
            className="relative rounded-xl overflow-hidden"
            style={{ height: '80vh', aspectRatio: '9 / 16' }}
          >
            <img src={GYM_PHOTO} className="absolute inset-0 w-full h-full object-cover" alt="Gym story background" />
            <img src={transparentUrl} className="absolute inset-0 w-full h-full object-contain object-bottom scale-90 origin-bottom" alt="Your overlay on a gym story" />
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
          </div>
        ) : (
          <div
            className="relative overflow-hidden rounded-xl"
            style={{ ...checkerStyle, height: '80vh', aspectRatio: '9 / 16' }}
          >
            <img src={transparentUrl} className="absolute inset-0 w-full h-full object-contain" alt="PR preview zoomed" />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}