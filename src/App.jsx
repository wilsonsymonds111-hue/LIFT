import { Toaster } from "@/components/ui/toaster"
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Home from './pages/Home';
import NewTemplate from './pages/NewTemplate';
import ActiveWorkout from './pages/ActiveWorkout';


const AnimatedRoutes = () => {
  const location = useLocation();
  const noAnimation = location.pathname.startsWith('/active-workout/');
  return (
    <div key={location.pathname} className={noAnimation ? '' : 'route-enter'}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/template/new" element={<NewTemplate />} />
        <Route path="/active-workout/:id" element={<ActiveWorkout />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </div>
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