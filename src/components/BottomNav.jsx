import { Dumbbell, Columns } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/', label: 'Workouts', Icon: Dumbbell },
  { path: '/splits', label: 'Splits', Icon: Columns },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-xl border-t border-border/60 safe-bottom">
      <div className="flex items-center justify-center max-w-lg mx-auto gap-2 px-4 py-1.5">
        {tabs.map(({ path, label, Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="relative flex flex-col items-center justify-center gap-0.5 py-2 px-8 rounded-2xl transition-all duration-200 active:scale-95"
            >
              <div
                className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                  active
                    ? 'bg-blue-500/10 scale-100'
                    : 'bg-transparent scale-75'
                }`}
              />
              <Icon
                className={`w-5 h-5 relative z-10 transition-colors duration-200 ${
                  active ? 'text-blue-500' : 'text-muted-foreground'
                }`}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] font-semibold relative z-10 transition-colors duration-200 ${
                  active ? 'text-blue-500' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}