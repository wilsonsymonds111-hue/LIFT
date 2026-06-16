import { Toaster } from "@/components/ui/toaster"
import { useEffect, useRef, useState, lazy, Suspense } from 'react';
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

const TABS = ['/', '/splits'];

const pageVariants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-30%', opacity: 0 },
};

const transition = { duration: 0.18, ease: [0.33, 1, 0.68, 1] };

const SlideIn = ({ children }) => (
  <motion.div
    className="w-full min-h-screen bg-background"
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={transition}
  >
    {children}
  </motion.div>
);

const preloadMap = { '/splits': () => import('./pages/Splits'), '/': () => import('./pages/Home') };

const SwipeableTabs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeIndex = TABS.indexOf(location.pathname);
  const constraintsRef = useRef(null);
  const [pageWidth, setPageWidth] = useState(window.innerWidth);

  useEffect(() => {
    let id;
    const handleResize = () => {
      clearTimeout(id);
      id = setTimeout(() => setPageWidth(window.innerWidth), 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(id);
    };
  }, []);

  // Preload the other tab's chunk after initial render
  useEffect(() => {
    const otherPath = activeIndex === 0 ? '/splits' : '/';
    const preload = preloadMap[otherPath];
    if (preload) {
      const id = requestIdleCallback ? requestIdleCallback(preload, { timeout: 2000 }) : setTimeout(preload, 200);
      return () => (requestIdleCallback ? cancelIdleCallback(id) : clearTimeout(id));
    }
  }, [activeIndex]);

  const snapToTab = (index) => {
    if (index >= 0 && index < TABS.length && index !== activeIndex) {
      navigate(TABS[index]);
    }
  };

  return (
    <div className="relative overflow-hidden w-full flex-1" ref={constraintsRef} style={{ touchAction: 'pan-y' }}>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={constraintsRef}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          const threshold = 50;
          if (info.offset.x < -threshold) snapToTab(activeIndex + 1);
          else if (info.offset.x > threshold) snapToTab(activeIndex - 1);
        }}
        animate={{ x: -activeIndex * pageWidth }}
        transition={{ duration: 0.08, ease: [0.33, 1, 0.68, 1] }}
        className="flex"
        style={{ width: TABS.length * pageWidth }}
      >
        <div className="flex-shrink-0 overflow-y-auto" style={{ width: pageWidth }}>
          <Suspense fallback={<div className="w-full h-screen bg-background" />}>
            {activeIndex === 0 && <Home />}
          </Suspense>
        </div>
        <div className="flex-shrink-0 overflow-y-auto" style={{ width: pageWidth }}>
          <Suspense fallback={<div className="w-full h-screen bg-background" />}>
            {activeIndex === 1 && <Splits />}
          </Suspense>
        </div>
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
    const id = requestIdleCallback ? requestIdleCallback(preload, { timeout: 5000 }) : setTimeout(preload, 3000);
    return () => (requestIdleCallback ? cancelIdleCallback(id) : clearTimeout(id));
  }, []);
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const isTabRoute = location.pathname === '/' || location.pathname === '/splits';
  usePreloadSubPages();

  return (
    <>
      {/* Always mount tabs to preserve scroll position — toggle visibility only */}
      <div style={{ display: isTabRoute ? 'flex' : 'none' }} className="flex-1 flex-col">
        <SwipeableTabs />
      </div>

      {/* Sub-page routes with slide-in transitions */}
      {!isTabRoute && (
        <div className="w-full flex-1">
          <Suspense fallback={
            <div className="fixed inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
          }>
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
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

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