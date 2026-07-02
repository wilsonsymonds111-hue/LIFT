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
        className="relative flex items-center justify-around h-[64px] px-3 rounded-full overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.18),0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.55),0_2px_12px_rgba(0,0,0,0.3)] ring-1 ring-white/50 dark:ring-white/10"
        style={{
          backgroundColor: 'rgba(242, 242, 247, 0.72)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-full dark:bg-gray-900/40"
          style={{ backgroundColor: 'rgba(255,255,255,0.35)' }}
        />
        {/* Top highlight edge */}
        <div className="pointer-events-none absolute top-0 left-4 right-4 h-px rounded-full bg-white/70 dark:bg-white/15" />
        {tabs.map(({ path, Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="flex items-center justify-center transition-all duration-200"
            >
              <div
                className={`flex items-center justify-center rounded-full transition-all duration-200 w-[54px] h-[40px] ${
                  active ? 'bg-[#e5e5ea] dark:bg-white/15' : ''
                }`}
              >
                <Icon
                  className="w-[22px] h-[22px] transition-colors duration-200"
                  style={{ color: active ? '#007aff' : '#8e8e93' }}
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