// functions/api/aqi-timeline.js
/**
 * @fileoverview Cloudflare Pages Function & Local Server Handler for Indian National AQI timeline.
 */

import {
  timelineCache,
  TIMELINE_CACHE_TTL_MS,
  getTimelineCacheKey,
  INDIAN_METROS,
  INDIAN_CITY_ALIASES,
  checkRateLimit,
  getCorsHeaders
} from '../../shared/timeline/constants.js';
import {
  calculatePM25SubIndex,
  calculatePM10SubIndex,
  calculateCPCBNAQI,
  getAQICategory
} from '../../shared/aqi.js';
import {
  geocodeIndianCity,
  fetchCityAqiReport,
  fetchTimelineData
} from '../../shared/timeline/timelineService.js';

export {
  timelineCache,
  TIMELINE_CACHE_TTL_MS,
  getTimelineCacheKey,
  INDIAN_METROS,
  INDIAN_CITY_ALIASES,
  geocodeIndianCity,
  fetchCityAqiReport,
  calculatePM25SubIndex,
  calculatePM10SubIndex,
  calculateCPCBNAQI,
  getAQICategory
};

export async function onRequestOptions(context) {
  const { request } = context;
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request)
  });
}

export async function onRequestGet(context) {
  const { request } = context;
  const clientIp =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    '127.0.0.1';

  const maxRequests =
    context.env?.RATE_LIMIT_MAX != null ? Number(context.env.RATE_LIMIT_MAX) : undefined;
  const rateLimit = checkRateLimit(clientIp, maxRequests);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please wait a moment before retrying.'
      }),
      {
        status: 429,
        headers: {
          ...getCorsHeaders(request),
          'Content-Type': 'application/json'
        }
      }
    );
  }

  const url = new URL(request.url);

  // 1. Geocoding search handler: ?search=city or ?q=city
  const rawSearch = url.searchParams.get('search') || url.searchParams.get('q');
  if (rawSearch) {
    const trimmed = rawSearch
      .trim()
      .slice(0, 60)
      .replace(/[^a-zA-Z0-9\s.,\-_'()]/g, '');
    if (trimmed.length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: {
          ...getCorsHeaders(request),
          'Content-Type': 'application/json'
        }
      });
    }

    try {
      const canonicalQuery = INDIAN_CITY_ALIASES[trimmed.toLowerCase()] || trimmed;
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(canonicalQuery)}&count=10&language=en&format=json&countrycode=IN`;
      const geoRes = await fetch(geoUrl, {
        headers: { 'User-Agent': 'FoggyAirQualityIndia/1.0' },
        signal: AbortSignal.timeout(6000)
      });

      if (!geoRes.ok) {
        throw new Error(`Geocoding failed with status ${geoRes.status}`);
      }

      const geoData = await geoRes.json();
      let results = (geoData.results || [])
        .filter(
          (r) => !r.country_code || r.country_code.toUpperCase() === 'IN' || r.country === 'India'
        )
        .sort((a, b) => (b.population || 0) - (a.population || 0))
        .map((r) => ({
          name: r.name,
          country: 'India',
          admin1: r.admin1 || '',
          latitude: r.latitude,
          longitude: r.longitude,
          population: r.population || 0,
          timezone: r.timezone || 'Asia/Kolkata'
        }));

      if (results.length === 0) {
        results = INDIAN_METROS.filter(
          (m) =>
            m.name.toLowerCase().includes(canonicalQuery.toLowerCase()) ||
            m.name.toLowerCase().includes(trimmed.toLowerCase())
        ).map((m) => ({
          name: m.name,
          country: 'India',
          admin1: m.admin1,
          latitude: m.lat,
          longitude: m.lon,
          timezone: 'Asia/Kolkata'
        }));
      }

      return new Response(JSON.stringify({ results }), {
        status: 200,
        headers: {
          ...getCorsHeaders(request),
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      console.warn('Geocoding search failed, providing Indian fallback list:', err);
      const filtered = INDIAN_METROS.filter((item) =>
        item.name.toLowerCase().includes(trimmed.toLowerCase())
      ).map((m) => ({
        name: m.name,
        country: 'India',
        admin1: m.admin1,
        latitude: m.lat,
        longitude: m.lon,
        timezone: 'Asia/Kolkata'
      }));

      return new Response(JSON.stringify({ results: filtered }), {
        status: 200,
        headers: {
          ...getCorsHeaders(request),
          'Content-Type': 'application/json'
        }
      });
    }
  }

  // 2. Timeline handler: ?lat=...&lon=...
  const latStr = url.searchParams.get('lat') || url.searchParams.get('latitude');
  const lonStr = url.searchParams.get('lon') || url.searchParams.get('longitude');
  const rawCity = url.searchParams.get('city') || 'Kolkata';
  const cityName =
    rawCity
      .trim()
      .slice(0, 60)
      .replace(/[^a-zA-Z0-9\s.,\-_'()]/g, '') || 'Kolkata';

  const lat = parseFloat(latStr || '22.5726');
  const lon = parseFloat(lonStr || '88.3639');

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return new Response(
      JSON.stringify({
        error: 'Invalid coordinates',
        message: 'Latitude must be between -90 and 90, and longitude between -180 and 180.'
      }),
      {
        status: 400,
        headers: {
          ...getCorsHeaders(request),
          'Content-Type': 'application/json'
        }
      }
    );
  }

  const cacheKey = getTimelineCacheKey(lat, lon);
  const now = Date.now();
  const cached = timelineCache.get(cacheKey);
  if (cached && cached.expiry > now) {
    return new Response(JSON.stringify(cached.data), {
      status: 200,
      headers: {
        ...getCorsHeaders(request),
        'Content-Type': 'application/json',
        'X-Cache': 'HIT',
        'X-Cache-Key': cacheKey
      }
    });
  }

  const responsePayload = await fetchTimelineData(lat, lon, cityName);
  if (!responsePayload.isSample) {
    timelineCache.set(cacheKey, {
      data: responsePayload,
      expiry: now + TIMELINE_CACHE_TTL_MS
    });
  }

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: {
      ...getCorsHeaders(request),
      'Content-Type': 'application/json',
      'X-Cache': 'MISS',
      'X-Cache-Key': cacheKey
    }
  });
}
