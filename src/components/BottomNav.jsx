import { memo } from 'react';
import { Dumbbell, ArrowLeftRight, List } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useNavVisibility } from '@/lib/NavContext';

const tabs = [
  { path: '/', label: 'Workouts', Icon: Dumbbell },
  { path: '/splits', label: 'Splits', Icon: ArrowLeftRight },
  { path: '/exercises', label: 'Exercises', Icon: List },
];

const BottomNav = memo(function BottomNav() {
  const location = useLocation();
  const { hideNav } = useNavVisibility();

  if (hideNav || location.pathname.startsWith('/support-chat')) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50"
      style={{ bottom: `calc(8px + env(safe-area-inset-bottom))` }}
    >
      <nav className="flex items-center gap-0 px-2 py-2.5 rounded-2xl bg-black/85 backdrop-blur-xl shadow-lg shadow-black/30 ring-1 ring-white/[0.08]">
        {tabs.map(({ path, label, Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`relative flex flex-col items-center justify-center gap-1 px-5 py-1 rounded-xl transition-all duration-200 ${
                active ? 'text-white' : 'text-white/35 hover:text-white/60'
              }`}
            >
              <Icon
                className="w-5 h-5"
                strokeWidth={active ? 2.5 : 1.5}
              />
              {/* Active dot indicator */}
              {active && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400" />
              )}
              <span className="text-[10px] font-medium leading-none">
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