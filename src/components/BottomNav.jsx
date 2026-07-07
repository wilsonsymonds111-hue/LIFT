import { memo } from 'react';
import { Dumbbell, Layers, Scale } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNavVisibility } from '@/lib/NavContext';

const tabs = [
  { path: '/', Icon: Dumbbell, label: 'Workouts' },
  { path: '/splits', Icon: Layers, label: 'Splits' },
  { path: '/exercises', Icon: Scale, label: 'Body Stats' },
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
        className="relative flex items-center justify-around gap-1 h-[64px] px-1.5 rounded-full overflow-hidden border border-black/5 bg-white dark:border-white/10 dark:bg-muted"
        style={{
          backdropFilter: 'blur(30px) saturate(200%)',
          WebkitBackdropFilter: 'blur(30px) saturate(200%)',
          boxShadow:
            '0 12px 40px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.10), inset 0 0 0 1px rgba(255,255,255,0.6)',
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
                  className="absolute inset-y-1.5 inset-x-1 rounded-full bg-black/5 dark:bg-white/10"
                  transition={{ type: 'spring', stiffness: 500, damping: 38, mass: 0.7 }}
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