/**
 * @fileoverview Client Profile API service for Foggy personalization endpoints.
 */

import { auth } from '../firebase';

const PERSONALIZE_TIMEOUT_MS = 25000;

/**
 * Sends a personalization request to /api/personalize.
 * @param {object} params
 * @param {object} params.member - Target family member profile
 * @param {string} [params.prompt] - Personalization prompt
 * @param {object} [params.context] - Household and AQI context
 * @param {string} [params.idToken] - Optional pre-fetched auth ID token
 * @returns {Promise<object>} Response with memo/reply
 */
export async function requestPersonalizeMemo({ member, prompt, context, idToken = null }) {
  let token = idToken;
  if (!token && auth && auth.currentUser && typeof auth.currentUser.getIdToken === 'function') {
    try {
      token = await auth.currentUser.getIdToken();
    } catch (_err) {
      token = null;
    }
  }

  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/personalize', {
    method: 'POST',
    headers,
    body: JSON.stringify({ member, prompt, context }),
    signal: AbortSignal.timeout(PERSONALIZE_TIMEOUT_MS)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.message || errorData.error || `Personalize request failed with status ${res.status}`
    );
  }

  return await res.json();
}
