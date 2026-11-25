// shared/geocode.js
/**
 * @fileoverview Shared location matching, Indian state/city alias resolution,
 * city-to-state validation, ranking, and coordinate deduplication.
 */

import {
  STATE_ALIASES,
  CITY_ALIASES,
  CITY_TO_STATE_MAP,
  INDIAN_FALLBACK_CITIES
} from './geocodeData.js';

export { STATE_ALIASES, CITY_ALIASES, CITY_TO_STATE_MAP, INDIAN_FALLBACK_CITIES };

/**
 * Normalizes an Indian country code to 2-letter ISO ('IN').
 * @param {string} [code='IN']
 * @returns {string}
 */
export function normalizeCountryCode(code) {
  if (!code || typeof code !== 'string') return 'IN';
  const clean = code.trim().toLowerCase();
  if (clean === 'india' || clean === 'in' || clean === 'ind') return 'IN';
  return clean.slice(0, 2).toUpperCase();
}

/**
 * Normalizes input: trim, lower-case, remove diacritics, strip punctuation, collapse whitespace.
 * @param {string} text
 * @returns {string}
 */
export function normalizeLocationQuery(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes an Indian state name.
 * @param {string} state - Raw state name.
 * @returns {string}
 */
export function normalizeStateName(state) {
  if (!state || typeof state !== 'string') return '';
  const clean = normalizeLocationQuery(state);
  return STATE_ALIASES[clean] || clean;
}

/**
 * Checks if two state names refer to the same Indian state.
 * @param {string} state1 - First state name.
 * @param {string} state2 - Second state name.
 * @returns {boolean}
 */
export function statesMatch(state1, state2) {
  if (!state1 || !state2) return false;
  const n1 = normalizeStateName(state1);
  const n2 = normalizeStateName(state2);
  if (!n1 || !n2) return false;
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
}

/**
 * Extracts city and state if separated by comma or separator.
 * e.g. "Bhubaneswar, Odisha" -> { city: "Bhubaneswar", state: "Odisha" }
 * @param {string} query
 * @returns {{ city: string, state: string }}
 */
export function extractCityAndState(query) {
  if (!query || typeof query !== 'string') return { city: '', state: '' };
  const parts = query
    .split(/[,–—|-]/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { city: parts[0], state: parts.slice(1).join(', ') };
  }
  return { city: query.trim(), state: '' };
}

/**
 * Resolves standard city name from alias, abbreviation, or spelling variant.
 * @param {string} query - Raw city query.
 * @returns {string} Canonical name or input.
 */
export function resolveCityAlias(query) {
  if (!query || typeof query !== 'string') return '';
  const clean = normalizeLocationQuery(query);
  return CITY_ALIASES[clean] || query.trim();
}

/**
 * Validates whether a city belongs to the specified Indian state.
 * @param {string} city - City name.
 * @param {string} state - Selected Indian State/UT.
 * @returns {{ valid: boolean, expectedState?: string, message?: string }}
 */
export function isValidCityStatePair(city, state) {
  if (!city || !state) {
    return { valid: true };
  }

  const canonicalCity = resolveCityAlias(city);
  const expectedState = CITY_TO_STATE_MAP[canonicalCity] || CITY_TO_STATE_MAP[city];

  if (!expectedState) {
    // If city is not in the explicit mapping, assume valid (geocoding admin1 check will handle unknown places)
    return { valid: true };
  }

  // Chandigarh is valid for Chandigarh, Punjab, and Haryana
  if (canonicalCity === 'Chandigarh') {
    const isChState = ['chandigarh', 'punjab', 'haryana'].some((s) => statesMatch(state, s));
    if (isChState) return { valid: true };
  }

  if (statesMatch(state, expectedState)) {
    return { valid: true, expectedState };
  }

  return {
    valid: false,
    expectedState,
    message: `Selected location '${canonicalCity}' belongs to ${expectedState}, not ${state}. Please select a matching city in ${state}.`
  };
}

/**
 * Ranks and de-duplicates geocoded results by relevance, state match, population,
 * and coordinate proximity.
 * @param {Array<object>} results
 * @param {string} query
 * @param {string} [targetState='']
 * @returns {Array<object>}
 */
export function rankAndDeduplicateLocations(results, query, targetState = '') {
  if (!Array.isArray(results) || results.length === 0) return [];

  const cleanQuery = normalizeLocationQuery(query);
  const canonicalQuery = normalizeLocationQuery(resolveCityAlias(query));
  const normTargetState = normalizeStateName(targetState);

  // Score each result
  const scored = results.map((item) => {
    let score = 0;
    const nameNorm = normalizeLocationQuery(item.name);
    const adminNorm = normalizeStateName(item.admin1 || '');

    // 1. Exact match on normalized query or alias
    if (nameNorm === cleanQuery || nameNorm === canonicalQuery) {
      score += 100;
    } else if (nameNorm.startsWith(cleanQuery) || nameNorm.startsWith(canonicalQuery)) {
      score += 50;
    } else if (nameNorm.includes(cleanQuery) || nameNorm.includes(canonicalQuery)) {
      score += 25;
    }

    // 2. State match
    if (normTargetState) {
      if (statesMatch(normTargetState, adminNorm)) {
        score += 80;
      }
    }

    // 3. Population boost
    if (item.population && typeof item.population === 'number') {
      score += Math.min(item.population / 100000, 20);
    }

    return { item, score };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // De-duplicate by coordinates rounded to 2 decimals (~1km radius)
  const seenCoords = new Set();
  const deduped = [];

  for (const { item } of scored) {
    if (typeof item.latitude !== 'number' || typeof item.longitude !== 'number') continue;
    const coordKey = `${item.latitude.toFixed(2)}_${item.longitude.toFixed(2)}`;
    if (!seenCoords.has(coordKey)) {
      seenCoords.add(coordKey);
      deduped.push(item);
    }
  }

  return deduped;
}
