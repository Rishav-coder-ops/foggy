// shared/aqi/cache.js
/**
 * @fileoverview Caching, rate limiting, and CORS handling for AQI endpoint.
 */

import { API_RATE_LIMITS } from '../../functions/api/constants.js';
import { getCorsHeaders } from '../cors.js';

export { getCorsHeaders };

export const aqiCache = new Map();
export const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const LIVE_CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours (never replace live with samples)
export const lastGoodLiveAqiCache = new Map();
const ipRateLimitMap = new Map();

export function clearRateLimits() {
  ipRateLimitMap.clear();
}

export function clearAqiCache() {
  aqiCache.clear();
}

export function saveLastGoodLiveAqi(lat, lon, data) {
  if (!data || data.isMock || data.error) return;
  const key = getAqiCacheKey(lat, lon, 'live');
  lastGoodLiveAqiCache.set(key, {
    data: { ...data, isMock: false },
    timestamp: Date.now()
  });
}

export function getLastGoodLiveAqi(lat, lon, maxAgeMs = LIVE_CACHE_TTL_MS) {
  const key = getAqiCacheKey(lat, lon, 'live');
  const entry = lastGoodLiveAqiCache.get(key);
  if (!entry) return null;
  const age = Date.now() - entry.timestamp;
  if (age > maxAgeMs) {
    lastGoodLiveAqiCache.delete(key);
    return null;
  }
  return { ...entry.data, ageMs: age };
}

export function clearLastGoodLiveAqiCache() {
  lastGoodLiveAqiCache.clear();
}

export function getAqiCacheKey(lat, lon, type = 'aqi') {
  const roundedLat = Number(lat).toFixed(2);
  const roundedLon = Number(lon).toFixed(2);
  return `${type}_${roundedLat}_${roundedLon}`;
}

export function checkRateLimit(clientIp, customLimit = null) {
  const limit =
    customLimit != null && !isNaN(customLimit)
      ? Number(customLimit)
      : API_RATE_LIMITS.MAX_REQUESTS_PER_WINDOW;
  const now = Date.now();
  let clientRecord = ipRateLimitMap.get(clientIp);

  if (!clientRecord || now > clientRecord.resetTime) {
    clientRecord = { count: 1, resetTime: now + API_RATE_LIMITS.RATE_LIMIT_WINDOW_MS };
    ipRateLimitMap.set(clientIp, clientRecord);
    return {
      allowed: true,
      count: 1,
      remaining: Math.max(0, limit - 1),
      reset: clientRecord.resetTime
    };
  }

  clientRecord.count += 1;
  const remaining = Math.max(0, limit - clientRecord.count);
  return {
    allowed: clientRecord.count <= limit,
    count: clientRecord.count,
    remaining,
    reset: clientRecord.resetTime
  };
}
