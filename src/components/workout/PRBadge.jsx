import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

export default function PRBadge() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -20, opacity: 0 }}
      animate={{ scale: [0, 1.25, 1], rotate: [-20, 5, 0], opacity: [0, 1, 1] }}
      transition={{ type: 'spring', stiffness: 500, damping: 12, delay: 0.15 }}
      className="flex items-center gap-0.5 bg-gradient-to-b from-amber-300 to-yellow-500 text-amber-900 px-1.5 py-0.5 rounded-full border border-yellow-200/60"
      style={{ boxShadow: '0 0 12px rgba(251, 191, 36, 0.5)' }}
    >
      <Trophy className="w-3 h-3" strokeWidth={2.5} />
      <span className="text-[8px] font-extrabold leading-none tracking-tight">PR</span>
    </motion.div>
  );
}