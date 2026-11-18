// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const DEMO_USER = {
  id: 'usr_demo_882',
  name: 'Maya Chen',
  email: 'maya.chen@example.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
  createdAt: new Date().toISOString()
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('foggy_session_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('foggy_session_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('foggy_session_user');
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    // Simulate brief network latency for realistic feel
    await new Promise(r => setTimeout(r, 300));
    setLoading(false);

    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail) {
      throw new Error('Please enter your email address.');
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.') || cleanEmail.startsWith('@') || cleanEmail.endsWith('@')) {
      throw new Error('Please enter a valid email address (e.g. yourname@example.com).');
    }

    const cleanPassword = (password || '').trim();
    if (cleanPassword && cleanPassword.length < 3) {
      throw new Error('Password must be at least 3 characters long.');
    }

    // Deterministic user ID from email so saved family profiles and memories persist across sessions
    let hash = 0;
    for (let i = 0; i < cleanEmail.length; i++) {
      hash = (hash << 5) - hash + cleanEmail.charCodeAt(i);
      hash |= 0;
    }
    const safeKey = cleanEmail.replace(/[^a-z0-9]/g, '_').slice(0, 16);
    const stableId = `usr_${safeKey}_${Math.abs(hash).toString(36)}`;

    const rawName = cleanEmail.split('@')[0].replace(/[\._\-+]/g, ' ').trim();
    const formattedName = rawName
      ? rawName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : 'Friend';

    const signedInUser = {
      id: stableId,
      name: formattedName,
      email: cleanEmail,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
      createdAt: new Date().toISOString()
    };

    setUser(signedInUser);
    return signedInUser;
  };

  const signup = async (name, email, password) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 350));
    setLoading(false);

    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail) {
      throw new Error('Please enter your email address.');
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.') || cleanEmail.startsWith('@') || cleanEmail.endsWith('@')) {
      throw new Error('Please enter a valid email address (e.g. yourname@example.com).');
    }

    const cleanName = (name || '').trim();
    const finalName = cleanName || cleanEmail.split('@')[0].replace(/[\._\-+]/g, ' ').trim() || 'Friend';

    const cleanPassword = (password || '').trim();
    if (cleanPassword && cleanPassword.length < 3) {
      throw new Error('Password must be at least 3 characters long.');
    }

    let hash = 0;
    for (let i = 0; i < cleanEmail.length; i++) {
      hash = (hash << 5) - hash + cleanEmail.charCodeAt(i);
      hash |= 0;
    }
    const safeKey = cleanEmail.replace(/[^a-z0-9]/g, '_').slice(0, 16);
    const stableId = `usr_${safeKey}_${Math.abs(hash).toString(36)}`;

    const newUser = {
      id: stableId,
      name: finalName.charAt(0).toUpperCase() + finalName.slice(1),
      email: cleanEmail,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
      createdAt: new Date().toISOString()
    };

    setUser(newUser);
    return newUser;
  };

  const loginWithGoogle = async (emailOverride) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 350));
    setLoading(false);

    const cleanEmail = (emailOverride || '').trim().toLowerCase() || 'elena.rostova@gmail.com';
    const rawName = cleanEmail.split('@')[0].replace(/[\._\-+]/g, ' ').trim();
    const formattedName = cleanEmail === 'elena.rostova@gmail.com'
      ? 'Elena Rostova'
      : rawName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Google User';

    let hash = 0;
    for (let i = 0; i < cleanEmail.length; i++) {
      hash = (hash << 5) - hash + cleanEmail.charCodeAt(i);
      hash |= 0;
    }
    const safeKey = cleanEmail.replace(/[^a-z0-9]/g, '_').slice(0, 16);
    const stableId = `usr_g_${safeKey}_${Math.abs(hash).toString(36)}`;

    const googleUser = {
      id: stableId,
      name: formattedName,
      email: cleanEmail,
      avatar: cleanEmail === 'elena.rostova@gmail.com'
        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80'
        : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
      createdAt: new Date().toISOString(),
      provider: 'google'
    };

    setUser(googleUser);
    return googleUser;
  };

  const loginAsDemo = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    setLoading(false);
    setUser(DEMO_USER);
    return DEMO_USER;
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (partialUpdates) => {
    setUser(prev => (prev ? { ...prev, ...partialUpdates } : null));
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
        loginAsDemo,
        logout,
        updateUser
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
