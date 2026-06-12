import { Link, useLocation } from 'react-router-dom';
import { Dumbbell, Clock, UserCircle } from 'lucide-react';

const TABS = [
  { path: '/', label: 'Workouts', icon: Dumbbell },
  { path: '/history', label: 'History', icon: Clock },
  { path: '/profile', label: 'Profile', icon: UserCircle },
];

export default function BottomNav({ profilePhoto }) {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border flex"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ path, label, icon: Icon }) => {
        const active = pathname === path;
        return (
          <Link
            key={path}
            to={path}
            className={`flex-1 flex flex-col items-center justify-center pt-2 pb-1 gap-0.5 transition-colors ${
              active ? 'text-blue-500' : 'text-muted-foreground'
            }`}
          >
            {path === '/profile' && profilePhoto ? (
              <div className={`w-6 h-6 rounded-full overflow-hidden border-2 transition-all ${active ? 'border-blue-500' : 'border-muted-foreground'}`}>
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              </div>
            ) : (
              <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 1.8} />
            )}
            <span className={`text-[10px] font-semibold ${active ? 'text-blue-500' : 'text-muted-foreground'}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}