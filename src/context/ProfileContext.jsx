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

const DEFAULT_PROFILE = {
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
      name: 'Aarav (Son)',
      role: 'Child',
      age: 7,
      condition: 'Asthma (Uses Inhaler)',
      sensitivity: 'High',
      notes: 'Loves cricket outdoors; needs indoor activity alternative during high smog days.'
    },
    {
      id: 'fam_2',
      name: 'Dadi Meera',
      role: 'Senior',
      age: 74,
      condition: 'Hypertension & Bronchitis',
      sensitivity: 'High',
      notes: 'Morning walk routine shifted to afternoon solar window (1:00 PM).'
    },
    {
      id: 'fam_3',
      name: 'Sheru (Pet)',
      role: 'Pet',
      age: 4,
      condition: 'None',
      sensitivity: 'Moderate',
      notes: 'Prone to eye watering during severe winter smog episodes.'
    }
  ],
  savedMemories: [
    {
      id: 'mem_1',
      category: 'Health Vulnerability',
      detail: 'Son Aarav experiences wheezing when Estimated NAQI rises above 150.',
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
  chatSummary: 'Indian household in Kolkata with asthmatic child and senior. Uses LPG cylinder and metro commute, prioritizes budget DIY filtration (~₹3,000), and shifts outdoor activities to the afternoon solar dispersal window.'
};

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const userUid = user?.uid || user?.id;
  const storageKey = userUid ? `foggy_profile_${userUid}` : 'foggy_profile_guest';

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Replace obsolete locations like Salt Lake City
        if (parsed.location && (parsed.location.includes('Salt Lake') || parsed.location.includes('US'))) {
          parsed.location = 'Kolkata';
        }
        return parsed;
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
        const parsed = JSON.parse(saved);
        if (parsed.location && (parsed.location.includes('Salt Lake') || parsed.location.includes('US'))) {
          parsed.location = 'Kolkata';
        }
        setProfile(parsed);
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
    const emptyProfile = {
      location: 'Kolkata',
      commute: 'Metro',
      heatingType: 'Electric geyser or heater',
      cookingType: 'LPG Cylinder',
      budget: 'Practical / Budget-conscious (₹)',
      homeType: 'Apartment',
      vulnerabilities: [],
      familyMembers: [],
      savedMemories: [],
      chatSummary: ''
    };
    setProfile(emptyProfile);
    setPendingFacts([]);
    try {
      localStorage.removeItem(storageKey);
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
