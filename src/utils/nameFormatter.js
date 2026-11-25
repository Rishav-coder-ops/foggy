// src/utils/nameFormatter.js
/**
 * @fileoverview Utility for capitalizing and formatting user display names for greetings
 * across Dashboard, Chat, and Onboarding banners.
 */

/**
 * Capitalizes the first character of a string while preserving remaining casing.
 * @param {string} str
 * @returns {string}
 */
export function capitalizeWord(str) {
  if (!str || typeof str !== 'string') return '';
  const trimmed = str.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Formats a user greeting name:
 * - If the user set an explicit preferred name in Settings, it is preserved exactly as typed.
 * - Otherwise, derives the first name from fullName, displayName, or account email and capitalizes it.
 *
 * @param {object} [profile] - Profile object from ProfileContext.
 * @param {object} [user] - Auth user object from AuthContext.
 * @returns {string} Formatted greeting name (e.g., 'Rishav').
 */
export function formatGreetingName(profile, user) {
  // 1. Explicit preferred name configured by user in Settings - preserve exact casing
  const explicitPref =
    profile?.preferredName && typeof profile.preferredName === 'string'
      ? profile.preferredName.trim()
      : '';

  if (
    explicitPref &&
    explicitPref.toLowerCase() !== 'friend' &&
    explicitPref.toLowerCase() !== 'user'
  ) {
    return explicitPref;
  }

  // 2. Full name from profile
  if (profile?.fullName && typeof profile.fullName === 'string' && profile.fullName.trim()) {
    const firstWord = profile.fullName.trim().split(' ')[0];
    if (firstWord && firstWord.toLowerCase() !== 'user' && firstWord.toLowerCase() !== 'friend') {
      return capitalizeWord(firstWord);
    }
  }

  // 3. Display name from auth provider (Google, Firebase, etc.)
  const rawDisplayName = user?.displayName || user?.name;
  if (rawDisplayName && typeof rawDisplayName === 'string' && rawDisplayName.trim()) {
    const firstWord = rawDisplayName.trim().split(' ')[0];
    if (firstWord && firstWord.toLowerCase() !== 'user' && firstWord.toLowerCase() !== 'friend') {
      return capitalizeWord(firstWord);
    }
  }

  // 4. Handle from account email (e.g., "rishav.nandi@domain.com" -> "Rishav")
  if (user?.email && typeof user.email === 'string' && user.email.includes('@')) {
    const emailPrefix = user.email.split('@')[0];
    const candidate = emailPrefix.split(/[._-]/)[0];
    if (candidate && candidate.length > 1) {
      return capitalizeWord(candidate);
    }
  }

  return 'Friend';
}
