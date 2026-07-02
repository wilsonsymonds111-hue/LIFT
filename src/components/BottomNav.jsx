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
        className="relative flex items-center justify-around gap-1 h-[64px] px-1.5 rounded-full overflow-hidden ring-1 ring-black/[0.06] dark:ring-white/10"
        style={{
          backgroundColor: 'rgba(249, 249, 249, 0.85)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow:
            '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)',
        }}
      >
        {/* Dark mode tint */}
        <div className="pointer-events-none absolute inset-0 rounded-full dark:bg-gray-900/50 hidden dark:block" />
        {/* Top highlight edge */}
        <div className="pointer-events-none absolute top-0 left-4 right-4 h-px rounded-full bg-white/60 dark:bg-white/10" />

        {tabs.map(({ path, Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="relative flex-1 flex items-center justify-center transition-all duration-200"
            >
              <div
                className="flex items-center justify-center rounded-full transition-all duration-200 w-full h-[52px]"
                style={{
                  backgroundColor: active ? 'rgba(229, 229, 234, 1)' : 'transparent',
                }}
              >
                <Icon
                  className="w-[23px] h-[23px] transition-colors duration-200"
                  style={{ color: active ? '#007aff' : '#000000' }}
                  strokeWidth={active ? 2.2 : 1.8}
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