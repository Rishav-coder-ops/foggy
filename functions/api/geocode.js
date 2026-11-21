// functions/api/geocode.js
// Cloudflare Pages Function for Location Geocoding & Validation
// Wraps Open-Meteo Geocoding API with multi-stage fallback, retry, alias resolution, and offline index.

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;
const ipRateLimitMap = new Map();
const geocodeCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

import {
  STATE_ALIASES,
  CITY_ALIASES,
  INDIAN_FALLBACK_CITIES,
  normalizeCountryCode,
  normalizeLocationQuery,
  normalizeStateName,
  statesMatch,
  extractCityAndState,
  resolveCityAlias,
  rankAndDeduplicateLocations
} from '../../shared/geocode.js';

export {
  STATE_ALIASES,
  CITY_ALIASES,
  INDIAN_FALLBACK_CITIES,
  normalizeCountryCode,
  normalizeLocationQuery,
  normalizeStateName,
  statesMatch,
  extractCityAndState,
  resolveCityAlias,
  rankAndDeduplicateLocations
};

/**
 * Resets cache and rate limiter state (used in testing).
 */
export function clearGeocodeCache() {
  geocodeCache.clear();
  ipRateLimitMap.clear();
}

/**
 * Executes fetch with a single retry on transient failures.
 * @param {string} url
 * @param {number} [retries=1]
 * @param {number} [delayMs=300]
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url, retries = 1, delayMs = 300) {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Foggy-Air-Quality-Assistant/1.0' }
    });
    if (!res.ok && res.status >= 500 && retries > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
      return fetchWithRetry(url, retries - 1, delayMs);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
      return fetchWithRetry(url, retries - 1, delayMs);
    }
    throw err;
  }
}

/**
 * Searches local Indian fallback dataset for matches.
 * @param {string} searchCity
 * @param {string} searchState
 * @returns {Array<object>}
 */
function searchLocalFallback(searchCity, searchState) {
  const normCity = normalizeLocationQuery(searchCity);
  const canonicalCity = normalizeLocationQuery(resolveCityAlias(searchCity));
  const normState = normalizeStateName(searchState);

  return INDIAN_FALLBACK_CITIES.filter((c) => {
    const cName = normalizeLocationQuery(c.name);
    const cAdmin = normalizeStateName(c.admin1 || '');

    const nameMatches =
      cName === normCity ||
      cName === canonicalCity ||
      cName.startsWith(normCity) ||
      normCity.startsWith(cName);

    if (normState && nameMatches) {
      return statesMatch(normState, cAdmin);
    }
    return nameMatches;
  });
}

export async function onRequest(context) {
  const { request } = context;

  // Rate Limiting
  const clientIP =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for') ||
    '127.0.0.1';
  const now = Date.now();
  const rateData = ipRateLimitMap.get(clientIP) || {
    count: 0,
    resetTime: now + RATE_LIMIT_WINDOW_MS
  };

  if (now > rateData.resetTime) {
    rateData.count = 1;
    rateData.resetTime = now + RATE_LIMIT_WINDOW_MS;
  } else {
    rateData.count++;
  }
  ipRateLimitMap.set(clientIP, rateData);

  if (rateData.count > MAX_REQUESTS_PER_WINDOW) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests. Please slow down.',
        status: 'rate_limited'
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60'
        }
      }
    );
  }

  const url = new URL(request.url);
  const rawQuery =
    url.searchParams.get('name') ||
    url.searchParams.get('search') ||
    url.searchParams.get('q') ||
    '';
  const query = rawQuery.trim().slice(0, 80);
  const rawCountryCode = url.searchParams.get('countryCode') || url.searchParams.get('country') || 'IN';
  const countryCode = normalizeCountryCode(rawCountryCode);
  const count = Math.min(Math.max(parseInt(url.searchParams.get('count') || '10', 10), 1), 20);

  if (!query || query.length < 2) {
    return new Response(JSON.stringify({ results: [], status: 'not_found' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const cacheKey = `${query.toLowerCase()}_${countryCode}_${count}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached && cached.expiry > now) {
    return new Response(JSON.stringify({ results: cached.data, cached: true, status: 'ok' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { city, state } = extractCityAndState(query);
  const canonicalCity = resolveCityAlias(city);

  let upstreamResults = [];
  let upstreamFailed = false;

  // Pass 1: Query Open-Meteo with canonical alias + countryCode
  try {
    const params1 = new URLSearchParams({
      name: canonicalCity,
      count: String(count),
      language: 'en',
      format: 'json'
    });
    if (countryCode) params1.append('countryCode', countryCode);

    const res1 = await fetchWithRetry(
      `https://geocoding-api.open-meteo.com/v1/search?${params1.toString()}`
    );
    if (res1.ok) {
      const data1 = await res1.json();
      if (Array.isArray(data1.results) && data1.results.length > 0) {
        upstreamResults = data1.results;
      }
    } else {
      upstreamFailed = true;
    }
  } catch (err) {
    console.warn('Geocoding Pass 1 error:', err.message);
    upstreamFailed = true;
  }

  // Pass 2: If no results and canonicalCity differs from raw city, try raw city
  if (upstreamResults.length === 0 && !upstreamFailed && canonicalCity.toLowerCase() !== city.toLowerCase()) {
    try {
      const params2 = new URLSearchParams({
        name: city,
        count: String(count),
        language: 'en',
        format: 'json'
      });
      if (countryCode) params2.append('countryCode', countryCode);

      const res2 = await fetchWithRetry(
        `https://geocoding-api.open-meteo.com/v1/search?${params2.toString()}`
      );
      if (res2.ok) {
        const data2 = await res2.json();
        if (Array.isArray(data2.results) && data2.results.length > 0) {
          upstreamResults = data2.results;
        }
      }
    } catch (_err) {
      // Ignore pass 2 network errors
    }
  }

  // Pass 3: If still no results, query without countryCode filter and filter IN in memory
  if (upstreamResults.length === 0 && !upstreamFailed && countryCode === 'IN') {
    try {
      const params3 = new URLSearchParams({
        name: canonicalCity,
        count: String(count),
        language: 'en',
        format: 'json'
      });
      const res3 = await fetchWithRetry(
        `https://geocoding-api.open-meteo.com/v1/search?${params3.toString()}`
      );
      if (res3.ok) {
        const data3 = await res3.json();
        if (Array.isArray(data3.results)) {
          upstreamResults = data3.results.filter(
            (r) => r.country_code === 'IN' || (r.country && r.country.toLowerCase() === 'india')
          );
        }
      }
    } catch (_err) {
      // Ignore pass 3 network errors
    }
  }

  // Format upstream results if any
  let formatted = upstreamResults.map((r) => ({
    id: r.id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    country: r.country || 'India',
    country_code: r.country_code || 'IN',
    admin1: r.admin1 || '',
    admin2: r.admin2 || '',
    population: r.population || 0,
    timezone: r.timezone || 'Asia/Kolkata'
  }));

  // Pass 4: Fallback to local Indian offline index if upstream yielded no results or failed
  if (formatted.length === 0) {
    const localMatches = searchLocalFallback(city, state);
    if (localMatches.length > 0) {
      formatted = localMatches;
    }
  }

  // Rank and de-duplicate
  const finalResults = rankAndDeduplicateLocations(formatted, city, state);

  // If upstream had a network/server failure
  if (upstreamFailed) {
    if (finalResults.length > 0) {
      return new Response(
        JSON.stringify({
          results: finalResults,
          fallback: true,
          status: 'upstream_error',
          notice: 'Geocoding upstream unavailable, results served from resilient offline index.'
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({
        error: 'Geocoding service temporarily unavailable. Please try again.',
        status: 'service_busy',
        results: []
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Cache valid results
  if (finalResults.length > 0) {
    geocodeCache.set(cacheKey, {
      data: finalResults,
      expiry: now + CACHE_TTL_MS
    });
  }

  return new Response(
    JSON.stringify({
      results: finalResults,
      status: finalResults.length > 0 ? 'ok' : 'not_found'
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600'
      }
    }
  );
}
