import React, { useEffect, useState, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { Spinner } from 'react-bootstrap';

const ProtectedRoute = ({ children, requireRole = null }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [profileStatus, setProfileStatus] = useState(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [checkTimeoutReached, setCheckTimeoutReached] = useState(false);
  const location = useLocation();

  const checkProfileStatus = useCallback(async () => {
    if (isAuthenticated && user) {
      try {
        const response = await userAPI.getProfileStatus();
        setProfileStatus(response.data);
      } catch (error) {
        console.error('Error checking profile status:', error);
      }
    }
    setCheckingProfile(false);
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isLoading) {
      checkProfileStatus();
    }
  }, [isAuthenticated, user, isLoading, checkProfileStatus]);

  // Safety timeout to avoid indefinite loading spinner
  useEffect(() => {
    if (checkingProfile) {
      const t = setTimeout(() => {
        setCheckTimeoutReached(true);
        setCheckingProfile(false);
      }, 7000);
      return () => clearTimeout(t);
    }
  }, [checkingProfile]);

  // Listen for profile creation events
  useEffect(() => {
    const handleProfileCreated = () => {
      console.log('Profile created event detected, refreshing status...');
      // Add a small delay to ensure backend has processed the profile creation
      setTimeout(() => {
        checkProfileStatus();
      }, 500);
    };

    window.addEventListener('profileCreated', handleProfileCreated);
    return () => window.removeEventListener('profileCreated', handleProfileCreated);
  }, [checkProfileStatus]);

  // Show loading spinner while checking auth or profile
  if (isLoading || (checkingProfile && !checkTimeoutReached)) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requireRole && user?.role !== requireRole) {
    // Redirect based on user's actual role
    let redirectPath = '/brand/dashboard';
    if (user?.role === 'influencer') {
      redirectPath = '/influencer/dashboard';
    } else if (user?.role === 'ugc_creator') {
      redirectPath = '/ugc/dashboard';
    } else if (user?.role === 'admin') {
      redirectPath = '/admin-dashboard';
    } else if (user?.role === 'support') {
      redirectPath = '/support-dashboard';
    }
    return <Navigate to={redirectPath} replace />;
  }

  // Handle influencer onboarding flow
  if (user?.role === 'influencer') {
    const currentPath = location.pathname;
    // If profile status failed to load (timeout) and we're not already on wizard,
    // prefer redirecting to wizard to avoid showing dashboard prematurely.
    if (!profileStatus && checkTimeoutReached && !currentPath.includes('/wizard')) {
      return <Navigate to="/influencer/wizard" replace />;
    }
    if (!profileStatus) {
      // If still no status and no timeout, allow spinner block above to persist.
      // This branch is only reached when not checking and no status due to errors.
      // Fall through to children in non-wizard routes, but guard below once status arrives.
    }
    
    // If influencer hasn't completed profile and not on wizard page
    if (
      profileStatus?.requiresOnboarding &&
      !currentPath.includes('/wizard') &&
      // Allow Connect Social page during onboarding
      !currentPath.includes('/connect-social')
    ) {
      return <Navigate to="/influencer/wizard" replace />;
    }
    
    // If influencer has completed profile and trying to access wizard
    if (profileStatus && !profileStatus.requiresOnboarding && currentPath.includes('/wizard')) {
      return <Navigate to="/influencer/dashboard" replace />;
    }
  }

  // Handle UGC Creator onboarding flow
  if (user?.role === 'ugc_creator') {
    const currentPath = location.pathname;
    // Fallback: if status failed to load by timeout, redirect to wizard to be safe
    if (!profileStatus && checkTimeoutReached && !currentPath.includes('/wizard')) {
      return <Navigate to="/ugc/wizard" replace />;
    }
    
    // If UGC Creator hasn't completed profile and not on wizard page
    if (
      profileStatus?.requiresOnboarding &&
      !currentPath.includes('/wizard') &&
      // Allow Connect Social page during onboarding
      !currentPath.includes('/connect-social')
    ) {
      return <Navigate to="/ugc/wizard" replace />;
    }
    
    // If UGC Creator has completed profile and trying to access wizard
    if (profileStatus && !profileStatus.requiresOnboarding && currentPath.includes('/wizard')) {
      return <Navigate to="/ugc/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
