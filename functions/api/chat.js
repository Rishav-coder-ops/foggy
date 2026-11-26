// functions/api/chat.js
/**
 * @fileoverview Cloudflare Pages Function & Local Express Handler for Gemini GenAI Chat Proxy.
 * Orchestrates rate limiting, Firebase token auth, context detection, live Gemini calls, and fallback handling.
 */

import { getCorsHeaders } from '../../shared/chat/rateLimiter.js';
import { extractMemoryFact, extractMemoryFacts } from '../../shared/chat/memoryExtractor.js';
import {
  verifyModelAqiResponse,
  correctModelAqiResponse
} from '../../shared/chat/responseValidator.js';
import {
  GEMINI_PRIMARY_MODEL,
  GEMINI_FALLBACK_MODEL,
  GEMINI_CANDIDATE_MODELS,
  GEMINI_GENERATION_CONFIG,
  FOGGY_FALLBACK_MODEL,
  FOGGY_PROVIDER_LABELS
} from '../../shared/constants.js';

import { buildGeminiContents } from './chat/chatContents.js';
import { handleChatRequest } from './chat/chatRequestHandler.js';

export {
  extractMemoryFact,
  extractMemoryFacts,
  verifyModelAqiResponse,
  correctModelAqiResponse,
  GEMINI_PRIMARY_MODEL,
  GEMINI_FALLBACK_MODEL,
  GEMINI_CANDIDATE_MODELS,
  GEMINI_GENERATION_CONFIG,
  FOGGY_FALLBACK_MODEL,
  FOGGY_PROVIDER_LABELS,
  buildGeminiContents
};

/**
 * Handles CORS OPTIONS preflight.
 * @param {object} context
 * @returns {Promise<Response>}
 */
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(context.request)
  });
}

/**
 * Handles incoming chat POST requests.
 * @param {object} context
 * @returns {Promise<Response>}
 */
export async function onRequestPost(context) {
  const headers = getCorsHeaders(context.request);
  headers['Content-Type'] = 'application/json; charset=utf-8';
  return handleChatRequest(context, headers);
}

/**
 * Universal request router for Cloudflare Pages Functions.
 * @param {object} context
 * @returns {Promise<Response>}
 */
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  if (context.request.method === 'OPTIONS') return onRequestOptions(context);

  const headers = getCorsHeaders(context.request);
  headers['Allow'] = 'POST, OPTIONS';
  headers['Content-Type'] = 'application/json; charset=utf-8';
  return new Response(JSON.stringify({ error: 'Method Not Allowed', message: 'Use POST.' }), {
    status: 405,
    headers
  });
}
