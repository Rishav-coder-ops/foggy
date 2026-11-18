// src/context/ProfileContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ProfileContext = createContext();

const DEFAULT_PROFILE = {
  location: 'Salt Lake City',
  commute: 'Public Transit',
  heatingType: 'Natural Gas Furnace',
  cookingType: 'Induction Cooktop',
  budget: 'Balanced / Practical',
  homeType: 'Apartment (3rd floor)',
  vulnerabilities: ['Mild Asthma', 'Child in household'],
  familyMembers: [
    {
      id: 'fam_1',
      name: 'Leo (Son)',
      role: 'Child',
      age: 7,
      condition: 'Asthma (Uses Albuterol)',
      sensitivity: 'High',
      notes: 'Loves soccer outdoors; needs indoor activity alternative during high smog days.'
    },
    {
      id: 'fam_2',
      name: 'Grandma Helen',
      role: 'Senior',
      age: 74,
      condition: 'Hypertension',
      sensitivity: 'High',
      notes: 'Morning walk routine needs to shift to afternoon.'
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
      detail: 'Son Leo experiences wheezing when AQI rises above 120.',
      dateSaved: '2026-11-10',
      source: 'User shared in chat'
    },
    {
      id: 'mem_2',
      category: 'Home Filtration',
      detail: 'Built a Corsi-Rosenthal DIY box fan filter with 4 MERV-13 filters for the living room.',
      dateSaved: '2026-11-12',
      source: 'User confirmed hack'
    },
    {
      id: 'mem_3',
      category: 'Transit Swap',
      detail: 'Swapped 4 days of solo driving for the light rail transit line.',
      dateSaved: '2026-11-14',
      source: 'Routine check'
    }
  ],
  chatSummary: 'User lives in an inversion-prone valley with child with asthma and senior. Prioritizes budget DIY filtration and shifts outdoor time to afternoon dispersion window.'
};

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const userUid = user?.uid || user?.id;
  const storageKey = userUid ? `foggy_profile_${userUid}` : 'foggy_profile_guest';

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
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
        setProfile(JSON.parse(saved));
      } else {
        setProfile(DEFAULT_PROFILE);
      }
    } catch {
      setProfile(DEFAULT_PROFILE);
    }
  }, [storageKey]);

  // Persist profile changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(profile));
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
      familyMembers: [...prev.familyMembers, newMember]
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
      savedMemories: [newMemory, ...prev.savedMemories]
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
    // Avoid duplicate pending facts
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
      location: 'Salt Lake City',
      commute: 'Public Transit',
      heatingType: 'Electric Heat Pump',
      cookingType: 'Induction Cooktop',
      budget: 'Balanced / Practical',
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
