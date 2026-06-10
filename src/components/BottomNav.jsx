import { useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, Plus, Settings } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { path: '/', label: 'Workouts', icon: Plus },
    { path: '/exercises', label: 'Exercises', icon: Dumbbell },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleTabPress = (tab) => {
    // If already on this tab's root, reset to it (forces re-mount / scroll-to-top)
    if (location.pathname === tab.path) {
      navigate(tab.path, { replace: true });
    } else {
      navigate(tab.path);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex h-16 max-w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          // Mark active for the tab root and any sub-routes under it (except '/' which is exact)
          const isActive = tab.path === '/'
            ? location.pathname === '/' || location.pathname.startsWith('/template') || location.pathname.startsWith('/active-workout')
            : location.pathname.startsWith(tab.path);

          return (
            <button
              key={tab.path}
              onClick={() => handleTabPress(tab)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 select-none transition ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}