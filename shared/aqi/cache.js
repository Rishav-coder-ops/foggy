// shared/aqi/cache.js
/**
 * @fileoverview Caching, rate limiting, and CORS handling for AQI endpoint.
 */

import { API_RATE_LIMITS } from '../../functions/api/constants.js';
import { getCorsHeaders } from '../cors.js';

export { getCorsHeaders };

export const aqiCache = new Map();
export const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const ipRateLimitMap = new Map();

export function getAqiCacheKey(lat, lon, type = 'aqi') {
  const roundedLat = Number(lat).toFixed(2);
  const roundedLon = Number(lon).toFixed(2);
  return `${type}_${roundedLat}_${roundedLon}`;
}

export function checkRateLimit(clientIp) {
  const now = Date.now();
  let clientRecord = ipRateLimitMap.get(clientIp);

  if (!clientRecord || now > clientRecord.resetTime) {
    clientRecord = { count: 1, resetTime: now + API_RATE_LIMITS.RATE_LIMIT_WINDOW_MS };
    ipRateLimitMap.set(clientIp, clientRecord);
    return {
      allowed: true,
      count: 1,
      remaining: API_RATE_LIMITS.MAX_REQUESTS_PER_WINDOW - 1,
      reset: clientRecord.resetTime
    };
  }

  clientRecord.count += 1;
  const remaining = Math.max(0, API_RATE_LIMITS.MAX_REQUESTS_PER_WINDOW - clientRecord.count);
  return {
    allowed: clientRecord.count <= API_RATE_LIMITS.MAX_REQUESTS_PER_WINDOW,
    count: clientRecord.count,
    remaining,
    reset: clientRecord.resetTime
  };
}
