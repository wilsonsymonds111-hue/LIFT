import { Toaster } from "@/components/ui/toaster"
import { useEffect, useRef, useMemo, useCallback, useState, lazy, Suspense, memo } from 'react';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, animate as framerAnimate } from 'framer-motion';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import BottomNav from './components/BottomNav';
import PersistentWorkoutBar from './components/PersistentWorkoutBar';
import { NavProvider } from '@/lib/NavContext';
import ImportErrorBoundary from './components/ImportErrorBoundary';

// Retry wrapper for lazy imports — recovers from transient Vite HMR
// "Failed to fetch dynamically imported module" errors after recompiles.
const lazyRetry = (importFn, retries = 5) =>
  new Promise((resolve, reject) => {
    const attempt = (n) => {
      importFn()
        .then(resolve)
        .catch((err) => {
          if (n > 0) setTimeout(() => attempt(n - 1), 500);
          else reject(err);
        });
    };
    attempt(retries);
  });

import Home from './pages/Home';
import Splits from './pages/Splits';
import BodyStats from './pages/BodyStats';
const NewTemplate = lazy(() => lazyRetry(() => import('./pages/NewTemplate')));
const ActiveWorkout = lazy(() => lazyRetry(() => import('./pages/ActiveWorkout')));
const TemplateDetail = lazy(() => lazyRetry(() => import('./pages/TemplateDetail')));
const SplitDetail = lazy(() => lazyRetry(() => import('./pages/SplitDetail')));
const SupportChat = lazy(() => lazyRetry(() => import('./pages/SupportChat')));
const Terms = lazy(() => lazyRetry(() => import('./pages/Terms')));
const Privacy = lazy(() => lazyRetry(() => import('./pages/Privacy')));
import { usePrefetchData } from './hooks/usePrefetchData';
import { loadWorkoutSession } from './lib/workoutSession';
import { isSessionStale, handleStaleSession } from './lib/staleWorkoutCheck';

const TABS = ['/', '/splits', '/exercises'];

const pageVariants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-25%', opacity: 0 },
};

const PAGE_TRANSITION = { duration: 0.28, ease: [0.22, 1, 0.36, 1] };
const SUSPENSE_FALLBACK = <div className="w-full h-screen bg-background" />;

// Memo wrapper prevents inactive tab pages from re-rendering on every navigation
const MemoTab = memo(({ Component }) => (
  <Suspense fallback={SUSPENSE_FALLBACK}>
    <Component />
  </Suspense>
));
const LOADING_SPINNER = (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <span className="text-2xl font-extrabold font-display tracking-widest text-foreground">LIFT</span>
  </div>
);

// For modal routes (template detail) — dim background instead of solid black
const MODAL_FALLBACK = <div className="fixed inset-0 bg-black/40" />;

const SlideIn = memo(({ children, transparent }) => (
  <motion.div
    className={`w-full min-h-screen ${transparent ? '' : 'bg-background'}`}
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={PAGE_TRANSITION}
  >
    {children}
  </motion.div>
));

const TAB_STYLES = { touchAction: 'pan-y' };

const TAB_CONTENT = [Home, Splits, BodyStats];

const SwipeableTabs = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const rawIndex = TABS.indexOf(location.pathname);
  const activeIndex = rawIndex === -1 ? 0 : rawIndex;
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);
  const visitedRef = useRef(new Set([0]));
  const x = useMotionValue(0);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let raf;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setWidth(el.offsetWidth));
    });
    ro.observe(el);
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  visitedRef.current.add(activeIndex);
  if (activeIndex > 0) visitedRef.current.add(activeIndex - 1);
  if (activeIndex < TABS.length - 1) visitedRef.current.add(activeIndex + 1);

  const handleDragEnd = useCallback((_, info) => {
    isDraggingRef.current = false;
    const velocity = Math.abs(info.velocity.x);
    const offset = Math.abs(info.offset.x);
    const flickThreshold = velocity > 800 ? 20 : 60;
    const shouldNav = offset > flickThreshold || velocity > 1200;
    if (shouldNav) {
      if (info.offset.x < 0 && activeIndex < TABS.length - 1) {
        navigate(TABS[activeIndex + 1]);
      } else if (info.offset.x > 0 && activeIndex > 0) {
        navigate(TABS[activeIndex - 1]);
      }
    }
  }, [activeIndex, navigate]);

  // Animate x to target when activeIndex changes (from nav tap or drag-end navigation).
  // Using animate() directly avoids the conflict between the `animate` prop and `drag`
  // that causes iOS to get stuck halfway between tabs.
  const targetX = -activeIndex * width;
  useEffect(() => {
    if (isDraggingRef.current || !width) return;
    const controls = framerAnimate(x, targetX, {
      type: 'spring',
      stiffness: 550,
      damping: 44,
      mass: 0.22,
      restSpeed: 0.01,
      restDelta: 0.5,
    });
    return () => controls.stop();
  }, [targetX, width]);

  if (!width) {
    return <div ref={containerRef} className="w-full flex-1"><Suspense fallback={SUSPENSE_FALLBACK}><Home /></Suspense></div>;
  }

  return (
    <div ref={containerRef} className="relative flex-1" style={TAB_STYLES}>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -(TABS.length - 1) * width, right: 0 }}
        dragElastic={0.08}
        dragMomentum={false}
        onDragStart={() => { isDraggingRef.current = true; }}
        onDragEnd={handleDragEnd}
        style={{ x, width: TABS.length * width, willChange: 'transform', transform: 'translateZ(0)' }}
        className="flex absolute top-0 bottom-0 overflow-hidden"
      >
        {TAB_CONTENT.map((Component, i) => (
          <TabPanel key={TABS[i]} width={width} visited={visitedRef.current.has(i)} Component={Component} />
        ))}
      </motion.div>
    </div>
  );
});

// Plain div — no per-frame useTransform recalculations. The slide alone is smooth
// and keeps all three panels from forcing simultaneous GPU compositing layers.
const TabPanel = memo(function TabPanel({ width, visited, Component }) {
  return (
    <div
      className="flex-shrink-0 overflow-y-auto"
      style={{ width, contain: 'layout style paint' }}
    >
      {visited ? <MemoTab Component={Component} /> : <div className="w-full h-full bg-background" />}
    </div>
  );
});

// Preload sub-pages after tab content settles
const usePreloadSubPages = () => {
  useEffect(() => {
    const preload = () => {
      import('./pages/NewTemplate');
      import('./pages/ActiveWorkout');
      import('./pages/TemplateDetail');
      import('./pages/SplitDetail');
    };
    const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 500));
    const id = ric(preload);
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id));
  }, []);
};

const AnimatedRoutes = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const isTabRoute = TABS.includes(location.pathname);
  usePreloadSubPages();
  usePrefetchData();
  const isModalRoute = location.pathname.startsWith('/template/') || location.pathname.startsWith('/active-workout/');
  const tabDisplay = useMemo(() => ({ display: isTabRoute || isModalRoute ? 'flex' : 'none' }), [isTabRoute, isModalRoute]);

  // Restore an in-progress workout if the app was killed and reopened
  useEffect(() => {
    const session = loadWorkoutSession();
    if (!session?.templateId) return;

    if (isSessionStale(session)) {
      handleStaleSession(session);
      if (location.pathname.startsWith('/active-workout')) {
        navigate('/', { replace: true });
      }
      return;
    }

    if (!location.pathname.startsWith('/active-workout')) {
      navigate(`/active-workout/${session.templateId}`, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Only render active tab for performance */}
      <div style={tabDisplay} className="flex-1 flex-col">
        <SwipeableTabs />
      </div>

      {/* Sub-page routes with slide-in transitions */}
      {!isTabRoute && (
        <div className={`w-full ${isModalRoute ? 'absolute inset-0 pointer-events-none' : 'flex-1'}`}>
          <Suspense fallback={isModalRoute ? MODAL_FALLBACK : LOADING_SPINNER}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/template/new" element={<SlideIn><NewTemplate /></SlideIn>} />
                <Route path="/template/:id" element={<SlideIn transparent><TemplateDetail /></SlideIn>} />
                <Route path="/split/:key" element={<SlideIn><SplitDetail /></SlideIn>} />
                <Route path="/active-workout/:id" element={<SlideIn transparent><ActiveWorkout /></SlideIn>} />
                <Route path="/support-chat/:id" element={<SlideIn><SupportChat /></SlideIn>} />
                <Route path="/terms" element={<SlideIn><Terms /></SlideIn>} />
                <Route path="/privacy" element={<SlideIn><Privacy /></SlideIn>} />

                <Route path="*" element={<SlideIn><PageNotFound /></SlideIn>} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </div>
      )}

      <BottomNav />
      <PersistentWorkoutBar />
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
  return (
    <ImportErrorBoundary>
      <AnimatedRoutes />
    </ImportErrorBoundary>
  );
};


function App() {
  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    document.documentElement.classList.toggle('dark', stored === 'true');
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