import { Dumbbell, Layers } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/', label: 'Workouts', Icon: Dumbbell },
  { path: '/splits', label: 'Splits', Icon: Layers },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-5" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
      <nav className="flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-gradient-to-b from-white/80 to-white/40 dark:from-white/15 dark:to-white/5 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.3)_inset,0_0_24px_rgba(59,130,246,0.15)]">
        {tabs.map(({ path, label, Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="relative flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 active:scale-95"
            >
              {active && (
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
                              )}
              <Icon
                className={`w-4 h-4 relative z-10 transition-colors duration-200 ${
                  active ? 'text-white' : 'text-muted-foreground'
                }`}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span
                className={`text-xs font-semibold relative z-10 transition-colors duration-200 ${
                  active ? 'text-white' : 'text-muted-foreground'
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