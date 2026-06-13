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
      <nav className="flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-black/30 backdrop-blur-xl border border-white/15 shadow-lg shadow-black/20 dark:bg-black/30 bg-white/40">
        {tabs.map(({ path, label, Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="relative flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 active:scale-95"
            >
              {active && (
                <div className="absolute inset-0 rounded-full bg-blue-500" />
              )}
              <Icon
                className={`w-4 h-4 relative z-10 transition-colors duration-200 ${
                  active ? 'text-white' : 'text-white/60'
                }`}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span
                className={`text-xs font-semibold relative z-10 transition-colors duration-200 ${
                  active ? 'text-white' : 'text-white/60'
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