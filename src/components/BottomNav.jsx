import { memo } from 'react';
import { Dumbbell, Layers } from 'lucide-react';
import PersonIcon from './PersonIcon';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNavVisibility } from '@/lib/NavContext';

const tabs = [
  { path: '/', Icon: Dumbbell, label: 'Workouts' },
  { path: '/splits', Icon: Layers, label: 'Splits' },
  { path: '/exercises', Icon: PersonIcon, label: 'Body Stats' },
];

const BottomNav = memo(function BottomNav() {
  const location = useLocation();
  const { hideNav } = useNavVisibility();

  if (hideNav || location.pathname.startsWith('/support-chat')) return null;

  return (
    <div
      className="fixed left-4 right-4 z-50"
      style={{ bottom: '16px' }}
    >
      <nav
        className="relative flex items-center justify-around gap-1 h-[64px] px-1.5 rounded-full overflow-hidden border border-white/40 bg-white/50 dark:border-white/10 dark:bg-muted/40"
        style={{
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          boxShadow:
            '0 16px 50px rgba(0,0,0,0.30), 0 6px 16px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(255,255,255,0.5)',
        }}
      >
        {tabs.map(({ path, Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="relative flex-1 flex items-center justify-center h-full"
            >
              {active && (
                <motion.div
                  layoutId="navBubble"
                  className="absolute inset-y-1.5 inset-x-1 rounded-full bg-white/60 dark:bg-white/15 border border-white/80 dark:border-white/20"
                  transition={{ type: 'spring', stiffness: 500, damping: 38, mass: 0.7 }}
                  style={{
                    backdropFilter: 'blur(12px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.8)',
                  }}
                />
              )}
              <Icon
                className="relative z-10 w-[23px] h-[23px] transition-colors duration-200 text-foreground"
                strokeWidth={active ? 2.2 : 1.8}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
});

export default BottomNav;