/**
 * @fileoverview Indian city geocoding with alias matching, predefined metros, and fallback resolution.
 */

import { INDIAN_FALLBACK_CITIES } from '../geocode.js';
import { INDIAN_METROS, INDIAN_CITY_ALIASES } from './constants.js';
import { logger } from '../logger.js';

const GEOCODE_TIMEOUT_MS = 5000;
const SHORT_WORD_LIMIT = 4;
const DEFAULT_METRO_POPULATION = 5000000;

const VALID_FEATURE_CODES = [
  'PPLC',
  'PPLA',
  'PPLA2',
  'PPLA3',
  'PPLA4',
  'PPL',
  'ADM1',
  'ADM2',
  'ADM3'
];

/**
 * Geocodes an Indian city name with fallback hierarchy:
 * 1. Alias dictionary
 * 2. Predefined fallback cities dataset
 * 3. Predefined major metros
 * 4. Open-Meteo Geocoding API with feature-code and short-word safeguards
 *
 * @param {string} cityName - Raw or alias city name.
 * @returns {Promise<{
 *   name: string,
 *   latitude: number,
 *   longitude: number,
 *   admin1: string,
 *   country: string,
 *   country_code?: string,
 *   population: number
 * }|null>}
 */
export async function geocodeIndianCity(cityName) {
  if (!cityName || typeof cityName !== 'string') return null;
  const trimmed = cityName.trim();
  const baseName = trimmed.split(/[,–—|-]/)[0].trim();
  const canonicalName =
    INDIAN_CITY_ALIASES[trimmed.toLowerCase()] ||
    INDIAN_CITY_ALIASES[baseName.toLowerCase()] ||
    baseName;

  const fallback = INDIAN_FALLBACK_CITIES.find(
    (c) =>
      c.name.toLowerCase() === canonicalName.toLowerCase() ||
      c.name.toLowerCase() === trimmed.toLowerCase() ||
      c.name.toLowerCase() === baseName.toLowerCase()
  );
  if (fallback) {
    return {
      name: fallback.name,
      latitude: fallback.latitude ?? fallback.lat,
      longitude: fallback.longitude ?? fallback.lon,
      admin1: fallback.admin1 ?? fallback.state ?? '',
      country: 'India',
      population: fallback.population || 0
    };
  }

  const metro = INDIAN_METROS.find(
    (m) =>
      m.name.toLowerCase() === canonicalName.toLowerCase() ||
      m.name.toLowerCase() === trimmed.toLowerCase() ||
      m.name.toLowerCase() === baseName.toLowerCase()
  );
  if (metro) {
    return {
      name: metro.name,
      latitude: metro.lat,
      longitude: metro.lon,
      admin1: metro.admin1,
      country: 'India',
      population: DEFAULT_METRO_POPULATION
    };
  }

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(canonicalName)}&count=5&language=en&format=json`;
    const res = await fetch(geoUrl, {
      headers: { 'User-Agent': 'FoggyAirQualityIndia/1.0' },
      signal: AbortSignal.timeout(GEOCODE_TIMEOUT_MS)
    });
    if (res.ok) {
      const data = await res.json();
      const validResults = (data.results || []).filter(
        (r) => r && (r.country === 'India' || r.country_code === 'IN')
      );
      const top =
        validResults.find((r) => !r.feature_code || VALID_FEATURE_CODES.includes(r.feature_code)) ||
        null;

      if (top) {
        if (
          canonicalName.length <= SHORT_WORD_LIMIT &&
          top.name.toLowerCase() !== canonicalName.toLowerCase()
        ) {
          return null;
        }
        return {
          name: top.name,
          latitude: top.latitude,
          longitude: top.longitude,
          admin1: top.admin1 || '',
          country: 'India',
          population: top.population || 0
        };
      }
    }
  } catch (err) {
    logger.warn(`Geocoding error for ${canonicalName}:`, err.message);
  }

  return null;
}
