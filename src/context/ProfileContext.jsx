// src/context/ProfileContext.jsx
/**
 * @fileoverview React Context Provider for user and household profile state.
 * Supports demo account isolation via localStorage and real user sync with Firestore.
 */

import { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  CURRENT_PROFILE_SEED_VERSION,
  COOKING_OPTIONS,
  HEATING_OPTIONS,
  COMMUTE_OPTIONS,
  DEFAULT_DEMO_HOUSEHOLD
} from './profile/profileConstants.js';
import {
  getProfileLocalStorageKey,
  loadProfileFromLocalStorage,
  saveProfileToLocalStorage
} from './profile/profileStorage.js';
import { ensureVerifiedCoordinates, buildNormalizedProfile } from './profile/profileDefaults.js';
import { useProfileSync } from './profile/useProfileSync.js';
import { createProfileActions } from './profile/profileActions.js';

export {
  CURRENT_PROFILE_SEED_VERSION,
  COOKING_OPTIONS,
  HEATING_OPTIONS,
  COMMUTE_OPTIONS,
  DEFAULT_DEMO_HOUSEHOLD,
  ensureVerifiedCoordinates,
  getProfileLocalStorageKey,
  loadProfileFromLocalStorage,
  saveProfileToLocalStorage
};

const ProfileContext = createContext();

/**
 * Provides global profile and household member state to the application tree.
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export function ProfileProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const isDemo = !!user?.isDemo;
  const uid = user?.uid;

  const [profileData, setProfileData] = useState(() => {
    if (!isDemo && uid) {
      const cached = loadProfileFromLocalStorage(uid);
      if (cached?.profile) return cached.profile;
    }
    return null;
  });
  const [preferredName, setPreferredName] = useState(() => {
    if (!isDemo && uid) {
      const cached = loadProfileFromLocalStorage(uid);
      if (cached?.preferredName) return cached.preferredName;
    }
    return '';
  });
  const [onboarding, setOnboarding] = useState(() => {
    if (!isDemo && uid) {
      const cached = loadProfileFromLocalStorage(uid);
      if (cached?.onboarding) return cached.onboarding;
    }
    return { step: 'profile', completedAt: null };
  });
  const [familyMembers, setFamilyMembers] = useState(() => {
    if (!isDemo && uid) {
      const cached = loadProfileFromLocalStorage(uid);
      if (Array.isArray(cached?.familyMembers)) return cached.familyMembers;
    }
    return [];
  });
  const [savedMemories, setSavedMemories] = useState(() => {
    if (!isDemo && uid) {
      const cached = loadProfileFromLocalStorage(uid);
      if (Array.isArray(cached?.savedMemories)) return cached.savedMemories;
    }
    return [];
  });
  const [pendingFacts, setPendingFacts] = useState([]);

  const { loadingProfile, syncBlocked, retrySync } = useProfileSync({
    user,
    isAuthenticated,
    isDemo,
    uid,
    profileData,
    preferredName,
    onboarding,
    familyMembers,
    savedMemories,
    setProfileData,
    setPreferredName,
    setOnboarding,
    setFamilyMembers,
    setSavedMemories
  });

  const actions = createProfileActions({
    user,
    isDemo,
    uid,
    profileData,
    preferredName,
    onboarding,
    familyMembers,
    savedMemories,
    pendingFacts,
    setProfileData,
    setPreferredName,
    setOnboarding,
    setFamilyMembers,
    setSavedMemories,
    setPendingFacts
  });

  const normalizedProfile = buildNormalizedProfile({
    profileData,
    preferredName,
    user,
    familyMembers,
    savedMemories
  });

  const contextValue = {
    profile: profileData ? normalizedProfile : null,
    rawProfile: profileData,
    hasProfile: Boolean(profileData),
    syncBlocked,
    retrySync,
    preferredName,
    onboarding,
    loadingProfile,
    familyMembers,
    savedMemories,
    pendingFacts,
    ...actions
  };

  return <ProfileContext.Provider value={contextValue}>{children}</ProfileContext.Provider>;
}

/**
 * Access the active profile context.
 * @returns {object}
 */
export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
