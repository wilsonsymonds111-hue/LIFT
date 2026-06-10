import { Link, useLocation } from 'react-router-dom';
import { Dumbbell, Plus, Settings } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();

  const tabs = [
    { path: '/', label: 'Workouts', icon: Plus },
    { path: '/exercises', label: 'Exercises', icon: Dumbbell },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex h-16 max-w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex-1 flex flex-col items-center justify-center gap-1 select-none transition ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}