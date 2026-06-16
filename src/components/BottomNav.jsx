import { memo } from 'react';
import { Dumbbell, Layers, List } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useNavVisibility } from '@/lib/NavContext';

const tabs = [
  { path: '/', label: 'Workouts', Icon: Dumbbell },
  { path: '/splits', label: 'Splits', Icon: Layers },
  { path: '/exercises', label: 'Exercises', Icon: List },
];

const BottomNav = memo(function BottomNav() {
  const location = useLocation();
  const { hideNav } = useNavVisibility();

  if (hideNav || location.pathname.startsWith('/support-chat')) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#1C1C1E] dark:bg-[#0D0D0F] border-t border-white/10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <nav className="flex items-stretch max-w-lg mx-auto">
        {tabs.map(({ path, label, Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors duration-150 ${
                active ? 'text-blue-500' : 'text-white/50'
              }`}
            >
              <Icon
                className="w-5 h-5"
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className="text-[10px] font-semibold leading-none">
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