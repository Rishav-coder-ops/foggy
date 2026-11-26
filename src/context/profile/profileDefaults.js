/**
 * @fileoverview Default profile schemas, coordinate resolution, and profile normalization helpers.
 */

import { geocodeIndianCity } from '../../../shared/timeline/timelineService.js';

const KOLKATA_LATITUDE = 22.5726;
const KOLKATA_LONGITUDE = 88.3639;
const COORDINATE_TOLERANCE = 0.01;

/**
 * Checks and resolves coordinates for a profile if missing or mismatched to Kolkata defaults.
 * @param {object} profileObj - Raw profile object
 * @returns {Promise<object>} Profile with verified coordinates
 */
export async function ensureVerifiedCoordinates(profileObj) {
  if (!profileObj || !profileObj.city) return profileObj;
  const isKolkata = profileObj.city.toLowerCase().includes('kolkata');
  const hasKolkataCoords =
    profileObj.latitude != null &&
    profileObj.longitude != null &&
    Math.abs(Number(profileObj.latitude) - KOLKATA_LATITUDE) < COORDINATE_TOLERANCE &&
    Math.abs(Number(profileObj.longitude) - KOLKATA_LONGITUDE) < COORDINATE_TOLERANCE;
  const missingCoords =
    profileObj.latitude == null ||
    profileObj.longitude == null ||
    isNaN(Number(profileObj.latitude)) ||
    isNaN(Number(profileObj.longitude));

  if (missingCoords || (!isKolkata && hasKolkataCoords)) {
    const query = profileObj.state ? `${profileObj.city}, ${profileObj.state}` : profileObj.city;
    try {
      const resolved = await geocodeIndianCity(query);
      if (resolved && resolved.latitude != null && resolved.longitude != null) {
        return {
          ...profileObj,
          latitude: resolved.latitude,
          longitude: resolved.longitude,
          city: resolved.name || profileObj.city,
          state: resolved.admin1 || profileObj.state || ''
        };
      }
    } catch {}
  }
  return profileObj;
}

/**
 * Normalizes profile fields for consumption throughout the application.
 * @param {object} params
 * @param {object|null} params.profileData - Raw user profile state
 * @param {string} params.preferredName - User's preferred first name
 * @param {object} [params.user] - Firebase Auth user object
 * @param {Array<object>} [params.familyMembers=[]] - Saved family members
 * @param {Array<object>} [params.savedMemories=[]] - Extracted memories
 * @returns {object} Normalized profile object
 */
export function buildNormalizedProfile({
  profileData,
  preferredName,
  user,
  familyMembers = [],
  savedMemories = []
}) {
  return {
    ...(profileData || {}),
    location: profileData?.city || profileData?.location || '',
    city: profileData?.city || profileData?.location || '',
    state: profileData?.state || '',
    country: profileData?.country || 'India',
    fullName: profileData?.fullName || preferredName || user?.displayName || 'User',
    preferredName: preferredName || profileData?.fullName?.split(' ')[0] || 'Friend',
    latitude:
      profileData?.latitude != null && !isNaN(Number(profileData.latitude))
        ? Number(profileData.latitude)
        : null,
    longitude:
      profileData?.longitude != null && !isNaN(Number(profileData.longitude))
        ? Number(profileData.longitude)
        : null,
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
}
