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
    await new Promise(r => setTimeout(r, 400));
    setLoading(false);

    if (!email || !password) {
      throw new Error('Please fill in both email and password.');
    }
    if (!email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const name = email.split('@')[0].replace(/[\._]/g, ' ');
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    const signedInUser = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      name: formattedName || 'Alex Rivers',
      email,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      createdAt: new Date().toISOString()
    };

    setUser(signedInUser);
    return signedInUser;
  };

  const signup = async (name, email, password) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 450));
    setLoading(false);

    if (!name || name.trim().length < 2) {
      throw new Error('Please enter your full name (at least 2 characters).');
    }
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const newUser = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      createdAt: new Date().toISOString()
    };

    setUser(newUser);
    return newUser;
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    setLoading(false);

    const googleUser = {
      id: 'usr_g_' + Math.random().toString(36).substr(2, 8),
      name: 'Elena Rostova',
      email: 'elena.rostova@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
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
