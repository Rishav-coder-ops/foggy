// shared/chat/rateLimiter.js
/**
 * @fileoverview Dual-tier rate limiting and CORS handling for Foggy Chat.
 */

import { CHAT_LIMITS, API_RATE_LIMITS } from '../../functions/api/constants.js';
import { getCorsHeaders } from '../cors.js';

export { getCorsHeaders };

export const RATE_LIMIT_WINDOW_MS = API_RATE_LIMITS.RATE_LIMIT_WINDOW_MS;
export const MAX_ANON_PER_HOUR = API_RATE_LIMITS.ANONYMOUS_CHAT_PER_HOUR;
export const MAX_USER_PER_HOUR = API_RATE_LIMITS.AUTHENTICATED_CHAT_PER_HOUR;
export const MAX_PAYLOAD_BYTES = CHAT_LIMITS.MAX_PAYLOAD_BYTES;
export const MAX_MESSAGE_LENGTH = CHAT_LIMITS.MAX_MESSAGE_LENGTH;
export const MAX_HISTORY_TURNS = CHAT_LIMITS.MAX_HISTORY_TURNS;

export const rateLimitStore = new Map();

export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

export function checkRateLimit(key, maxLimit) {
  cleanupRateLimitStore();
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    rateLimitStore.set(key, record);
    return { allowed: true, remaining: maxLimit - 1, reset: record.resetTime };
  }

  record.count += 1;
  const remaining = Math.max(0, maxLimit - record.count);
  return {
    allowed: record.count <= maxLimit,
    count: record.count,
    remaining,
    reset: record.resetTime
  };
}
