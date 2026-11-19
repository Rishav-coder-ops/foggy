// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import MascotAvatar from './MascotAvatar';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { onboarding, loadingProfile } = useProfile();
  const location = useLocation();

  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <MascotAvatar size="md" className="animate-bounce mb-3" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Verifying session & air profile...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
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
