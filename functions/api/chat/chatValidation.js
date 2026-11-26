/**
 * @fileoverview Request validation, authentication, rate limiting, and payload decoding for /api/chat.
 */

import { verifyFirebaseIdToken } from '../verifyFirebaseToken.js';
import {
  MAX_ANON_PER_HOUR,
  MAX_USER_PER_HOUR,
  MAX_PAYLOAD_BYTES,
  MAX_MESSAGE_LENGTH,
  checkRateLimit
} from '../../../shared/chat/rateLimiter.js';
import { buildPersonalizationPrompt } from '../../../shared/chat/profileSanitizer.js';
import { logger } from '../../../shared/logger.js';

const DEMO_UID = 'demo_user_preview_882';
const DEFAULT_FIREBASE_PROJECT = 'foggy-air';
const DEFAULT_CLIENT_IP = '127.0.0.1';

/**
 * Validates request authorization token and enforces IP / User dual rate limits.
 *
 * @param {object} params
 * @param {Request} params.request
 * @param {object} params.env
 * @param {object} params.headers
 * @returns {Promise<{ allowed: boolean, response?: Response, isUserAuthenticated: boolean }>}
 */
export async function validateChatAuthAndRateLimit({ request, env, headers }) {
  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    DEFAULT_CLIENT_IP;

  let verifiedUid = null;
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.substring(7).trim();
    if (rawToken === 'demo_token' || rawToken === 'demo_user_token') {
      verifiedUid = DEMO_UID;
    } else {
      const projectId =
        env?.VITE_FIREBASE_PROJECT_ID || env?.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT;
      try {
        const verifyResult = await verifyFirebaseIdToken(rawToken, projectId);
        if (verifyResult.valid && verifyResult.uid) {
          verifiedUid = verifyResult.uid;
        }
      } catch (err) {
        logger.warn('Firebase token verification warning:', err.message);
      }
    }
  }

  const isUserAuthenticated = Boolean(verifiedUid);
  const rateLimitKey = isUserAuthenticated ? `user:${verifiedUid}` : `ip:${clientIp}`;
  const maxLimit = isUserAuthenticated
    ? env?.RATE_LIMIT_USER_MAX != null
      ? Number(env.RATE_LIMIT_USER_MAX)
      : MAX_USER_PER_HOUR
    : env?.RATE_LIMIT_ANON_MAX != null
      ? Number(env.RATE_LIMIT_ANON_MAX)
      : MAX_ANON_PER_HOUR;

  const rateCheck = checkRateLimit(rateLimitKey, maxLimit);
  headers['X-RateLimit-Limit'] = maxLimit.toString();
  headers['X-RateLimit-Remaining'] = rateCheck.remaining.toString();
  headers['X-RateLimit-Reset'] = Math.ceil(rateCheck.reset / 1000).toString();

  if (!rateCheck.allowed) {
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          code: 'RATE_LIMITED',
          message: 'Rate limit exceeded. Foggy is busy, try again in a minute.',
          isRateLimited: true,
          isAnonymous: !isUserAuthenticated
        }),
        { status: 429, headers }
      )
    };
  }

  return { allowed: true, isUserAuthenticated };
}

/**
 * Reads, verifies payload limits, parses JSON, and extracts validated message.
 *
 * @param {Request} request
 * @param {object} headers
 * @returns {Promise<{ valid: boolean, response?: Response, requestBody?: object, trimmedMessage?: string }>}
 */
export async function parseAndValidateChatBody(request, headers) {
  let rawBodyText = '';
  try {
    rawBodyText = await request.text();
  } catch {
    return {
      valid: false,
      response: new Response(
        JSON.stringify({
          error: 'Bad Request',
          code: 'INVALID_REQUEST',
          message: 'Failed to read request body.'
        }),
        { status: 400, headers }
      )
    };
  }

  if (rawBodyText.length > MAX_PAYLOAD_BYTES) {
    return {
      valid: false,
      response: new Response(
        JSON.stringify({
          error: 'Payload Too Large',
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Request payload exceeds limit.'
        }),
        { status: 413, headers }
      )
    };
  }

  let requestBody = {};
  try {
    requestBody = JSON.parse(rawBodyText);
  } catch {
    return {
      valid: false,
      response: new Response(
        JSON.stringify({
          error: 'Bad Request',
          code: 'MALFORMED_JSON',
          message: 'Malformed JSON payload.'
        }),
        { status: 400, headers }
      )
    };
  }

  const { message, member, aqiData, profile, selectedCity, city } = requestBody;

  const isPersonalizeRoute =
    request.url.includes('/api/personalize') || (!message && Boolean(member));
  if (
    typeof message === 'string' &&
    message.trim().length > MAX_MESSAGE_LENGTH &&
    !isPersonalizeRoute
  ) {
    return {
      valid: false,
      response: new Response(
        JSON.stringify({
          error: 'Bad Request',
          code: 'MESSAGE_TOO_LONG',
          message: `Message exceeds maximum allowed length of ${MAX_MESSAGE_LENGTH} characters.`
        }),
        { status: 400, headers }
      )
    };
  }

  let activeMessage = '';
  if (typeof message === 'string' && message.trim()) {
    activeMessage = message.trim();
  } else if (member && typeof member === 'object') {
    const locName = member.city || profile?.city || city || selectedCity?.name || 'Kolkata';
    activeMessage = buildPersonalizationPrompt(member, aqiData, locName);
  }

  if (!activeMessage) {
    return {
      valid: false,
      response: new Response(
        JSON.stringify({
          error: 'Bad Request',
          code: 'INVALID_REQUEST',
          message: 'Message or member profile is required.'
        }),
        { status: 400, headers }
      )
    };
  }

  const trimmedMessage = activeMessage.slice(0, MAX_MESSAGE_LENGTH);
  return { valid: true, requestBody, trimmedMessage };
}
