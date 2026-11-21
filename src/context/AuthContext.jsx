// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  isFirebaseConfigured,
  missingFirebaseVars
} from '../firebase';

const AuthContext = createContext();

// Separate, clearly labeled demo account (used ONLY for optional offline preview)
const DEMO_USER = {
  uid: 'demo_user_preview_882',
  id: 'demo_user_preview_882',
  displayName: 'Demo Account (Preview)',
  name: 'Demo Account (Preview)',
  email: 'demo@foggy.local',
  photoURL:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
  avatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
  isDemo: true,
  createdAt: new Date().toISOString(),
  getIdToken: async () => 'demo_token'
};

function formatFirebaseUser(fbUser) {
  if (!fbUser) return null;
  const displayName = fbUser.displayName || '';
  const email = fbUser.email || '';
  const photoURL =
    fbUser.photoURL ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fbUser.uid || email || 'user')}`;

  return {
    uid: fbUser.uid,
    id: fbUser.uid,
    displayName: displayName || (email ? email.split('@')[0] : 'User'),
    name: displayName || (email ? email.split('@')[0] : 'User'),
    email: email,
    photoURL: photoURL,
    avatar: photoURL,
    emailVerified: fbUser.emailVerified || false,
    isAnonymous: fbUser.isAnonymous || false,
    providerId: fbUser.providerData?.[0]?.providerId || 'password',
    createdAt: fbUser.metadata?.creationTime || new Date().toISOString(),
    getIdToken: (forceRefresh) => {
      if (typeof fbUser.getIdToken === 'function') {
        return fbUser.getIdToken(forceRefresh);
      }
      return Promise.resolve('demo_token');
    }
  };
}

export function getFriendlyAuthErrorMessage(err) {
  if (!err) return 'An unexpected authentication error occurred.';
  const code = err.code || '';
  const message = err.message || '';

  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'The sign-in popup was closed before completing. Please try again.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/cancelled-popup-request':
      return 'A sign-in window is already open. Please complete or close it.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Incorrect email or password. Please verify your credentials or reset your password.';
    case 'auth/user-not-found':
      return 'No account found with this email address. Please sign up first.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email address using a different sign-in method. Please sign in using your original method.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Access has been temporarily disabled. Please wait a few moments and try again.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/email-already-in-use':
      return 'This email address is already in use. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address format (e.g., name@example.com).';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in Firebase Console. Please enable Email/Password and Google sign-in under Authentication > Sign-in method.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for OAuth operations. Add this domain to Firebase Console > Authentication > Settings > Authorized domains.';
    default:
      if (message.includes('API key not valid') || message.includes('api-key-not-valid')) {
        return 'Firebase API key is invalid. Please check your VITE_FIREBASE_API_KEY environment variable.';
      }
      return (
        message.replace(/^Firebase:\s*/, '').replace(/\s*\(auth\/[a-z0-9-]+\)\.?$/i, '') ||
        'Authentication failed. Please try again.'
      );
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to real Firebase authentication state changes
  useEffect(() => {
    if (!auth) {
      // Firebase is not initialized (missing environment variables)
      const savedDemo = localStorage.getItem('foggy_demo_session');
      if (savedDemo) {
        try {
          setUser(JSON.parse(savedDemo));
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (fbUser) => {
        if (fbUser) {
          localStorage.removeItem('foggy_demo_session');
          setUser(formatFirebaseUser(fbUser));
        } else {
          const savedDemo = localStorage.getItem('foggy_demo_session');
          if (savedDemo) {
            try {
              setUser(JSON.parse(savedDemo));
            } catch {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Firebase Auth state change error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const ensureFirebaseReady = () => {
    if (!isFirebaseConfigured || !auth) {
      const missingList =
        missingFirebaseVars.length > 0 ? missingFirebaseVars.join(', ') : 'Firebase keys';
      throw new Error(
        `Firebase is not configured. Missing required environment variables: ${missingList}. Please configure these in your .env or Cloudflare Pages settings.`
      );
    }
  };

  const loginWithGoogle = async () => {
    ensureFirebaseReady();
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      localStorage.removeItem('foggy_demo_session');
      const formatted = formatFirebaseUser(result.user);
      setUser(formatted);
      return formatted;
    } catch (err) {
      const friendlyMessage = getFriendlyAuthErrorMessage(err);
      throw new Error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    ensureFirebaseReady();

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Please enter your email address.');
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      localStorage.removeItem('foggy_demo_session');
      const formatted = formatFirebaseUser(cred.user);
      setUser(formatted);
      return formatted;
    } catch (err) {
      const friendlyMessage = getFriendlyAuthErrorMessage(err);
      throw new Error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    ensureFirebaseReady();

    const cleanName = (name || '').trim();
    if (!cleanName || cleanName.length < 2) {
      throw new Error('Please enter your name (at least 2 characters).');
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      throw new Error('Please enter a valid email address.');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      if (cred.user && cleanName) {
        await updateProfile(cred.user, {
          displayName: cleanName
        }).catch((err) => console.warn('Could not update profile displayName:', err));
      }
      localStorage.removeItem('foggy_demo_session');
      const formatted = formatFirebaseUser({
        ...cred.user,
        displayName: cleanName
      });
      setUser(formatted);
      return formatted;
    } catch (err) {
      const friendlyMessage = getFriendlyAuthErrorMessage(err);
      throw new Error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email) => {
    ensureFirebaseReady();
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      throw new Error('Please enter a valid email address.');
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return true;
    } catch (err) {
      const friendlyMessage = getFriendlyAuthErrorMessage(err);
      throw new Error(friendlyMessage);
    }
  };

  const loginAsDemo = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 200));
    setLoading(false);
    localStorage.setItem('foggy_demo_session', JSON.stringify(DEMO_USER));
    setUser(DEMO_USER);
    return DEMO_USER;
  };

  const logout = async () => {
    setLoading(true);
    localStorage.removeItem('foggy_demo_session');
    localStorage.removeItem('foggy_session_user');
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    }
    setUser(null);
    setLoading(false);
  };

  const updateUser = (partialUpdates) => {
    setUser((prev) => (prev ? { ...prev, ...partialUpdates } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        signup,
        loginWithGoogle,
        sendPasswordReset,
        loginAsDemo,
        logout,
        updateUser,
        isFirebaseConfigured,
        missingFirebaseVars
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
