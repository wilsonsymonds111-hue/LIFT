import { Toaster } from "@/components/ui/toaster"
import { useEffect, useRef, useMemo, useCallback, useState, lazy, Suspense, memo } from 'react';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import BottomNav from './components/BottomNav';
import { NavProvider } from '@/lib/NavContext';

const Home = lazy(() => import('./pages/Home'));
const Splits = lazy(() => import('./pages/Splits'));
const NewTemplate = lazy(() => import('./pages/NewTemplate'));
const ActiveWorkout = lazy(() => import('./pages/ActiveWorkout'));
const TemplateDetail = lazy(() => import('./pages/TemplateDetail'));
const SplitDetail = lazy(() => import('./pages/SplitDetail'));
const SupportChat = lazy(() => import('./pages/SupportChat'));
const Exercises = lazy(() => import('./pages/Exercises'));

const TABS = ['/', '/splits', '/exercises'];

const pageVariants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-30%', opacity: 0 },
};

const PAGE_TRANSITION = { duration: 0.15, ease: [0.33, 1, 0.68, 1] };
const SUSPENSE_FALLBACK = <div className="w-full h-screen bg-background" />;
const LOADING_SPINNER = (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

const SlideIn = ({ children }) => (
  <motion.div
    className="w-full min-h-screen bg-background"
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={PAGE_TRANSITION}
  >
    {children}
  </motion.div>
);

const TAB_STYLES = { touchAction: 'pan-y' };

const TAB_CONTENT = [Home, Splits, Exercises];

const SwipeableTabs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeIndex = TABS.indexOf(location.pathname);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setWidth(containerRef.current.offsetWidth);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleDragEnd = useCallback((_, info) => {
    const threshold = 80;
    if (info.offset.x < -threshold && activeIndex < TABS.length - 1) {
      navigate(TABS[activeIndex + 1]);
    } else if (info.offset.x > threshold && activeIndex > 0) {
      navigate(TABS[activeIndex - 1]);
    }
  }, [activeIndex, navigate]);

  if (!width) {
    return <div ref={containerRef} className="w-full flex-1"><Suspense fallback={SUSPENSE_FALLBACK}><Home /></Suspense></div>;
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden w-full flex-1" style={TAB_STYLES}>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -(TABS.length - 1) * width, right: 0 }}
        dragElastic={0.08}
        onDragEnd={handleDragEnd}
        animate={{ x: -activeIndex * width }}
        transition={{ type: 'spring', stiffness: 400, damping: 26, mass: 0.18 }}
        className="flex"
        style={{ width: TABS.length * width, height: '100%', willChange: 'transform' }}
      >
        {TAB_CONTENT.map((Component, i) => (
          <div key={TABS[i]} className="flex-shrink-0 overflow-y-auto" style={{ width, height: '100%' }}>
            <Suspense fallback={SUSPENSE_FALLBACK}>
              <Component />
            </Suspense>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// Preload sub-pages after tab content settles
const usePreloadSubPages = () => {
  useEffect(() => {
    const preload = () => {
      import('./pages/NewTemplate');
      import('./pages/ActiveWorkout');
      import('./pages/TemplateDetail');
      import('./pages/SplitDetail');
      import('./pages/SupportChat');
    };
    const hasRIC = typeof requestIdleCallback === 'function';
    const id = hasRIC ? requestIdleCallback(preload, { timeout: 5000 }) : setTimeout(preload, 3000);
    return () => (hasRIC ? cancelIdleCallback(id) : clearTimeout(id));
  }, []);
};

const AnimatedRoutes = memo(() => {
  const location = useLocation();
  const isTabRoute = TABS.includes(location.pathname);
  usePreloadSubPages();
  const tabDisplay = useMemo(() => ({ display: isTabRoute ? 'flex' : 'none' }), [isTabRoute]);

  return (
    <>
      {/* Only render active tab for performance */}
      <div style={tabDisplay} className="flex-1 flex-col">
        <SwipeableTabs />
      </div>

      {/* Sub-page routes with slide-in transitions */}
      {!isTabRoute && (
        <div className="w-full flex-1">
          <Suspense fallback={LOADING_SPINNER}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/template/new" element={<SlideIn><NewTemplate /></SlideIn>} />
                <Route path="/template/:id" element={<SlideIn><TemplateDetail /></SlideIn>} />
                <Route path="/split/:key" element={<SlideIn><SplitDetail /></SlideIn>} />
                <Route path="/active-workout/:id" element={<SlideIn><ActiveWorkout /></SlideIn>} />
                <Route path="/support-chat/:id" element={<SlideIn><SupportChat /></SlideIn>} />

                <Route path="*" element={<SlideIn><PageNotFound /></SlideIn>} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </div>
      )}

      <BottomNav />
    </>
  );
});

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isGuest, isAuthenticated } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return LOADING_SPINNER;
  }

  // In guest mode or authenticated, render the app normally
  // Only block on truly unexpected errors
  if (authError && !isGuest) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  // Guest mode or authenticated – always render the app
  return <AnimatedRoutes />;
};


function App() {
  useEffect(() => {
    // Initialize dark mode from localStorage or system preference
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      document.documentElement.classList.toggle('dark', stored === 'true');
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      document.documentElement.classList.toggle('dark', mq.matches);
    }
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <NavProvider>
          <Router>
            <AuthenticatedApp />
          </Router>
        </NavProvider>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App