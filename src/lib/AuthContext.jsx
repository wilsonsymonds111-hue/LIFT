import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44, setCloudMode, migrateToCloud } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';
import { hasLocalData } from '@/lib/dataLayer';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
        headers: { 'X-App-Id': appParams.appId },
        token: appParams.token,
        interceptResponses: true
      });

      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings);

        if (appParams.token) {
          await checkUserAuth();
        } else {
          // No token – guest mode
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
          setIsGuest(true);
          setCloudMode(false);
          setAuthChecked(true);
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);

        // If auth is required but not provided, enter guest mode anyway
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required' || reason === 'user_not_registered') {
            // Guest mode – app works without login
            setIsLoadingAuth(false);
            setIsLoadingPublicSettings(false);
            setIsAuthenticated(false);
            setIsGuest(true);
            setCloudMode(false);
            setAuthChecked(true);
            return;
          }
        }

        // Fallback to guest mode on non-auth errors
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        setIsGuest(true);
        setCloudMode(false);
        setAuthChecked(true);
        setIsLoadingPublicSettings(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsGuest(false);
      setCloudMode(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);

      // If there's local data and we just authenticated, offer migration
      if (hasLocalData()) {
        setMigrating(true);
        try {
          await migrateToCloud();
        } catch {}
        setMigrating(false);
      }
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setIsGuest(true);
      setCloudMode(false);
      setAuthChecked(true);
    }
  };

  const logout = () => {
    // Soft logout: clear token + local data, stay in guest mode without redirect
    localStorage.removeItem('base44_access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('lift_user_data');
    localStorage.removeItem('profilePhoto');
    localStorage.removeItem('muscleMassPrediction_v2');

    setUser(null);
    setIsAuthenticated(false);
    setIsGuest(true);
    setCloudMode(false);
  };

  const navigateToLogin = () => {
    // Store current URL so we come back here after login
    base44.auth.redirectToLogin(window.location.href);
  };

  const handleCreateAccount = () => {
    navigateToLogin();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isGuest,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      migrating,
      logout,
      navigateToLogin,
      handleCreateAccount,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};