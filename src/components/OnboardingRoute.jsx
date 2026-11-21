// src/components/OnboardingRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import RouteGuardLoading from './RouteGuardLoading';

export default function OnboardingRoute({ step, children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { onboarding, loadingProfile } = useProfile();

  if (authLoading || loadingProfile) {
    return <RouteGuardLoading message="Loading your profile..." />;
  }

  // Logged out: go to /auth
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Logged in with onboarding finished: /get-started redirects to dashboard
  if (onboarding?.step === 'done') {
    return <Navigate to="/dashboard" replace />;
  }

  // Family page redirects back to profile page if page 1 is incomplete
  if (step === 'family' && onboarding?.step === 'profile') {
    return <Navigate to="/get-started/profile" replace />;
  }

  return children;
}
