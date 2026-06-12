import { Toaster } from "@/components/ui/toaster"
import { useEffect, useState, lazy, Suspense, useRef } from 'react';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import BottomNav from './components/BottomNav';

const Home = lazy(() => import('./pages/Home'));
const NewTemplate = lazy(() => import('./pages/NewTemplate'));
const ActiveWorkout = lazy(() => import('./pages/ActiveWorkout'));
const History = lazy(() => import('./pages/History'));
const Profile = lazy(() => import('./pages/Profile'));

// Tab order for direction detection
const TAB_PATHS = ['/', '/history', '/profile'];

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
  </div>
);

const AnimatedRoutes = ({ darkMode, onToggleDark, profilePhoto, onPhotoChange }) => {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);
  const [animClass, setAnimClass] = useState('');

  useEffect(() => {
    const prev = prevPathRef.current;
    const curr = location.pathname;
    prevPathRef.current = curr;
    if (prev === curr) return;

    const prevIdx = TAB_PATHS.indexOf(prev);
    const currIdx = TAB_PATHS.indexOf(curr);

    // Tab switching: slide based on tab position
    if (prevIdx !== -1 && currIdx !== -1) {
      setAnimClass(currIdx > prevIdx ? 'route-enter-right' : 'route-enter-left');
    } else if (currIdx === -1 && prevIdx !== -1) {
      // Navigating into a sub-page (push)
      setAnimClass('route-enter-right');
    } else if (currIdx !== -1 && prevIdx === -1) {
      // Coming back to a tab (pop)
      setAnimClass('route-enter-left');
    } else {
      setAnimClass('route-enter-right');
    }
  }, [location.pathname]);

  // Hide bottom nav on sub-pages
  const isSubPage = !TAB_PATHS.includes(location.pathname);

  return (
    <>
      <div key={location.pathname} className={animClass || ''}>
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={
              <Profile
                darkMode={darkMode}
                onToggleDark={onToggleDark}
                profilePhoto={profilePhoto}
                onPhotoChange={onPhotoChange}
              />
            } />
            <Route path="/template/new" element={<NewTemplate />} />
            <Route path="/active-workout/:id" element={<ActiveWorkout />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Suspense>
      </div>
      {!isSubPage && <BottomNav profilePhoto={profilePhoto} />}
    </>
  );
};

const AuthenticatedApp = ({ darkMode, onToggleDark, profilePhoto, onPhotoChange }) => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <PageLoader />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <AnimatedRoutes
      darkMode={darkMode}
      onToggleDark={onToggleDark}
      profilePhoto={profilePhoto}
      onPhotoChange={onPhotoChange}
    />
  );
};

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem('profilePhoto') || null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleToggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
  };

  const handlePhotoChange = (url) => {
    setProfilePhoto(url);
    localStorage.setItem('profilePhoto', url);
  };

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp
            darkMode={darkMode}
            onToggleDark={handleToggleDark}
            profilePhoto={profilePhoto}
            onPhotoChange={handlePhotoChange}
          />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;