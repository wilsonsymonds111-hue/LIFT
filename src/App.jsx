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
import Exercises from './pages/Exercises';
const NewTemplate = lazy(() => lazyRetry(() => import('./pages/NewTemplate')));
const ActiveWorkout = lazy(() => lazyRetry(() => import('./pages/ActiveWorkout')));
const TemplateDetail = lazy(() => lazyRetry(() => import('./pages/TemplateDetail')));
const SplitDetail = lazy(() => lazyRetry(() => import('./pages/SplitDetail')));
const SupportChat = lazy(() => lazyRetry(() => import('./pages/SupportChat')));
const Terms = lazy(() => lazyRetry(() => import('./pages/Terms')));
const Privacy = lazy(() => lazyRetry(() => import('./pages/Privacy')));
import { usePrefetchData } from './hooks/usePrefetchData';

const TABS = ['/', '/splits', '/exercises'];

const pageVariants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-30%', opacity: 0 },
};

const PAGE_TRANSITION = { duration: 0.15, ease: [0.33, 1, 0.68, 1] };
const SUSPENSE_FALLBACK = <div className="w-full h-screen bg-background" />;

// Memo wrapper prevents inactive tab pages from re-rendering on every navigation
const MemoTab = memo(({ Component }) => (
  <Suspense fallback={SUSPENSE_FALLBACK}>
    <Component />
  </Suspense>
));
const LOADING_SPINNER = (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

const SlideIn = memo(({ children }) => (
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
));

const TAB_STYLES = { touchAction: 'pan-y' };

const TAB_CONTENT = [Home, Splits, Exercises];

const SwipeableTabs = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeIndex = TABS.indexOf(location.pathname);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);
  // Track which tabs have ever been "visited" so we only mount/fetch what's needed
  const visitedRef = useRef(new Set([0]));

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

  // Mark current + adjacent tabs as visited
  visitedRef.current.add(activeIndex);
  if (activeIndex > 0) visitedRef.current.add(activeIndex - 1);
  if (activeIndex < TABS.length - 1) visitedRef.current.add(activeIndex + 1);

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
    <div ref={containerRef} className="relative flex-1" style={TAB_STYLES}>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -(TABS.length - 1) * width, right: 0 }}
        dragElastic={0.08}
        onDragEnd={handleDragEnd}
        animate={{ x: -activeIndex * width }}
        transition={{ type: 'spring', stiffness: 400, damping: 26, mass: 0.18 }}
        className="flex absolute top-0 bottom-0 overflow-hidden"
        style={{ width: TABS.length * width, willChange: 'transform', transform: 'translateZ(0)' }}
      >
        {TAB_CONTENT.map((Component, i) => (
          <div key={TABS[i]} className="flex-shrink-0 overflow-y-auto" style={{ width, contain: 'layout style' }}>
            {visitedRef.current.has(i) ? <MemoTab Component={Component} /> : <div className="w-full h-full bg-background" />}
          </div>
        ))}
      </motion.div>
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
      import('./pages/SupportChat');
      import('./pages/Terms');
      import('./pages/Privacy');
      import('./components/ExerciseDetailModal');
    };
    const id = setTimeout(preload, 200);
    return () => clearTimeout(id);
  }, []);
};

const AnimatedRoutes = memo(() => {
  const location = useLocation();
  const isTabRoute = TABS.includes(location.pathname);
  usePreloadSubPages();
  usePrefetchData();
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
                <Route path="/terms" element={<SlideIn><Terms /></SlideIn>} />
                <Route path="/privacy" element={<SlideIn><Privacy /></SlideIn>} />

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