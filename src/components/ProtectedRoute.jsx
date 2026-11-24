// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import RouteGuardLoading from './RouteGuardLoading';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { profile, onboarding, loadingProfile, syncBlocked } = useProfile();
  const location = useLocation();

  if (authLoading || loadingProfile) {
    return <RouteGuardLoading message="Verifying session & air profile..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If sync is blocked and profile couldn't be loaded from cloud or cache,
  // do not force the user into onboarding step 1; allow protected page to render
  // the "We couldn't load your profile" state with a clear Retry button.
  if (!profile && syncBlocked) {
    return children;
  }

  // Route guard: Logged in with onboarding not finished -> redirect to user's active onboarding step
  if (onboarding?.step === 'profile') {
    return <Navigate to="/get-started/profile" replace />;
  }

  if (onboarding?.step === 'family') {
    return <Navigate to="/get-started/family" replace />;
  }

  return children;
}
