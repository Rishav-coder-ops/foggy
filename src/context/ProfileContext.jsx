// src/context/ProfileContext.jsx
// Complete Firestore-backed user profile persistence with local caching,
// support for 2-step onboarding, family subcollection, learned memory,
// and offline/demo account isolation.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  limit,
  serverTimestamp
} from '../firebase';
import { setStoredCity, DEFAULT_CITY } from '../services/api';
import { sanitizeObject, sanitizeText } from '../utils/validation';

const ProfileContext = createContext();

export const CURRENT_PROFILE_SEED_VERSION = 4;

export const COOKING_OPTIONS = [
  'LPG Cylinder',
  'PNG (Piped Natural Gas)',
  'Induction Cooktop',
  'Electric Hotplate',
  'Wood or dung-cake chulha',
  'Coal or charcoal angithi'
];

export const HEATING_OPTIONS = [
  'Electric geyser or heater',
  'Electric room heater',
  'LPG or gas heater',
  'Wood or dung-cake chulha',
  'Coal or charcoal angithi',
  'Open fire for warmth',
  'None (Mild climate)'
];

export const COMMUTE_OPTIONS = [
  'Walk',
  'Cycle',
  'Two-wheeler',
  'Car',
  'Auto-rickshaw',
  'E-rickshaw',
  'Bus',
  'Metro',
  'Train'
];

// Default demo household profiles (used strictly for demo account in localStorage)
export const DEFAULT_DEMO_HOUSEHOLD = {
  _seedVersion: CURRENT_PROFILE_SEED_VERSION,
  profile: {
    fullName: 'Demo Parent',
    age: 38,
    country: 'India',
    state: 'West Bengal',
    city: 'Kolkata',
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: 'Asia/Kolkata',
    placeId: 1275004,
    conditions: ['None'],
    otherCondition: '',
    sensitivity: 'Low',
    commute: ['Metro'],
    lifestyle: ['Morning walk', 'Yoga or exercise outdoors'],
    otherLifestyle: '',
    consentAcceptedAt: '2026-11-19T00:00:00.000Z'
  },
  preferredName: 'Demo Parent',
  onboarding: {
    step: 'done',
    completedAt: '2026-11-19T00:00:00.000Z'
  },
  familyMembers: [
    {
      id: 'fam_demo_1',
      name: 'Beta (Son)',
      relationship: 'Son',
      age: 7,
      country: 'India',
      state: 'West Bengal',
      city: 'Kolkata',
      latitude: 22.5726,
      longitude: 88.3639,
      timezone: 'Asia/Kolkata',
      placeId: 1275004,
      conditions: ['Asthma'],
      otherCondition: '',
      condition: 'Asthma (uses a salbutamol inhaler)',
      sensitivity: 'High',
      commute: ['Walk'],
      lifestyle: ['Outdoor sports such as cricket or football'],
      otherLifestyle: '',
      notes: 'Loves playing cricket outdoors; needs an indoor activity alternative during high smog days.'
    },
    {
      id: 'fam_demo_2',
      name: 'Dadi',
      relationship: 'Grandmother',
      age: 74,
      country: 'India',
      state: 'West Bengal',
      city: 'Kolkata',
      latitude: 22.5726,
      longitude: 88.3639,
      timezone: 'Asia/Kolkata',
      placeId: 1275004,
      conditions: ['Hypertension'],
      otherCondition: '',
      condition: 'Hypertension',
      sensitivity: 'High',
      commute: ['Walk'],
      lifestyle: ['Morning walk'],
      otherLifestyle: '',
      notes: 'Morning walk routine shifted to afternoon solar window (1:00 PM).'
    },
    {
      id: 'fam_demo_3',
      name: 'Rusty (Golden Retriever)',
      relationship: 'Pet',
      age: 4,
      country: 'India',
      state: 'West Bengal',
      city: 'Kolkata',
      latitude: 22.5726,
      longitude: 88.3639,
      timezone: 'Asia/Kolkata',
      placeId: 1275004,
      conditions: ['None'],
      otherCondition: '',
      condition: 'None',
      sensitivity: 'Moderate',
      commute: [],
      lifestyle: ['Daily outdoor walks'],
      otherLifestyle: '',
      notes: 'Sensitive to eye irritation on haze days.'
    }
  ],
  savedMemories: [
    {
      id: 'mem_demo_1',
      category: 'Health Vulnerability',
      detail: 'Son Beta experiences wheezing when Estimated NAQI reaches the Poor category (above 200).',
      dateSaved: '2026-11-10',
      source: 'User shared in chat'
    },
    {
      id: 'mem_demo_2',
      category: 'Home Filtration',
      detail: 'Built a Corsi-Rosenthal DIY box fan filter with MERV-13 filters for the living room (~₹3,000).',
      dateSaved: '2026-11-12',
      source: 'User confirmed hack'
    },
    {
      id: 'mem_demo_3',
      category: 'Transit Swap',
      detail: 'Swapped 4 days of petrol two-wheeler commuting for the Metro line (~₹180 fuel saved).',
      dateSaved: '2026-11-14',
      source: 'Routine check'
    }
  ],
  chatSummary: 'Indian household in Kolkata with asthmatic child Beta (uses a salbutamol inhaler), Dadi (hypertension), and pet Rusty. Uses LPG cylinder and metro commute, prioritizes budget DIY filtration (~₹3,000), and shifts outdoor activities to the afternoon solar dispersal window.'
};

export function ProfileProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const isDemo = !!user?.isDemo;
  const uid = user?.uid;

  // Real user state
  const [profileData, setProfileData] = useState(null);
  const [preferredName, setPreferredName] = useState('');
  const [onboarding, setOnboarding] = useState({ step: 'profile', completedAt: null });
  const [familyMembers, setFamilyMembers] = useState([]);
  const [savedMemories, setSavedMemories] = useState([]);
  const [pendingFacts, setPendingFacts] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Sync / Subscribe to user data
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

    // 1. DEMO USER: Handled strictly via localStorage, never written to Firestore
    if (isDemo) {
      try {
        const savedDemo = localStorage.getItem('foggy_demo_profile_v4');
        const demoState = savedDemo ? JSON.parse(savedDemo) : DEFAULT_DEMO_HOUSEHOLD;
        setProfileData(demoState.profile);
        setPreferredName(demoState.preferredName || 'Demo User');
        setOnboarding(demoState.onboarding || { step: 'done', completedAt: new Date().toISOString() });
        setFamilyMembers(demoState.familyMembers || []);
        setSavedMemories(demoState.savedMemories || []);
      } catch (err) {
        console.warn('Error reading demo profile:', err);
        setProfileData(DEFAULT_DEMO_HOUSEHOLD.profile);
        setPreferredName('Demo User');
        setOnboarding(DEFAULT_DEMO_HOUSEHOLD.onboarding);
        setFamilyMembers(DEFAULT_DEMO_HOUSEHOLD.familyMembers);
        setSavedMemories(DEFAULT_DEMO_HOUSEHOLD.savedMemories);
      }
      setLoadingProfile(false);
      return;
    }

    // 2. REAL AUTHENTICATED USER: Firestore source of truth with persistent cache
    if (!db) {
      console.warn('Firestore database instance not ready.');
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    const userDocRef = doc(db, 'users', uid);
    const familyColRef = collection(db, 'users', uid, 'family');
    const memoryColRef = collection(db, 'users', uid, 'memory');

    let unsubFamily = () => {};
    let unsubMemory = () => {};

    // Subscribe to root user doc
    const unsubUser = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setProfileData(data.profile || null);
          setPreferredName(data.preferredName || data.profile?.fullName?.split(' ')[0] || user.displayName?.split(' ')[0] || 'Friend');
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
          // Real account starts fresh and empty
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

    // Subscribe to family members subcollection
    unsubFamily = onSnapshot(
      familyColRef,
      (snapshot) => {
        const members = [];
        snapshot.forEach((d) => {
          members.push({ id: d.id, ...d.data() });
        });
        setFamilyMembers(members);
      },
      (error) => {
        console.warn('Firestore family snapshot error:', error);
      }
    );

    // Subscribe to memory subcollection
    unsubMemory = onSnapshot(
      memoryColRef,
      (snapshot) => {
        const memories = [];
        snapshot.forEach((d) => {
          memories.push({ id: d.id, ...d.data() });
        });
        setSavedMemories(memories);
      },
      (error) => {
        console.warn('Firestore memory snapshot error:', error);
      }
    );

    return () => {
      unsubUser();
      unsubFamily();
      unsubMemory();
    };
  }, [isAuthenticated, uid, isDemo]);

  // Save Step 1 Profile to Firestore
  const saveOnboardingProfile = async (sanitizedProfile) => {
    const clean = sanitizeObject(sanitizedProfile);
    const prefName = clean.fullName?.split(' ')[0] || 'Friend';

    if (isDemo) {
      setProfileData(clean);
      setPreferredName(prefName);
      const nextOnb = { step: 'family', completedAt: null };
      setOnboarding(nextOnb);
      localStorage.setItem('foggy_demo_profile_v4', JSON.stringify({
        ...DEFAULT_DEMO_HOUSEHOLD,
        profile: clean,
        preferredName: prefName,
        onboarding: nextOnb
      }));
      return clean;
    }

    if (!db || !uid) throw new Error('Database not initialized or user not logged in.');

    const userDocRef = doc(db, 'users', uid);
    const payload = {
      profile: clean,
      preferredName: prefName,
      consentAcceptedAt: clean.consentAcceptedAt || new Date().toISOString(),
      onboarding: { step: 'family', completedAt: null },
      updatedAt: new Date().toISOString()
    };

    await setDoc(userDocRef, payload, { merge: true });
    setProfileData(clean);
    setPreferredName(prefName);
    setOnboarding({ step: 'family', completedAt: null });
    return clean;
  };

  // Save Step 2 Family to Firestore and complete onboarding
  const saveOnboardingFamily = async (membersList = [], livesAlone = false) => {
    const nextOnboarding = {
      step: 'done',
      completedAt: new Date().toISOString()
    };

    if (isDemo) {
      const finalMembers = livesAlone ? [] : membersList.map(m => sanitizeObject(m));
      setFamilyMembers(finalMembers);
      setOnboarding(nextOnboarding);
      localStorage.setItem('foggy_demo_profile_v4', JSON.stringify({
        ...DEFAULT_DEMO_HOUSEHOLD,
        profile: profileData,
        preferredName,
        familyMembers: finalMembers,
        onboarding: nextOnboarding
      }));
      return;
    }

    if (!db || !uid) throw new Error('Database not initialized or user not logged in.');

    const userDocRef = doc(db, 'users', uid);
    // Mark root document as onboarding done
    await setDoc(userDocRef, {
      onboarding: nextOnboarding,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Save individual family members to subcollection
    if (!livesAlone && Array.isArray(membersList) && membersList.length > 0) {
      for (const m of membersList) {
        const cleanMember = sanitizeObject(m);
        const memberId = cleanMember.id || `fam_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const memberDocRef = doc(db, 'users', uid, 'family', memberId);
        await setDoc(memberDocRef, {
          ...cleanMember,
          id: memberId,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    }

    setOnboarding(nextOnboarding);
  };

  // Update profile attributes (Settings page & Family Profiles page)
  const updateProfile = async (partialUpdates) => {
    const cleanUpdates = sanitizeObject(partialUpdates);
    const updated = { ...(profileData || {}), ...cleanUpdates };

    if (isDemo) {
      setProfileData(updated);
      localStorage.setItem('foggy_demo_profile_v4', JSON.stringify({
        ...DEFAULT_DEMO_HOUSEHOLD,
        profile: updated,
        preferredName,
        familyMembers,
        savedMemories,
        onboarding
      }));
      return;
    }

    if (!db || !uid) return;
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      profile: updated,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  };

  // Update preferredName
  const updatePreferredName = async (name) => {
    const clean = sanitizeText(name, 30);
    if (!clean) return;
    setPreferredName(clean);

    if (isDemo) {
      localStorage.setItem('foggy_demo_profile_v4', JSON.stringify({
        ...DEFAULT_DEMO_HOUSEHOLD,
        profile: profileData,
        preferredName: clean,
        familyMembers,
        savedMemories,
        onboarding
      }));
      return;
    }

    if (!db || !uid) return;
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      preferredName: clean,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  };

  // Add family member
  const addFamilyMember = async (member) => {
    const clean = sanitizeObject(member);
    const memberId = clean.id || `fam_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const fullMember = { ...clean, id: memberId, createdAt: new Date().toISOString() };

    if (isDemo) {
      const next = [...familyMembers, fullMember];
      setFamilyMembers(next);
      localStorage.setItem('foggy_demo_profile_v4', JSON.stringify({
        ...DEFAULT_DEMO_HOUSEHOLD,
        profile: profileData,
        preferredName,
        familyMembers: next,
        savedMemories,
        onboarding
      }));
      return fullMember;
    }

    if (!db || !uid) return fullMember;
    const memberDocRef = doc(db, 'users', uid, 'family', memberId);
    await setDoc(memberDocRef, fullMember);
    return fullMember;
  };

  // Update family member
  const updateFamilyMember = async (memberId, partialUpdates) => {
    const clean = sanitizeObject(partialUpdates);

    if (isDemo) {
      const next = familyMembers.map((m) => (m.id === memberId ? { ...m, ...clean } : m));
      setFamilyMembers(next);
      localStorage.setItem('foggy_demo_profile_v4', JSON.stringify({
        ...DEFAULT_DEMO_HOUSEHOLD,
        profile: profileData,
        preferredName,
        familyMembers: next,
        savedMemories,
        onboarding
      }));
      return;
    }

    if (!db || !uid) return;
    const memberDocRef = doc(db, 'users', uid, 'family', memberId);
    await setDoc(memberDocRef, { ...clean, updatedAt: new Date().toISOString() }, { merge: true });
  };

  // Delete family member
  const deleteFamilyMember = async (memberId) => {
    if (isDemo) {
      const next = familyMembers.filter((m) => m.id !== memberId);
      setFamilyMembers(next);
      localStorage.setItem('foggy_demo_profile_v4', JSON.stringify({
        ...DEFAULT_DEMO_HOUSEHOLD,
        profile: profileData,
        preferredName,
        familyMembers: next,
        savedMemories,
        onboarding
      }));
      return;
    }

    if (!db || !uid) return;
    const memberDocRef = doc(db, 'users', uid, 'family', memberId);
    await deleteDoc(memberDocRef);
  };

  // Add learned memory fact (max 50)
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
      localStorage.setItem('foggy_demo_profile_v4', JSON.stringify({
        ...DEFAULT_DEMO_HOUSEHOLD,
        profile: profileData,
        preferredName,
        familyMembers,
        savedMemories: next,
        onboarding
      }));
      return newMemory;
    }

    if (!db || !uid) return newMemory;
    const memoryDocRef = doc(db, 'users', uid, 'memory', factId);
    await setDoc(memoryDocRef, newMemory);
    return newMemory;
  };

  // Delete memory fact
  const deleteMemory = async (factId) => {
    if (isDemo) {
      const next = savedMemories.filter((m) => m.id !== factId);
      setSavedMemories(next);
      localStorage.setItem('foggy_demo_profile_v4', JSON.stringify({
        ...DEFAULT_DEMO_HOUSEHOLD,
        profile: profileData,
        preferredName,
        familyMembers,
        savedMemories: next,
        onboarding
      }));
      return;
    }

    if (!db || !uid) return;
    const memoryDocRef = doc(db, 'users', uid, 'memory', factId);
    await deleteDoc(memoryDocRef);
  };

  const queuePendingFact = (fact) => {
    if (!fact) return;
    setPendingFacts((prev) => [...prev, { ...fact, id: `pf_${Date.now()}_${Math.random().toString(36).substr(2, 4)}` }]);
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
      addExtractedMemory(`Added ${fact.name || 'family member'} with ${fact.condition || 'health concern'}.`, 'Family Health');
    } else {
      addExtractedMemory(fact.detail || JSON.stringify(fact), 'Personal Observation');
    }
    setPendingFacts((prev) => prev.filter((f) => f.id !== factId));
  };

  const dismissPendingFact = (factId) => {
    setPendingFacts((prev) => prev.filter((f) => f.id !== factId));
  };

  // Clear all user data
  const clearAllUserData = async () => {
    if (isDemo) {
      setProfileData(DEFAULT_DEMO_HOUSEHOLD.profile);
      setPreferredName('Demo User');
      setOnboarding(DEFAULT_DEMO_HOUSEHOLD.onboarding);
      setFamilyMembers(DEFAULT_DEMO_HOUSEHOLD.familyMembers);
      setSavedMemories(DEFAULT_DEMO_HOUSEHOLD.savedMemories);
      setPendingFacts([]);
      localStorage.setItem('foggy_demo_profile_v4', JSON.stringify(DEFAULT_DEMO_HOUSEHOLD));
      setStoredCity(DEFAULT_CITY);
      return;
    }

    if (db && uid) {
      // Delete all family members
      const famSnapshot = await getDocs(collection(db, 'users', uid, 'family'));
      for (const d of famSnapshot.docs) {
        await deleteDoc(doc(db, 'users', uid, 'family', d.id));
      }
      // Delete all memories
      const memSnapshot = await getDocs(collection(db, 'users', uid, 'memory'));
      for (const d of memSnapshot.docs) {
        await deleteDoc(doc(db, 'users', uid, 'memory', d.id));
      }
      // Reset root user doc
      await setDoc(doc(db, 'users', uid), {
        profile: null,
        preferredName: user?.displayName?.split(' ')[0] || '',
        onboarding: { step: 'profile', completedAt: null },
        updatedAt: new Date().toISOString()
      });
    }

    setProfileData(null);
    setPreferredName(user?.displayName?.split(' ')[0] || '');
    setOnboarding({ step: 'profile', completedAt: null });
    setFamilyMembers([]);
    setSavedMemories([]);
    setPendingFacts([]);
    setStoredCity(DEFAULT_CITY);
  };

  // Fully delete all account data in Firestore and local storage (Danger zone)
  const deleteAllAccountData = async () => {
    if (db && uid && !isDemo) {
      const famSnapshot = await getDocs(collection(db, 'users', uid, 'family'));
      for (const d of famSnapshot.docs) {
        await deleteDoc(doc(db, 'users', uid, 'family', d.id));
      }
      const memSnapshot = await getDocs(collection(db, 'users', uid, 'memory'));
      for (const d of memSnapshot.docs) {
        await deleteDoc(doc(db, 'users', uid, 'memory', d.id));
      }
      await deleteDoc(doc(db, 'users', uid));
    }

    // Wipe all local caches for this user
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

  // Normalized profile view for consumption across app components
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
    commute: Array.isArray(profileData?.commute) ? profileData.commute.join(', ') : (profileData?.commute || 'Metro'),
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
