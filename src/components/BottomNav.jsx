import { memo } from 'react';
import { Dumbbell, ArrowLeftRight, List } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useNavVisibility } from '@/lib/NavContext';

const tabs = [
  { path: '/', Icon: Dumbbell },
  { path: '/splits', Icon: ArrowLeftRight },
  { path: '/exercises', Icon: List },
];

const BottomNav = memo(function BottomNav() {
  const location = useLocation();
  const { hideNav } = useNavVisibility();

  if (hideNav || location.pathname.startsWith('/support-chat')) return null;

  return (
    <div
      className="fixed left-3 right-3 z-50"
      style={{ bottom: `calc(6px + env(safe-area-inset-bottom))` }}
    >
      <nav className="flex items-center justify-around h-[50px] px-2 rounded-full bg-[#191919]/90 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.05]">
        {tabs.map(({ path, Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center justify-center transition-all duration-200 ${
                active
                  ? 'bg-white/[0.14] rounded-full w-[62px] h-[34px]'
                  : 'w-[62px] h-[34px]'
              }`}
            >
              <Icon
                className={`transition-all duration-200 ${
                  active
                    ? 'w-[24px] h-[24px] text-white'
                    : 'w-[24px] h-[24px] text-white/45'
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