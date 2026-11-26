// src/pages/AuthPage.jsx
/**
 * @fileoverview Authentication page supporting Firebase Email/Password, Google OAuth, and Demo Mode.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MascotAvatar from '../components/MascotAvatar';
import MissingFirebaseNotice from '../components/auth/MissingFirebaseNotice';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';
import AuthTabs from '../components/auth/AuthTabs';
import AuthGoogleButton from '../components/auth/AuthGoogleButton';
import AuthEmailForm from '../components/auth/AuthEmailForm';
import AuthDemoBanner from '../components/auth/AuthDemoBanner';

const RESET_SUCCESS_CLOSE_MS = 3000;

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const {
    isAuthenticated,
    login,
    signup,
    loginWithGoogle,
    sendPasswordReset,
    loginAsDemo,
    loading,
    isFirebaseConfigured,
    missingFirebaseVars
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        await signup(name, email, password);
      } else {
        await login(email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    try {
      await loginAsDemo();
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Could not load demo session.');
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      await sendPasswordReset(forgotEmail);
      setForgotSent(true);
      setTimeout(() => {
        setForgotSent(false);
        setForgotModal(false);
        setForgotEmail('');
      }, RESET_SUCCESS_CLOSE_MS);
    } catch (err) {
      setForgotError(err.message || 'Failed to send password reset email.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 px-4">
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-8 shadow-soft dark:shadow-soft-dark">
        <div className="text-center mb-6">
          <MascotAvatar size="lg" className="mx-auto mb-3" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {isSignUp ? 'Create your Foggy account' : 'Welcome back to Foggy'}
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {isSignUp
              ? 'Start protecting your family with personalized smog routines.'
              : 'Sign in to access your air quality plans & saved family health profiles.'}
          </p>
        </div>

        {!isFirebaseConfigured && <MissingFirebaseNotice missingVars={missingFirebaseVars} />}

        <AuthTabs
          isSignUp={isSignUp}
          onTabChange={(signUp) => {
            setIsSignUp(signUp);
            setError('');
          }}
        />

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <AuthGoogleButton onClick={handleGoogleLogin} loading={loading} />

        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
          <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-medium text-slate-600 dark:text-slate-400 absolute">
            or with email
          </span>
        </div>

        <AuthEmailForm
          isSignUp={isSignUp}
          name={name}
          setName={(v) => {
            setName(v);
            if (error) setError('');
          }}
          email={email}
          setEmail={(v) => {
            setEmail(v);
            if (error) setError('');
          }}
          password={password}
          setPassword={(v) => {
            setPassword(v);
            if (error) setError('');
          }}
          onSubmit={handleSubmit}
          loading={loading}
          onForgotPassword={() => {
            setForgotEmail(email.trim());
            setForgotModal(true);
            setForgotError('');
            setForgotSent(false);
          }}
        />

        <AuthDemoBanner onDemoLogin={handleDemoLogin} loading={loading} />

        <p className="mt-4 text-[11px] text-center text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>Health profile data is securely stored under your Firebase UID.</span>
        </p>
      </div>

      <ForgotPasswordModal
        isOpen={forgotModal}
        onClose={() => setForgotModal(false)}
        email={forgotEmail}
        setEmail={setForgotEmail}
        onSubmit={handleForgotSubmit}
        loading={forgotLoading}
        error={forgotError}
        sent={forgotSent}
      />
    </div>
  );
}
