// src/components/OnboardingRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import MascotAvatar from './MascotAvatar';

export default function OnboardingRoute({ step, children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { onboarding, loadingProfile } = useProfile();

  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <MascotAvatar size="md" className="animate-bounce mb-3" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading your profile...</p>
      </div>
    );
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
