/**
 * @fileoverview Mutation actions for user profile, household members, and memories.
 */

import { db } from '../../firebase';
import { setStoredCity, DEFAULT_CITY } from '../../services/api';
import { sanitizeObject, sanitizeText } from '../../utils/validation';
import { saveDemoProfile } from './demoStorage.js';
import { DEFAULT_DEMO_HOUSEHOLD } from './profileConstants.js';
import {
  saveUserDoc,
  saveFamilyMemberDoc,
  deleteFamilyMemberDoc,
  saveMemoryDoc,
  deleteMemoryDoc,
  clearAllUserFirestoreData,
  deleteAllAccountFirestoreData
} from './firestoreService.js';

/**
 * Creates profile mutation handler functions.
 * @param {object} params
 * @returns {object} Action methods
 */
export function createProfileActions({
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
}) {
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
      saveDemoProfile({
        profile: profileData,
        preferredName,
        familyMembers: finalMembers,
        onboarding: nextOnb
      });
      return;
    }

    if (!db || !uid) throw new Error('Database not initialized or user not logged in.');
    await saveUserDoc(db, uid, { onboarding: nextOnb });

    if (!livesAlone && Array.isArray(membersList)) {
      for (const m of membersList) {
        const cleanMember = sanitizeObject(m);
        const memberId =
          cleanMember.id || `fam_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
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
      saveDemoProfile({
        profile: updated,
        preferredName,
        familyMembers,
        savedMemories,
        onboarding
      });
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
      saveDemoProfile({
        profile: profileData,
        preferredName: clean,
        familyMembers,
        savedMemories,
        onboarding
      });
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
      saveDemoProfile({
        profile: profileData,
        preferredName,
        familyMembers: next,
        savedMemories,
        onboarding
      });
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
      saveDemoProfile({
        profile: profileData,
        preferredName,
        familyMembers: next,
        savedMemories,
        onboarding
      });
      return;
    }
    if (!db || !uid) return;
    await saveFamilyMemberDoc(db, uid, memberId, clean);
  };

  const deleteFamilyMember = async (memberId) => {
    if (isDemo) {
      const next = familyMembers.filter((m) => m.id !== memberId);
      setFamilyMembers(next);
      saveDemoProfile({
        profile: profileData,
        preferredName,
        familyMembers: next,
        savedMemories,
        onboarding
      });
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
      saveDemoProfile({
        profile: profileData,
        preferredName,
        familyMembers,
        savedMemories: next,
        onboarding
      });
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
      saveDemoProfile({
        profile: profileData,
        preferredName,
        familyMembers,
        savedMemories: next,
        onboarding
      });
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
    } catch (_e) {
      // Ignore cache clear error
    }
    setProfileData(null);
    setFamilyMembers([]);
    setSavedMemories([]);
    setOnboarding({ step: 'profile', completedAt: null });
  };

  return {
    saveOnboardingProfile,
    saveOnboardingFamily,
    updateProfile,
    updatePreferredName,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    addExtractedMemory,
    deleteMemory,
    queuePendingFact,
    acceptPendingFact,
    dismissPendingFact,
    clearAllUserData,
    deleteAllAccountData
  };
}
