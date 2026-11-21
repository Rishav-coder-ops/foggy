// shared/cors.js
/**
 * @fileoverview Reusable CORS headers generator for Cloudflare Functions & Node server.
 */

export function getCorsHeaders(request) {
  let requestOrigin = '';
  let siteOrigin = 'https://foggy.pages.dev';
  try {
    if (request && typeof request.headers?.get === 'function') {
      requestOrigin = request.headers.get('Origin') || '';
    }
    if (request?.url) {
      const parsed = new URL(request.url);
      siteOrigin = parsed.origin;
    }
  } catch {}

  const isAllowed =
    !requestOrigin ||
    requestOrigin === siteOrigin ||
    requestOrigin.includes('localhost') ||
    requestOrigin.includes('127.0.0.1') ||
    requestOrigin.endsWith('.pages.dev') ||
    requestOrigin.startsWith('http://localhost:') ||
    requestOrigin.startsWith('http://127.0.0.1:');

  return {
    'Access-Control-Allow-Origin': isAllowed ? requestOrigin || siteOrigin || '*' : siteOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
    'Cache-Control': 'public, max-age=1800, s-maxage=1800',
    'X-Content-Type-Options': 'nosniff'
  };
}
