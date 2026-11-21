// functions/api/geocode.js
// Cloudflare Pages Function for Location Geocoding & Validation
// Wraps Open-Meteo Geocoding API (https://geocoding-api.open-meteo.com/v1/search)
// Includes in-memory cache, rate limiting, input sanitization, and Indian state alias normalization.

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;
const ipRateLimitMap = new Map();
const geocodeCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

import {
  STATE_ALIASES,
  normalizeStateName,
  statesMatch,
  INDIAN_FALLBACK_CITIES
} from '../../shared/geocode.js';

export { STATE_ALIASES, normalizeStateName, statesMatch, INDIAN_FALLBACK_CITIES };

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
    return new Response(JSON.stringify({ error: 'Too many requests. Please slow down.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60'
      }
    });
  }

  const url = new URL(request.url);
  const rawQuery =
    url.searchParams.get('name') ||
    url.searchParams.get('search') ||
    url.searchParams.get('q') ||
    '';
  const query = rawQuery.trim().slice(0, 80);
  const countryCode = (url.searchParams.get('countryCode') || url.searchParams.get('country') || '')
    .trim()
    .slice(0, 5)
    .toUpperCase();
  const count = Math.min(Math.max(parseInt(url.searchParams.get('count') || '10', 10), 1), 20);

  if (!query || query.length < 2) {
    return new Response(JSON.stringify({ results: [] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const cacheKey = `${query.toLowerCase()}_${countryCode}_${count}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached && cached.expiry > now) {
    return new Response(JSON.stringify({ results: cached.data, cached: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const params = new URLSearchParams({
      name: query,
      count: String(count),
      language: 'en',
      format: 'json'
    });
    if (countryCode) {
      params.append('countryCode', countryCode);
    }

    const openMeteoUrl = `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`;
    const res = await fetch(openMeteoUrl, {
      headers: { Accept: 'application/json', 'User-Agent': 'Foggy-Air-Quality-Assistant/1.0' }
    });

    if (!res.ok) {
      throw new Error(`Geocoding upstream responded with status ${res.status}`);
    }

    const data = await res.json();
    const rawResults = Array.isArray(data.results) ? data.results : [];

    let results = rawResults.map((r) => ({
      id: r.id,
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      country: r.country,
      country_code: r.country_code,
      admin1: r.admin1 || '',
      admin2: r.admin2 || '',
      timezone: r.timezone || 'Asia/Kolkata'
    }));

    if (results.length === 0) {
      const qLower = query.toLowerCase();
      results = INDIAN_FALLBACK_CITIES.filter(
        (c) =>
          c.name.toLowerCase().includes(qLower) ||
          (c.admin1 && c.admin1.toLowerCase().includes(qLower))
      );
    }

    // Cache valid results
    geocodeCache.set(cacheKey, {
      data: results,
      expiry: now + CACHE_TTL_MS
    });

    return new Response(JSON.stringify({ results }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600'
      }
    });
  } catch (err) {
    console.warn('Open-Meteo geocoding fetch error, using resilient fallback:', err.message);

    // Fallback matching against built-in Indian cities if applicable
    const qLower = query.toLowerCase();
    const fallbackMatches = INDIAN_FALLBACK_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(qLower) ||
        (c.admin1 && c.admin1.toLowerCase().includes(qLower))
    );

    return new Response(
      JSON.stringify({
        results: fallbackMatches,
        fallback: true,
        notice: 'Geocoding upstream unavailable, results served from resilient offline index.'
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
