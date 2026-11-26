/**
 * @fileoverview LocalStorage persistence helpers for user and household profiles.
 */

const STORAGE_PROFILE_PREFIX = 'foggy_profile_';

/**
 * Returns the localStorage key for a specific user ID.
 * @param {string} uid - User ID
 * @returns {string} Key
 */
export function getProfileLocalStorageKey(uid) {
  return `${STORAGE_PROFILE_PREFIX}${uid}`;
}

/**
 * Reads a user profile from localStorage.
 * @param {string} uid - User ID
 * @returns {object|null}
 */
export function loadProfileFromLocalStorage(uid) {
  if (!uid || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getProfileLocalStorageKey(uid));
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

/**
 * Saves a user profile to localStorage.
 * @param {string} uid - User ID
 * @param {object} data - Profile data payload
 */
export function saveProfileToLocalStorage(uid, data) {
  if (!uid || !data || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(getProfileLocalStorageKey(uid), JSON.stringify(data));
  } catch {}
}
