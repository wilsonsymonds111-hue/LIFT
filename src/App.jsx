import { Toaster } from "@/components/ui/toaster"
import { useEffect, useRef, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Home from './pages/Home';
import Splits from './pages/Splits';
import NewTemplate from './pages/NewTemplate';
import ActiveWorkout from './pages/ActiveWorkout';
import TemplateDetail from './pages/TemplateDetail';
import SplitDetail from './pages/SplitDetail';
import BottomNav from './components/BottomNav';

const TABS = ['/', '/splits'];

const pageVariants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-30%', opacity: 0 },
};

const transition = { duration: 0.25, ease: [0.33, 1, 0.68, 1] };

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

const SwipeableTabs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeIndex = TABS.indexOf(location.pathname);
  const constraintsRef = useRef(null);
  const [pageWidth, setPageWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setPageWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        transition={{ duration: 0.12, ease: [0.33, 1, 0.68, 1] }}
        className="flex"
        style={{ width: TABS.length * pageWidth }}
      >
        <div className="flex-shrink-0 overflow-y-auto" style={{ width: pageWidth }}>
          <Home />
        </div>
        <div className="flex-shrink-0 overflow-y-auto" style={{ width: pageWidth }}>
          <Splits />
        </div>
      </motion.div>
    </div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const isTabRoute = location.pathname === '/' || location.pathname === '/splits';

  return (
    <>
      {/* Always mount tabs to preserve scroll position — toggle visibility only */}
      <div style={{ display: isTabRoute ? 'flex' : 'none' }} className="flex-1 flex-col">
        <SwipeableTabs />
      </div>

      {/* Sub-page routes with slide-in transitions */}
      {!isTabRoute && (
        <div className="w-full flex-1">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/template/new" element={<SlideIn><NewTemplate /></SlideIn>} />
              <Route path="/template/:id" element={<SlideIn><TemplateDetail /></SlideIn>} />
              <Route path="/split/:key" element={<SlideIn><SplitDetail /></SlideIn>} />
              <Route path="/active-workout/:id" element={<SlideIn><ActiveWorkout /></SlideIn>} />
              <Route path="*" element={<SlideIn><PageNotFound /></SlideIn>} />
            </Routes>
          </AnimatePresence>
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
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App