// src/context/profile/demoStorage.js
/**
 * @fileoverview LocalStorage persistence helper for demo user accounts.
 */

import { DEFAULT_DEMO_HOUSEHOLD } from './profileConstants.js';

const DEMO_STORAGE_KEY = 'foggy_demo_profile_v4';

export function loadDemoProfile() {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return DEFAULT_DEMO_HOUSEHOLD;
    const parsed = JSON.parse(raw);
    return {
      profile: parsed.profile || DEFAULT_DEMO_HOUSEHOLD.profile,
      preferredName: parsed.preferredName || DEFAULT_DEMO_HOUSEHOLD.preferredName,
      onboarding: parsed.onboarding || DEFAULT_DEMO_HOUSEHOLD.onboarding,
      familyMembers: parsed.familyMembers || DEFAULT_DEMO_HOUSEHOLD.familyMembers,
      savedMemories: parsed.savedMemories || DEFAULT_DEMO_HOUSEHOLD.savedMemories
    };
  } catch (err) {
    console.warn('Error reading demo profile from localStorage:', err);
    return DEFAULT_DEMO_HOUSEHOLD;
  }
}

export function saveDemoProfile(state) {
  try {
    localStorage.setItem(
      DEMO_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_DEMO_HOUSEHOLD,
        ...state
      })
    );
  } catch (err) {
    console.warn('Error saving demo profile to localStorage:', err);
  }
}
