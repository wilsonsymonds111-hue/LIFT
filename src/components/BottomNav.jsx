import { memo } from 'react';
import { Dumbbell, Layers, List } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useNavVisibility } from '@/lib/NavContext';

const tabs = [
  { path: '/', Icon: Dumbbell },
  { path: '/splits', Icon: Layers },
  { path: '/exercises', Icon: List },
];

const BottomNav = memo(function BottomNav() {
  const location = useLocation();
  const { hideNav } = useNavVisibility();

  if (hideNav || location.pathname.startsWith('/support-chat')) return null;

  return (
    <div
      className="fixed left-3 right-3 z-50"
      style={{ bottom: '0px' }}
    >
      <nav className="relative flex items-center justify-around h-[50px] px-2 rounded-full overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] ring-1 ring-white/60 dark:ring-white/10 bg-white/50 dark:bg-gray-800/40" style={{ backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}>
        {/* Glossy sheen overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/40 via-transparent to-white/10 dark:from-white/10 dark:to-transparent" />
        {/* Top highlight edge */}
        <div className="pointer-events-none absolute top-0 left-2 right-2 h-px rounded-full bg-white/70 dark:bg-white/20" />
        {tabs.map(({ path, Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center justify-center transition-all duration-200 ${
                active
                  ? 'bg-black/[0.10] dark:bg-white/[0.14] rounded-full w-[62px] h-[34px]'
                  : 'w-[62px] h-[34px]'
              }`}
            >
              <Icon
                className={`transition-all duration-200 ${
                  active
                    ? 'w-[24px] h-[24px] text-gray-900 dark:text-white'
                    : 'w-[24px] h-[24px] text-gray-500 dark:text-white/45'
                }`}
                strokeWidth={active ? 2.5 : 1.5}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
});

export default BottomNav;