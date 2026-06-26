import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function RestDayPromptModal({ onConfirm, onCancel }) {
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="bg-card rounded-2xl p-6 mx-5 max-w-sm w-full shadow-2xl border border-border"
        >
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
          </div>
          <h3 className="text-lg font-extrabold text-foreground text-center">Rest Day Workout</h3>
          <p className="text-sm text-muted-foreground text-center mt-2 mb-6">
            You completed a workout on a scheduled rest day. Would you like to adjust your rest day frequency so today counts as a workout day?
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={onConfirm}
              className="w-full py-3 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 transition"
            >
              Yes, change my rest frequency schedule
            </button>
            <button
              onClick={onCancel}
              className="w-full py-3 rounded-xl bg-muted text-foreground font-semibold text-sm hover:bg-muted/70 transition"
            >
              No, stick to my current schedule
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}