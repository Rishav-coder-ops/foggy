// functions/api/aqi.js
/**
 * @fileoverview Cloudflare Pages Function & Local Server Handler for Indian National AQI (CPCB NAQI).
 */

import {
  calculatePM25SubIndex,
  calculatePM10SubIndex,
  calculateCPCBNAQI,
  getAQICategory,
  INDIAN_METROS
} from './aqi-timeline.js';
import { logger } from '../../shared/logger.js';
import {
  aqiCache,
  CACHE_TTL_MS,
  getAqiCacheKey,
  checkRateLimit,
  clearRateLimits,
  clearAqiCache,
  clearLastGoodLiveAqiCache,
  getCorsHeaders
} from '../../shared/aqi/cache.js';
import {
  INDIAN_CITY_SIMULATION_DB,
  getDeterministicMockCity,
  generateHourlyForecast
} from '../../shared/aqi/simulationDb.js';
import {
  calculateRollingAverages,
  resolveCityCoordinates,
  fetchUpstreamAqiData
} from '../../shared/aqi/upstreamClient.js';

export {
  calculatePM25SubIndex,
  calculatePM10SubIndex,
  calculateCPCBNAQI,
  getAQICategory,
  INDIAN_METROS,
  aqiCache,
  CACHE_TTL_MS,
  getAqiCacheKey,
  checkRateLimit,
  clearRateLimits,
  clearAqiCache,
  clearLastGoodLiveAqiCache,
  getCorsHeaders,
  INDIAN_CITY_SIMULATION_DB,
  getDeterministicMockCity,
  generateHourlyForecast,
  calculateRollingAverages,
  resolveCityCoordinates
};

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(context.request)
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const headers = getCorsHeaders(request);
  headers['Content-Type'] = 'application/json; charset=utf-8';

  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';

  const maxRequests = env?.RATE_LIMIT_MAX != null ? Number(env.RATE_LIMIT_MAX) : undefined;
  const rateCheck = checkRateLimit(clientIp, maxRequests);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        code: 'RATE_LIMITED',
        message: 'Rate limit exceeded. Please wait a moment before retrying.'
      }),
      { status: 429, headers }
    );
  }

  const url = new URL(request.url);
  const rawCity = url.searchParams.get('city') || '';
  const rawLat = parseFloat(url.searchParams.get('lat') || '');
  const rawLon = parseFloat(url.searchParams.get('lon') || '');

  logger.debug('[API /api/aqi] Incoming coordinates:', { rawCity, rawLat, rawLon });

  const requestedCity = rawCity
    .trim()
    .slice(0, 60)
    .replace(/[^a-zA-Z0-9\s.,\-_'()]/g, '');

  const resolved = resolveCityCoordinates(requestedCity, rawLat, rawLon);
  if (resolved.notFound || resolved.lat == null || resolved.lon == null) {
    return new Response(
      JSON.stringify({
        error: 'LOCATION_NOT_FOUND',
        message: `Could not resolve verified Indian coordinates for '${requestedCity}'. Please check your location.`,
        city: requestedCity
      }),
      { status: 404, headers }
    );
  }

  const { lat, lon, displayCity } = resolved;
  const cacheKey = getAqiCacheKey(lat, lon, 'aqi');

  logger.debug('[API /api/aqi] Resolved coordinates:', {
    displayCity,
    lat,
    lon,
    cacheKey
  });

  const now = Date.now();
  const cached = aqiCache.get(cacheKey);
  if (cached && cached.expiry > now) {
    logger.debug('[API /api/aqi] Cache HIT for key:', cacheKey);
    return new Response(JSON.stringify(cached.data), {
      status: 200,
      headers: {
        ...headers,
        'X-Cache': 'HIT',
        'X-Cache-Key': cacheKey
      }
    });
  }

  const payload = await fetchUpstreamAqiData(
    lat,
    lon,
    requestedCity,
    displayCity,
    env?.AQI_API_KEY
  );

  if (payload.error) {
    return new Response(JSON.stringify(payload), {
      status: payload.error === 'GRID_MISMATCH' ? 422 : 400,
      headers
    });
  }

  // Cache live and stale-live verified data in long-lived aqiCache (15m).
  // Do NOT cache simulation sample data so user retries can immediately re-attempt live upstream fetch.
  if (!payload.isMock) {
    aqiCache.set(cacheKey, {
      data: payload,
      expiry: now + CACHE_TTL_MS
    });
  }

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      ...headers,
      'X-Cache': 'MISS',
      'X-Cache-Key': cacheKey
    }
  });
}

export async function onRequest(context) {
  if (context.request.method === 'GET') return onRequestGet(context);
  if (context.request.method === 'OPTIONS') return onRequestOptions(context);

  const headers = getCorsHeaders(context.request);
  headers['Allow'] = 'GET, OPTIONS';
  headers['Content-Type'] = 'application/json; charset=utf-8';
  return new Response(JSON.stringify({ error: 'Method Not Allowed', message: 'Use GET.' }), {
    status: 405,
    headers
  });
}
