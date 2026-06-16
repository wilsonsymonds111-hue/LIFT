import { Dumbbell, Layers } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useNavVisibility } from '@/lib/NavContext';

const tabs = [
  { path: '/', label: 'Workouts', Icon: Dumbbell },
  { path: '/splits', label: 'Splits', Icon: Layers },
];

export default function BottomNav() {
  const location = useLocation();
  const { hideNav } = useNavVisibility();

  if (hideNav || location.pathname.startsWith('/support-chat')) return null;

  const isWorkouts = location.pathname === '/';
  const isSplits = location.pathname === '/splits';

  return (
    <div
      className="fixed bottom-0 left-0 z-50 flex pl-4"
      style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
    >
      <nav className={`flex items-center gap-0.5 px-1.5 py-1.5 rounded-full backdrop-blur-2xl border border-white/30 dark:border-white/15 transition-colors duration-300 ${
        isWorkouts
          ? 'bg-white/30 dark:bg-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]'
          : isSplits
            ? 'bg-white/20 dark:bg-white/8 shadow-[0_4px_20px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.08)]'
            : 'bg-white/20 dark:bg-white/8 shadow-[0_4px_20px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.08)]'
      }`}>
        {tabs.map(({ path, label, Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 active:scale-95"
            >
              {active && (
                <div className="absolute inset-0 rounded-full bg-blue-500/90 shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
              )}
              <Icon
                className={`w-4 h-4 relative z-10 transition-colors duration-200 ${
                  active ? 'text-white' : 'text-foreground/55 dark:text-white/55'
                }`}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span
                className={`text-xs font-semibold relative z-10 transition-colors duration-200 ${
                  active ? 'text-white' : 'text-foreground/55 dark:text-white/55'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}