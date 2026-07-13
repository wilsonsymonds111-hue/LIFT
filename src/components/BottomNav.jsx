import { memo } from 'react';
import { Dumbbell, Layers, PersonStanding } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNavVisibility } from '@/lib/NavContext';

const tabs = [
  { path: '/', Icon: Dumbbell, label: 'Workouts' },
  { path: '/splits', Icon: Layers, label: 'Splits' },
  { path: '/exercises', Icon: PersonStanding, label: 'Body Stats' },
];

const BottomNav = memo(function BottomNav() {
  const location = useLocation();
  const { hideNav, triggerScrollToTop } = useNavVisibility();

  if (hideNav || location.pathname.startsWith('/support-chat')) return null;

  return (
    <div
      className="fixed left-4 right-4 z-50"
      style={{ bottom: '16px' }}
    >
      <nav
        className="relative flex items-center justify-around gap-1 h-[64px] px-1.5 rounded-full overflow-hidden border border-white/60 dark:border-white/10 bg-white/55 dark:bg-neutral-900/90"
        style={{
          backdropFilter: 'blur(60px) saturate(160%)',
          WebkitBackdropFilter: 'blur(60px) saturate(160%)',
          boxShadow:
            '0 20px 60px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.10), inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(0,0,0,0.06)',
        }}
      >
        {tabs.map(({ path, Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={(e) => { if (active) { e.preventDefault(); triggerScrollToTop(); } }}
              className="relative flex-1 flex items-center justify-center h-full"
            >
              {active && (
                <motion.div
                  layoutId="navBubble"
                  className="absolute inset-y-1.5 inset-x-1 rounded-full bg-white/70 dark:bg-neutral-700 border border-white/90 dark:border-white/20"
                  transition={{ type: 'spring', stiffness: 500, damping: 38, mass: 0.7 }}
                  style={{
                    backdropFilter: 'blur(30px) saturate(180%) brightness(1.12)',
                    WebkitBackdropFilter: 'blur(30px) saturate(180%) brightness(1.12)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.14), inset 0 1px 1px rgba(255,255,255,0.8), inset 0 0 0 1px rgba(255,255,255,0.3)',
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