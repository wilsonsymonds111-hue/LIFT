import { memo } from 'react';
import { Dumbbell, Layers, List } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNavVisibility } from '@/lib/NavContext';

const tabs = [
  { path: '/', Icon: Dumbbell, label: 'Workouts' },
  { path: '/splits', Icon: Layers, label: 'Splits' },
  { path: '/exercises', Icon: List, label: 'Exercises' },
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
        className="relative flex items-center justify-around gap-1 h-[64px] px-1.5 rounded-full overflow-hidden border border-white/80 dark:border-white/20"
        style={{
          backgroundColor: 'rgba(249, 249, 249, 0.85)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow:
            '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.5)',
        }}
      >
        {/* Dark mode tint */}
        <div className="pointer-events-none absolute inset-0 rounded-full dark:bg-gray-900/50 hidden dark:block" />
        {/* Top highlight edge */}
        <div className="pointer-events-none absolute top-0 left-4 right-4 h-px rounded-full bg-white/60 dark:bg-white/10" />

        {tabs.map(({ path, Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="relative flex-1 flex items-center justify-center"
            >
              {active && (
                <motion.div
                  layoutId="navBubble"
                  className="absolute inset-1 rounded-full"
                  style={{
                    backgroundColor: 'rgba(165, 165, 172, 0.96)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(255,255,255,0.5)',
                    transform: 'translateZ(0)',
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.6 }}
                />
              )}
              <Icon
                className="relative z-10 w-[23px] h-[23px] transition-colors duration-200"
                style={{ color: active ? '#007aff' : '#000000' }}
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