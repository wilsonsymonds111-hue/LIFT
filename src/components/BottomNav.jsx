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
      style={{ bottom: `calc(6px + env(safe-area-inset-bottom))` }}
    >
      <nav className="flex items-center justify-around h-[50px] px-2 rounded-full bg-foreground/85 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.30)] ring-1 ring-primary/20">
        {tabs.map(({ path, Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center justify-center transition-all duration-200 ${
                active
                  ? 'bg-primary/25 rounded-full w-[62px] h-[34px]'
                  : 'w-[62px] h-[34px]'
              }`}
            >
              <Icon
                className={`transition-all duration-200 ${
                  active
                    ? 'w-[24px] h-[24px] text-background'
                    : 'w-[24px] h-[24px] text-background/45'
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