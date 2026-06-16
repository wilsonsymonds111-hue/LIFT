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
      <nav className="flex items-center justify-around px-5 py-3 rounded-full bg-[#1a1a1a]/90 backdrop-blur-2xl shadow-lg shadow-black/40 ring-1 ring-white/[0.06]">
        {tabs.map(({ path, label, Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`relative flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ${
                active ? 'text-white' : 'text-white/40 hover:text-white/65'
              }`}
            >
              <Icon
                className="w-[26px] h-[26px]"
                strokeWidth={active ? 2.5 : 1.4}
                fill={active ? 'currentColor' : 'none'}
              />
              {active && (
                <span className="w-[4.5px] h-[4.5px] rounded-full bg-[#ff4d4d]" />
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