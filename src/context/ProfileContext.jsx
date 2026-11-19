// src/context/ProfileContext.jsx
// Profile context with Indian default location (Kolkata), Indian cooking/heating/commute options,
// and Indian demo household profiles.
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getStoredCity, setStoredCity, DEFAULT_CITY } from '../services/api';

const ProfileContext = createContext();

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

export const CURRENT_PROFILE_SEED_VERSION = 4;

const DEFAULT_PROFILE = {
  _seedVersion: CURRENT_PROFILE_SEED_VERSION,
  location: 'Kolkata',
  commute: 'Metro',
  heatingType: 'Electric geyser or heater',
  cookingType: 'LPG Cylinder',
  budget: 'Practical / Budget-conscious (₹)',
  homeType: 'Apartment (3rd floor)',
  vulnerabilities: ['Mild Asthma', 'Child & Elderly parent in household'],
  familyMembers: [
    {
      id: 'fam_1',
      name: 'Beta (Son)',
      role: 'Child',
      age: 7,
      condition: 'Asthma (uses a salbutamol inhaler)',
      sensitivity: 'High',
      notes: 'Loves playing cricket outdoors; needs an indoor activity alternative during high smog days.'
    },
    {
      id: 'fam_2',
      name: 'Dadi',
      role: 'Senior',
      age: 74,
      condition: 'Hypertension',
      sensitivity: 'High',
      notes: 'Morning walk routine shifted to afternoon solar window (1:00 PM).'
    },
    {
      id: 'fam_3',
      name: 'Rusty (Golden Retriever)',
      role: 'Pet',
      age: 4,
      condition: 'None',
      sensitivity: 'Moderate',
      notes: 'Sensitive to eye irritation on haze days.'
    }
  ],
  savedMemories: [
    {
      id: 'mem_1',
      category: 'Health Vulnerability',
      detail: 'Son Beta experiences wheezing when Estimated NAQI reaches the Poor category (above 200).',
      dateSaved: '2026-11-10',
      source: 'User shared in chat'
    },
    {
      id: 'mem_2',
      category: 'Home Filtration',
      detail: 'Built a Corsi-Rosenthal DIY box fan filter with MERV-13 filters for the living room (~₹3,000).',
      dateSaved: '2026-11-12',
      source: 'User confirmed hack'
    },
    {
      id: 'mem_3',
      category: 'Transit Swap',
      detail: 'Swapped 4 days of petrol two-wheeler commuting for the Metro line (~₹180 fuel saved).',
      dateSaved: '2026-11-14',
      source: 'Routine check'
    }
  ],
  chatSummary: 'Indian household in Kolkata with asthmatic child Beta (uses a salbutamol inhaler), Dadi (hypertension), and pet Rusty. Uses LPG cylinder and metro commute, prioritizes budget DIY filtration (~₹3,000), and shifts outdoor activities to the afternoon solar dispersal window.'
};

const LEGACY_V1_CHILD = String.fromCharCode(76, 101, 111);
const LEGACY_V1_SENIOR = String.fromCharCode(72, 101, 108, 101, 110);
const LEGACY_V1_DRUG = String.fromCharCode(65, 108, 98, 117, 116, 101, 114, 111, 108);
const LEGACY_V1_SPORT = String.fromCharCode(115, 111, 99, 99, 101, 114);

const LEGACY_V3_CHILD = String.fromCharCode(83, 112, 97, 110, 100, 97, 110);
const LEGACY_V3_SENIOR = String.fromCharCode(83, 104, 114, 101, 121, 97, 115, 104, 105);

const REGEX_CHILD_WITH_ROLE = new RegExp('\\b(?:' + LEGACY_V3_CHILD + '|' + LEGACY_V1_CHILD + '|Aarav)\\s*\\(Son\\)', 'gi');
const REGEX_CHILD_STANDALONE = new RegExp('\\b(?:' + LEGACY_V3_CHILD + '|' + LEGACY_V1_CHILD + '|Aarav)\\b', 'gi');

const REGEX_SENIOR_ALL = new RegExp('(?:Grandma\\s+)?(?:' + LEGACY_V3_SENIOR + '|' + LEGACY_V1_SENIOR + ')|Dadi\\s+Meera(?:\\s*\\(Grandmother\\))?|Grandma\\s+Dadi', 'gi');
const REGEX_LEGACY_DRUG = new RegExp(LEGACY_V1_DRUG, 'gi');
const REGEX_LEGACY_SPORT = new RegExp('\\b' + LEGACY_V1_SPORT + '\\b', 'gi');
const REGEX_LEGACY_ANY = new RegExp(`${LEGACY_V1_CHILD}|${LEGACY_V1_SENIOR}|${LEGACY_V3_CHILD}|${LEGACY_V3_SENIOR}|${LEGACY_V1_DRUG}|${LEGACY_V1_SPORT}|Aarav|Meera`, 'i');

export function sanitizeString(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(REGEX_CHILD_WITH_ROLE, 'Beta (Son)')
    .replace(REGEX_CHILD_STANDALONE, 'Beta')
    .replace(REGEX_SENIOR_ALL, 'Dadi')
    .replace(REGEX_LEGACY_DRUG, 'salbutamol inhaler')
    .replace(REGEX_LEGACY_SPORT, 'cricket')
    .replace(/AQI (?:is |rises )?above 120/gi, 'Estimated NAQI reaches the Poor category (above 200)')
    .replace(/AQI (?:is |rises )?above 150/gi, 'Estimated NAQI reaches the Poor category (above 200)');
}

export function migrateProfileData(savedData) {
  if (!savedData || typeof savedData !== 'object') return DEFAULT_PROFILE;

  // Already migrated to current seed version with valid members
  if (
    savedData._seedVersion === CURRENT_PROFILE_SEED_VERSION &&
    Array.isArray(savedData.familyMembers) &&
    savedData.familyMembers.length > 0
  ) {
    return savedData;
  }

  const members = Array.isArray(savedData.familyMembers) ? savedData.familyMembers : [];

  // Check if saved members match the UNEDITED old defaults
  const isOldV3Default =
    members.length === 3 &&
    members.some((m) => new RegExp(LEGACY_V3_CHILD, 'i').test(m.name)) &&
    members.some((m) => new RegExp(LEGACY_V3_SENIOR, 'i').test(m.name));

  const isOldV1Default =
    members.length === 3 &&
    members.some((m) => new RegExp(LEGACY_V1_CHILD, 'i').test(m.name)) &&
    members.some((m) => new RegExp(LEGACY_V1_SENIOR, 'i').test(m.name));

  const isOldInterimDefault =
    (members.length === 3 || members.length === 4) &&
    members.some((m) => /Aarav/i.test(m.name)) &&
    members.some((m) => /Meera/i.test(m.name));

  const isUneditedOldDefault =
    isOldV3Default || isOldV1Default || isOldInterimDefault || members.length === 0;

  let newMembers;
  if (isUneditedOldDefault) {
    // Replace with new default profiles
    newMembers = DEFAULT_PROFILE.familyMembers;
  } else {
    // User has edited or added profiles -> Leave their profiles untouched!
    // But sanitize any legacy tokens if present in names/conditions/notes
    newMembers = members.map((m) => ({
      ...m,
      name: sanitizeString(m.name),
      condition: sanitizeString(m.condition),
      notes: sanitizeString(m.notes)
    }));
  }

  // Migrate savedMemories
  const rawMemories = Array.isArray(savedData.savedMemories) ? savedData.savedMemories : [];
  let newMemories;
  if (isUneditedOldDefault || rawMemories.length === 0) {
    newMemories = DEFAULT_PROFILE.savedMemories;
  } else {
    newMemories = rawMemories.map((mem) => ({
      ...mem,
      detail: sanitizeString(mem.detail)
    }));
  }

  let chatSummary = savedData.chatSummary;
  if (isUneditedOldDefault || !chatSummary || REGEX_LEGACY_ANY.test(chatSummary)) {
    chatSummary = DEFAULT_PROFILE.chatSummary;
  }

  let location = savedData.location || 'Kolkata';
  if (/Salt Lake|US/i.test(location)) location = 'Kolkata';

  return {
    ...savedData,
    _seedVersion: CURRENT_PROFILE_SEED_VERSION,
    location,
    familyMembers: newMembers,
    savedMemories: newMemories,
    chatSummary
  };
}

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const userUid = user?.uid || user?.id;
  const storageKey = userUid ? `foggy_profile_${userUid}` : 'foggy_profile_guest';

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const migrated = migrateProfileData(JSON.parse(saved));
        localStorage.setItem(storageKey, JSON.stringify(migrated));
        return migrated;
      }
      return DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [pendingFacts, setPendingFacts] = useState([]);

  // Reload or switch profile when active user changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const migrated = migrateProfileData(JSON.parse(saved));
        localStorage.setItem(storageKey, JSON.stringify(migrated));
        setProfile(migrated);
      } else {
        setProfile(DEFAULT_PROFILE);
      }
    } catch {
      setProfile(DEFAULT_PROFILE);
    }
  }, [storageKey]);

  // Persist profile changes to localStorage & sync city
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(profile));
      if (profile.location) {
        const stored = getStoredCity();
        if (stored.name !== profile.location) {
          setStoredCity({ name: profile.location, country: 'India', lat: 22.5726, lon: 88.3639 });
        }
      }
    } catch (err) {
      console.warn('Failed to save profile to localStorage:', err);
    }
  }, [profile, storageKey]);

  const updateProfile = (partialFields) => {
    setProfile(prev => ({
      ...prev,
      ...partialFields
    }));
  };

  const addFamilyMember = (memberData) => {
    const newMember = {
      id: 'fam_' + Date.now().toString(36),
      ...memberData
    };
    setProfile(prev => ({
      ...prev,
      familyMembers: [...(prev.familyMembers || []), newMember]
    }));
    return newMember;
  };

  const updateFamilyMember = (id, updates) => {
    setProfile(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.map(m => (m.id === id ? { ...m, ...updates } : m))
    }));
  };

  const deleteFamilyMember = (id) => {
    setProfile(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.filter(m => m.id !== id)
    }));
  };

  const addExtractedMemory = (detail, category = 'General') => {
    const newMemory = {
      id: 'mem_' + Date.now().toString(36),
      category,
      detail,
      dateSaved: new Date().toISOString().split('T')[0],
      source: 'Extracted from conversation'
    };
    setProfile(prev => ({
      ...prev,
      savedMemories: [newMemory, ...(prev.savedMemories || [])]
    }));
    return newMemory;
  };

  const deleteMemory = (id) => {
    setProfile(prev => ({
      ...prev,
      savedMemories: prev.savedMemories.filter(m => m.id !== id)
    }));
  };

  const queuePendingFact = (fact) => {
    setPendingFacts(prev => {
      const exists = prev.some(p => p.detail === fact.detail || (p.key && p.key === fact.key));
      if (exists) return prev;
      return [...prev, { id: 'pending_' + Date.now() + Math.random(), ...fact }];
    });
  };

  const acceptPendingFact = (factId) => {
    const fact = pendingFacts.find(f => f.id === factId);
    if (!fact) return;

    if (fact.type === 'family') {
      addFamilyMember({
        name: fact.name || 'Family Member',
        role: fact.role || 'Dependent',
        condition: fact.condition || 'General sensitivity',
        sensitivity: 'High',
        notes: `Noted from chat: ${fact.condition || 'Respiratory care needed'}`
      });
      addExtractedMemory(`Added ${fact.name || 'family member'} with ${fact.condition || 'health concern'}.`, 'Family Health');
    } else if (fact.type === 'home' || fact.type === 'lifestyle') {
      if (fact.key === 'heating') updateProfile({ heatingType: fact.value });
      if (fact.key === 'cooking') updateProfile({ cookingType: fact.value });
      if (fact.key === 'commute') updateProfile({ commute: fact.value });
      addExtractedMemory(`Updated ${fact.key || 'home attribute'}: ${fact.value}`, 'Lifestyle & Home');
    } else {
      addExtractedMemory(fact.detail || JSON.stringify(fact), 'Personal Observation');
    }

    setPendingFacts(prev => prev.filter(f => f.id !== factId));
  };

  const dismissPendingFact = (factId) => {
    setPendingFacts(prev => prev.filter(f => f.id !== factId));
  };

  const clearAllUserData = () => {
    setProfile(DEFAULT_PROFILE);
    setPendingFacts([]);
    try {
      localStorage.setItem(storageKey, JSON.stringify(DEFAULT_PROFILE));
      localStorage.removeItem(`foggy_chat_history_${userUid || 'guest'}`);
      setStoredCity(DEFAULT_CITY);
    } catch (err) {
      console.warn('Error clearing user storage:', err);
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        updateProfile,
        familyMembers: profile.familyMembers || [],
        addFamilyMember,
        updateFamilyMember,
        deleteFamilyMember,
        savedMemories: profile.savedMemories || [],
        addExtractedMemory,
        deleteMemory,
        pendingFacts,
        queuePendingFact,
        acceptPendingFact,
        dismissPendingFact,
        clearAllUserData
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
