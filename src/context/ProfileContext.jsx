// src/context/ProfileContext.jsx
/**
 * @fileoverview React Context Provider for user and household profile state.
 * Supports demo account isolation via localStorage and real user sync with Firestore.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { setStoredCity, DEFAULT_CITY } from '../services/api';
import { sanitizeObject, sanitizeText } from '../utils/validation';
import {
  CURRENT_PROFILE_SEED_VERSION,
  COOKING_OPTIONS,
  HEATING_OPTIONS,
  COMMUTE_OPTIONS,
  DEFAULT_DEMO_HOUSEHOLD
} from './profile/profileConstants.js';
import { loadDemoProfile, saveDemoProfile } from './profile/demoStorage.js';
import {
  subscribeToUserDoc,
  subscribeToFamilyCollection,
  subscribeToMemoryCollection,
  saveUserDoc,
  saveFamilyMemberDoc,
  deleteFamilyMemberDoc,
  saveMemoryDoc,
  deleteMemoryDoc,
  clearAllUserFirestoreData,
  deleteAllAccountFirestoreData
} from './profile/firestoreService.js';

export {
  CURRENT_PROFILE_SEED_VERSION,
  COOKING_OPTIONS,
  HEATING_OPTIONS,
  COMMUTE_OPTIONS,
  DEFAULT_DEMO_HOUSEHOLD
};

const ProfileContext = createContext();

export function ProfileProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const isDemo = !!user?.isDemo;
  const uid = user?.uid;

  const [profileData, setProfileData] = useState(null);
  const [preferredName, setPreferredName] = useState('');
  const [onboarding, setOnboarding] = useState({ step: 'profile', completedAt: null });
  const [familyMembers, setFamilyMembers] = useState([]);
  const [savedMemories, setSavedMemories] = useState([]);
  const [pendingFacts, setPendingFacts] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !uid) {
      setProfileData(null);
      setPreferredName('');
      setOnboarding({ step: 'profile', completedAt: null });
      setFamilyMembers([]);
      setSavedMemories([]);
      setLoadingProfile(false);
      return;
    }

    if (isDemo) {
      const demoState = loadDemoProfile();
      setProfileData(demoState.profile);
      setPreferredName(demoState.preferredName || 'Demo User');
      setOnboarding(demoState.onboarding || { step: 'done', completedAt: new Date().toISOString() });
      setFamilyMembers(demoState.familyMembers || []);
      setSavedMemories(demoState.savedMemories || []);
      setLoadingProfile(false);
      return;
    }

    if (!db) {
      console.warn('Firestore database instance not ready.');
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);

    const unsubUser = subscribeToUserDoc(
      db,
      uid,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProfileData(data.profile || null);
          setPreferredName(
            data.preferredName ||
              data.profile?.fullName?.split(' ')[0] ||
              user.displayName?.split(' ')[0] ||
              'Friend'
          );
          setOnboarding(data.onboarding || { step: 'profile', completedAt: null });

          if (data.profile?.city) {
            setStoredCity({
              name: data.profile.city,
              admin1: data.profile.state || '',
              country: data.profile.country || 'India',
              lat: data.profile.latitude || 22.5726,
              lon: data.profile.longitude || 88.3639
            });
          }
        } else {
          setProfileData(null);
          setPreferredName(user.displayName?.split(' ')[0] || '');
          setOnboarding({ step: 'profile', completedAt: null });
        }
        setLoadingProfile(false);
      },
      (error) => {
        console.error('Firestore user snapshot error:', error);
        setLoadingProfile(false);
      }
    );

    const unsubFamily = subscribeToFamilyCollection(
      db,
      uid,
      (snapshot) => {
        const members = [];
        snapshot.forEach((d) => members.push({ id: d.id, ...d.data() }));
        setFamilyMembers(members);
      },
      (error) => console.warn('Firestore family snapshot error:', error)
    );

    const unsubMemory = subscribeToMemoryCollection(
      db,
      uid,
      (snapshot) => {
        const memories = [];
        snapshot.forEach((d) => memories.push({ id: d.id, ...d.data() }));
        setSavedMemories(memories);
      },
      (error) => console.warn('Firestore memory snapshot error:', error)
    );

    return () => {
      unsubUser();
      unsubFamily();
      unsubMemory();
    };
  }, [isAuthenticated, uid, isDemo, user?.displayName]);

  const saveOnboardingProfile = async (sanitizedProfile) => {
    const clean = sanitizeObject(sanitizedProfile);
    const prefName = clean.fullName?.split(' ')[0] || 'Friend';
    const nextOnb = { step: 'family', completedAt: null };

    if (isDemo) {
      setProfileData(clean);
      setPreferredName(prefName);
      setOnboarding(nextOnb);
      saveDemoProfile({ profile: clean, preferredName: prefName, onboarding: nextOnb });
      return clean;
    }

    if (!db || !uid) throw new Error('Database not initialized or user not logged in.');
    await saveUserDoc(db, uid, {
      profile: clean,
      preferredName: prefName,
      consentAcceptedAt: clean.consentAcceptedAt || new Date().toISOString(),
      onboarding: nextOnb
    });
    setProfileData(clean);
    setPreferredName(prefName);
    setOnboarding(nextOnb);
    return clean;
  };

  const saveOnboardingFamily = async (membersList = [], livesAlone = false) => {
    const nextOnb = { step: 'done', completedAt: new Date().toISOString() };
    const finalMembers = livesAlone ? [] : membersList.map((m) => sanitizeObject(m));

    if (isDemo) {
      setFamilyMembers(finalMembers);
      setOnboarding(nextOnb);
      saveDemoProfile({ profile: profileData, preferredName, familyMembers: finalMembers, onboarding: nextOnb });
      return;
    }

    if (!db || !uid) throw new Error('Database not initialized or user not logged in.');
    await saveUserDoc(db, uid, { onboarding: nextOnb });

    if (!livesAlone && Array.isArray(membersList)) {
      for (const m of membersList) {
        const cleanMember = sanitizeObject(m);
        const memberId = cleanMember.id || `fam_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        await saveFamilyMemberDoc(db, uid, memberId, cleanMember);
      }
    }
    setOnboarding(nextOnb);
  };

  const updateProfile = async (partialUpdates) => {
    const cleanUpdates = sanitizeObject(partialUpdates);
    const updated = { ...(profileData || {}), ...cleanUpdates };

    if (isDemo) {
      setProfileData(updated);
      saveDemoProfile({ profile: updated, preferredName, familyMembers, savedMemories, onboarding });
      return;
    }

    if (!db || !uid) return;
    await saveUserDoc(db, uid, { profile: updated });
  };

  const updatePreferredName = async (name) => {
    const clean = sanitizeText(name, 30);
    if (!clean) return;
    setPreferredName(clean);

    if (isDemo) {
      saveDemoProfile({ profile: profileData, preferredName: clean, familyMembers, savedMemories, onboarding });
      return;
    }

    if (!db || !uid) return;
    await saveUserDoc(db, uid, { preferredName: clean });
  };

  const addFamilyMember = async (member) => {
    const clean = sanitizeObject(member);
    const memberId = clean.id || `fam_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const fullMember = { ...clean, id: memberId, createdAt: new Date().toISOString() };

    if (isDemo) {
      const next = [...familyMembers, fullMember];
      setFamilyMembers(next);
      saveDemoProfile({ profile: profileData, preferredName, familyMembers: next, savedMemories, onboarding });
      return fullMember;
    }

    if (!db || !uid) return fullMember;
    await saveFamilyMemberDoc(db, uid, memberId, fullMember);
    return fullMember;
  };

  const updateFamilyMember = async (memberId, partialUpdates) => {
    const clean = sanitizeObject(partialUpdates);
    if (isDemo) {
      const next = familyMembers.map((m) => (m.id === memberId ? { ...m, ...clean } : m));
      setFamilyMembers(next);
      saveDemoProfile({ profile: profileData, preferredName, familyMembers: next, savedMemories, onboarding });
      return;
    }
    if (!db || !uid) return;
    await saveFamilyMemberDoc(db, uid, memberId, clean);
  };

  const deleteFamilyMember = async (memberId) => {
    if (isDemo) {
      const next = familyMembers.filter((m) => m.id !== memberId);
      setFamilyMembers(next);
      saveDemoProfile({ profile: profileData, preferredName, familyMembers: next, savedMemories, onboarding });
      return;
    }
    if (!db || !uid) return;
    await deleteFamilyMemberDoc(db, uid, memberId);
  };

  const addExtractedMemory = async (detail, category = 'Personal Observation') => {
    const cleanDetail = sanitizeText(detail, 500);
    if (!cleanDetail) return;
    const factId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newMemory = {
      id: factId,
      category: sanitizeText(category, 60),
      detail: cleanDetail,
      dateSaved: new Date().toISOString().split('T')[0],
      source: 'Foggy conversation'
    };

    if (isDemo) {
      const next = [newMemory, ...savedMemories].slice(0, 50);
      setSavedMemories(next);
      saveDemoProfile({ profile: profileData, preferredName, familyMembers, savedMemories: next, onboarding });
      return newMemory;
    }

    if (!db || !uid) return newMemory;
    await saveMemoryDoc(db, uid, factId, newMemory);
    return newMemory;
  };

  const deleteMemory = async (factId) => {
    if (isDemo) {
      const next = savedMemories.filter((m) => m.id !== factId);
      setSavedMemories(next);
      saveDemoProfile({ profile: profileData, preferredName, familyMembers, savedMemories: next, onboarding });
      return;
    }
    if (!db || !uid) return;
    await deleteMemoryDoc(db, uid, factId);
  };

  const queuePendingFact = (fact) => {
    if (!fact) return;
    setPendingFacts((prev) => [
      ...prev,
      { ...fact, id: `pf_${Date.now()}_${Math.random().toString(36).substr(2, 4)}` }
    ]);
  };

  const acceptPendingFact = (factId) => {
    const fact = pendingFacts.find((f) => f.id === factId);
    if (!fact) return;
    if (fact.type === 'family') {
      addFamilyMember({
        name: fact.name || 'Family Member',
        relationship: fact.role || 'Dependent',
        condition: fact.condition || 'Respiratory Care',
        conditions: [fact.condition || 'Other'],
        sensitivity: 'High',
        age: fact.age || 30
      });
      addExtractedMemory(
        `Added ${fact.name || 'family member'} with ${fact.condition || 'health concern'}.`,
        'Family Health'
      );
    } else {
      addExtractedMemory(fact.detail || JSON.stringify(fact), 'Personal Observation');
    }
    setPendingFacts((prev) => prev.filter((f) => f.id !== factId));
  };

  const dismissPendingFact = (factId) => {
    setPendingFacts((prev) => prev.filter((f) => f.id !== factId));
  };

  const clearAllUserData = async () => {
    if (isDemo) {
      setProfileData(DEFAULT_DEMO_HOUSEHOLD.profile);
      setPreferredName('Demo User');
      setOnboarding(DEFAULT_DEMO_HOUSEHOLD.onboarding);
      setFamilyMembers(DEFAULT_DEMO_HOUSEHOLD.familyMembers);
      setSavedMemories(DEFAULT_DEMO_HOUSEHOLD.savedMemories);
      setPendingFacts([]);
      saveDemoProfile(DEFAULT_DEMO_HOUSEHOLD);
      setStoredCity(DEFAULT_CITY);
      return;
    }
    if (db && uid) {
      await clearAllUserFirestoreData(db, uid, user?.displayName?.split(' ')[0] || '');
    }
    setProfileData(null);
    setPreferredName(user?.displayName?.split(' ')[0] || '');
    setOnboarding({ step: 'profile', completedAt: null });
    setFamilyMembers([]);
    setSavedMemories([]);
    setPendingFacts([]);
    setStoredCity(DEFAULT_CITY);
  };

  const deleteAllAccountData = async () => {
    if (db && uid && !isDemo) {
      await deleteAllAccountFirestoreData(db, uid);
    }
    try {
      localStorage.removeItem(`foggy_chat_history_${uid}`);
      localStorage.removeItem(`foggy_profile_${uid}`);
      localStorage.removeItem('foggy_demo_profile_v4');
      localStorage.removeItem('foggy_demo_session');
    } catch (e) {
      console.warn('Cache clear error:', e);
    }
    setProfileData(null);
    setFamilyMembers([]);
    setSavedMemories([]);
    setOnboarding({ step: 'profile', completedAt: null });
  };

  const normalizedProfile = {
    ...(profileData || {}),
    location: profileData?.city || profileData?.location || 'Kolkata',
    city: profileData?.city || profileData?.location || 'Kolkata',
    state: profileData?.state || 'West Bengal',
    country: profileData?.country || 'India',
    fullName: profileData?.fullName || preferredName || user?.displayName || 'User',
    preferredName: preferredName || profileData?.fullName?.split(' ')[0] || 'Friend',
    latitude: profileData?.latitude || 22.5726,
    longitude: profileData?.longitude || 88.3639,
    timezone: profileData?.timezone || 'Asia/Kolkata',
    commute: Array.isArray(profileData?.commute)
      ? profileData.commute.join(', ')
      : profileData?.commute || 'Metro',
    lifestyle: profileData?.lifestyle || [],
    conditions: profileData?.conditions || [],
    sensitivity: profileData?.sensitivity || 'Low',
    familyMembers,
    savedMemories
  };

  return (
    <ProfileContext.Provider
      value={{
        profile: normalizedProfile,
        rawProfile: profileData,
        preferredName,
        updatePreferredName,
        onboarding,
        loadingProfile,
        saveOnboardingProfile,
        saveOnboardingFamily,
        updateProfile,
        familyMembers,
        addFamilyMember,
        updateFamilyMember,
        deleteFamilyMember,
        savedMemories,
        addExtractedMemory,
        deleteMemory,
        pendingFacts,
        queuePendingFact,
        acceptPendingFact,
        dismissPendingFact,
        clearAllUserData,
        deleteAllAccountData
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
