import { memo } from 'react';
import { Dumbbell, Layers, List } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useNavVisibility } from '@/lib/NavContext';

const tabs = [
  { path: '/', Icon: Dumbbell, label: 'Workouts' },
  { path: '/splits', Icon: Layers, label: 'Splits' },
  { path: '/exercises', Icon: List, label: 'Exercises' },
];

const BottomNav = memo(function BottomNav() {
  const location = useLocation();
  const { hideNav } = useNavVisibility();

  if (hideNav || location.pathname.startsWith('/support-chat')) return null;

  return (
    <div
      className="fixed left-4 right-4 z-50"
      style={{ bottom: 'calc(8px + env(safe-area-inset-bottom))' }}
    >
      <nav
        className="relative flex items-center justify-around h-[64px] px-3 rounded-full overflow-hidden shadow-[0_12px_48px_rgba(0,0,0,0.22),0_4px_16px_rgba(0,0,0,0.10)] dark:shadow-[0_12px_48px_rgba(0,0,0,0.6),0_4px_16px_rgba(0,0,0,0.3)] ring-1 ring-white/60 dark:ring-white/10 bg-white/65 dark:bg-gray-800/50"
        style={{ backdropFilter: 'blur(35px) saturate(200%)', WebkitBackdropFilter: 'blur(35px) saturate(200%)' }}
      >
        {/* Glossy sheen overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/50 via-transparent to-white/10 dark:from-white/10 dark:to-transparent" />
        {/* Top highlight edge */}
        <div className="pointer-events-none absolute top-0 left-3 right-3 h-px rounded-full bg-white/80 dark:bg-white/20" />
        {tabs.map(({ path, Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="flex items-center justify-center transition-all duration-200"
            >
              <div
                className={`flex items-center justify-center rounded-full transition-all duration-200 w-[56px] h-[40px] ${
                  active
                    ? 'bg-black/[0.08] dark:bg-white/[0.14]'
                    : ''
                }`}
              >
                <Icon
                  className={`transition-all duration-200 w-[22px] h-[22px] ${
                    active
                      ? 'text-black dark:text-white'
                      : 'text-black/60 dark:text-white/45'
                  }`}
                  strokeWidth={active ? 2.2 : 1.6}
                />
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
});

export default BottomNav;