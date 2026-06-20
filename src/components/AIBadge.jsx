import { Sparkles } from 'lucide-react';

export default function AIBadge({ label = 'AI-generated', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 ${className}`}>
      <Sparkles className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}