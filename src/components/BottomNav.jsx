import { useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, Plus, Settings } from 'lucide-react';

const TAB_ROOTS = ['/', '/exercises', '/settings'];

function getTabRoot(pathname) {
  if (pathname === '/' || pathname.startsWith('/template') || pathname.startsWith('/active-workout')) return '/';
  if (pathname.startsWith('/exercises')) return '/exercises';
  if (pathname.startsWith('/settings')) return '/settings';
  return '/';
}

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Persist last visited path per tab root
  const currentRoot = getTabRoot(location.pathname);
  if (location.pathname !== currentRoot) {
    sessionStorage.setItem(`tab_stack_${currentRoot}`, location.pathname + location.search);
  }

  const tabs = [
    { path: '/', label: 'Workouts', icon: Plus },
    { path: '/exercises', label: 'Exercises', icon: Dumbbell },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleTabPress = (tab) => {
    if (getTabRoot(location.pathname) === tab.path) {
      // Already on this tab — reset to root
      navigate(tab.path, { replace: true });
    } else {
      // Restore last visited sub-page for this tab, or go to root
      const saved = sessionStorage.getItem(`tab_stack_${tab.path}`);
      navigate(saved || tab.path);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
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
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
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