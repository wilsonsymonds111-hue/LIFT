import { memo } from 'react';
import { Dumbbell, Shuffle, BookOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useNavVisibility } from '@/lib/NavContext';

const tabs = [
  { path: '/', label: 'Workouts', Icon: Dumbbell },
  { path: '/splits', label: 'Splits', Icon: Shuffle },
  { path: '/exercises', label: 'Exercises', Icon: BookOpen },
];

const BottomNav = memo(function BottomNav() {
  const location = useLocation();
  const { hideNav } = useNavVisibility();

  if (hideNav || location.pathname.startsWith('/support-chat')) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50"
      style={{ bottom: `calc(12px + env(safe-area-inset-bottom))` }}
    >
      <nav className="flex items-center gap-0 px-1.5 py-3 rounded-2xl bg-white/75 dark:bg-white/[0.07] backdrop-blur-xl shadow-lg shadow-black/[0.06] dark:shadow-black/30 ring-1 ring-black/[0.06] dark:ring-white/[0.08]">
        {tabs.map(({ path, label, Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`relative flex flex-col items-center justify-center gap-1 px-5 py-1 rounded-xl transition-all duration-200 ${
                active
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground/70'
              }`}
            >
              {/* Active glow indicator */}
              {active && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-7 h-[2.5px] rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
              )}
              <Icon
                className="w-5 h-5"
                strokeWidth={active ? 2.3 : 1.7}
              />
              <span className="text-[11px] font-semibold leading-none">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
});

export default BottomNav;