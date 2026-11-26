/**
 * @fileoverview Resolves verified Indian city coordinates from queries and raw geolocation.
 */

import { INDIAN_METROS, INDIAN_CITY_ALIASES } from '../timeline/constants.js';
import { INDIAN_FALLBACK_CITIES } from '../geocode.js';
import { INDIAN_CITY_SIMULATION_DB } from './simulationDb.js';
import { calculateDistanceKm } from './distance.js';
import { logger } from '../logger.js';

const MAX_COORDINATE_DISTANCE_KM = 60;
const DEFAULT_FALLBACK_LAT = 22.5726;
const DEFAULT_FALLBACK_LON = 88.3639;
const DEFAULT_FALLBACK_DISPLAY = 'Kolkata, West Bengal';

/**
 * Resolves city coordinates and canonical display name from user input or geolocation.
 * Validates against Indian metros, fallback cities, and simulation DB.
 *
 * @param {string} requestedCity - Input city query.
 * @param {number} rawLat - Raw latitude from GPS.
 * @param {number} rawLon - Raw longitude from GPS.
 * @returns {{
 *   lat: number|null,
 *   lon: number|null,
 *   displayCity: string,
 *   notFound?: boolean,
 *   requestedCity?: string
 * }}
 */
export function resolveCityCoordinates(requestedCity, rawLat, rawLon) {
  const queryClean = (requestedCity || '').trim();
  const parts = queryClean.split(',').map((p) => p.trim());
  const cityPart = parts[0] || '';
  const cityNorm = cityPart.toLowerCase();
  const canonicalCity = INDIAN_CITY_ALIASES[cityNorm] || cityPart;
  const canonicalNorm = canonicalCity.toLowerCase();

  let matchedCity = null;

  // 1. Check Indian Metros by city name
  const metroMatch = INDIAN_METROS.find(
    (m) => m.name.toLowerCase() === cityNorm || m.name.toLowerCase() === canonicalNorm
  );
  if (metroMatch) {
    matchedCity = {
      lat: metroMatch.lat,
      lon: metroMatch.lon,
      displayCity: `${metroMatch.name}, ${metroMatch.admin1 || 'India'}`
    };
  }

  // 2. Check Indian Fallback Cities by city name (prioritize city name over state)
  if (!matchedCity && Array.isArray(INDIAN_FALLBACK_CITIES)) {
    const fallbackMatch = INDIAN_FALLBACK_CITIES.find(
      (c) => c.name.toLowerCase() === cityNorm || c.name.toLowerCase() === canonicalNorm
    );
    if (fallbackMatch) {
      matchedCity = {
        lat: fallbackMatch.latitude,
        lon: fallbackMatch.longitude,
        displayCity: `${fallbackMatch.name}, ${fallbackMatch.admin1 ? fallbackMatch.admin1 + ', ' : ''}India`
      };
    }
  }

  // 3. Check Simulation DB
  if (!matchedCity) {
    const dbKey = Object.keys(INDIAN_CITY_SIMULATION_DB).find(
      (k) => k.toLowerCase() === cityNorm || k.toLowerCase() === canonicalNorm
    );
    if (dbKey) {
      matchedCity = {
        lat: INDIAN_CITY_SIMULATION_DB[dbKey].lat,
        lon: INDIAN_CITY_SIMULATION_DB[dbKey].lon,
        displayCity: INDIAN_CITY_SIMULATION_DB[dbKey].city
      };
    }
  }

  const hasValidRawCoords =
    !Number.isNaN(rawLat) &&
    !Number.isNaN(rawLon) &&
    rawLat >= -90 &&
    rawLat <= 90 &&
    rawLon >= -180 &&
    rawLon <= 180;

  if (matchedCity) {
    if (hasValidRawCoords) {
      const dist = calculateDistanceKm(rawLat, rawLon, matchedCity.lat, matchedCity.lon);
      if (dist <= MAX_COORDINATE_DISTANCE_KM) {
        return { lat: rawLat, lon: rawLon, displayCity: queryClean || matchedCity.displayCity };
      }
      logger.warn(
        `[resolveCityCoordinates] Overriding mismatched coordinates (${rawLat}, ${rawLon}) for city '${queryClean}' with verified city coordinates (${matchedCity.lat}, ${matchedCity.lon}) - distance: ${dist.toFixed(1)} km.`
      );
      return { lat: matchedCity.lat, lon: matchedCity.lon, displayCity: matchedCity.displayCity };
    }
    return { lat: matchedCity.lat, lon: matchedCity.lon, displayCity: matchedCity.displayCity };
  }

  if (hasValidRawCoords) {
    return { lat: rawLat, lon: rawLon, displayCity: queryClean || 'Custom Location' };
  }

  // If city is empty or default
  if (!queryClean || queryClean.toLowerCase().includes('kolkata')) {
    return {
      lat: DEFAULT_FALLBACK_LAT,
      lon: DEFAULT_FALLBACK_LON,
      displayCity: DEFAULT_FALLBACK_DISPLAY
    };
  }

  return {
    notFound: true,
    requestedCity: queryClean,
    lat: null,
    lon: null,
    displayCity: queryClean
  };
}
