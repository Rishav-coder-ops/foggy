// shared/constants.js
/**
 * @fileoverview Single source of truth for atmospheric constants, AQI breakpoints,
 * rate limits, payload caps, and category colors across client and backend.
 */

/**
 * CPCB National Air Quality Index (NAQI) Breakpoint Table.
 * Ranges for PM2.5 (24-hr avg in µg/m³) and PM10 (24-hr avg in µg/m³).
 */
export const CPCB_BREAKPOINTS = Object.freeze({
  pm25: [
    { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
    { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100 },
    { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200 },
    { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300 },
    { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 },
    { cLow: 251, cHigh: 500, iLow: 401, iHigh: 500 }
  ],
  pm10: [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200 },
    { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300 },
    { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400 },
    { cLow: 431, cHigh: 500, iLow: 401, iHigh: 500 }
  ]
});

/**
 * CPCB AQI Category bands and descriptions.
 */
export const AQI_CATEGORIES = Object.freeze({
  GOOD: { label: 'Good', name: 'Good', min: 0, max: 50, color: '#10b981', textColor: '#ffffff' },
  SATISFACTORY: {
    label: 'Satisfactory',
    name: 'Satisfactory',
    min: 51,
    max: 100,
    color: '#84cc16',
    textColor: '#0f172a'
  },
  MODERATE: {
    label: 'Moderate',
    name: 'Moderate',
    min: 101,
    max: 200,
    color: '#eab308',
    textColor: '#0f172a'
  },
  POOR: { label: 'Poor', name: 'Poor', min: 201, max: 300, color: '#f97316', textColor: '#ffffff' },
  VERY_POOR: {
    label: 'Very Poor',
    name: 'Very Poor',
    min: 301,
    max: 400,
    color: '#ef4444',
    textColor: '#ffffff'
  },
  SEVERE: {
    label: 'Severe',
    name: 'Severe',
    min: 401,
    max: 500,
    color: '#7f1d1d',
    textColor: '#ffffff'
  }
});

/**
 * Rate limits and window intervals.
 */
export const API_RATE_LIMITS = Object.freeze({
  ANONYMOUS_CHAT_PER_HOUR: 10,
  AUTHENTICATED_CHAT_PER_HOUR: 60,
  GENERAL_API_PER_15_MIN: 120,
  MAX_REQUESTS_PER_WINDOW: 60,
  RATE_LIMIT_WINDOW_MS: 3600000, // 1 hour
  SHORT_WINDOW_MS: 900000 // 15 min
});

/**
 * Abuse prevention and payload limits.
 */
export const CHAT_LIMITS = Object.freeze({
  MAX_PAYLOAD_BYTES: 32768, // 32 KB
  MAX_MESSAGE_LENGTH: 500, // 500 chars
  MAX_HISTORY_TURNS: 10,
  MAX_SYSTEM_PROMPT_CHARS: 6000,
  DEFAULT_FETCH_TIMEOUT_MS: 8000
});

/**
 * Standard Indian Metros with coordinates and fallback telemetry.
 */
export const INDIAN_METROS = Object.freeze({
  delhi: { name: 'Delhi', state: 'Delhi', lat: 28.6139, lon: 77.209 },
  kolkata: { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
  mumbai: { name: 'Mumbai', state: 'Maharashtra', lat: 19.076, lon: 72.8777 },
  chennai: { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  bengaluru: { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
  hyderabad: { name: 'Hyderabad', state: 'Telangana', lat: 17.385, lon: 78.4867 },
  ahmedabad: { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714 },
  pune: { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 }
});

/**
 * Model identifiers, generation settings, and provider labels.
 */
export const GEMINI_PRIMARY_MODEL = 'gemini-3.1-flash-lite';
export const GEMINI_FALLBACK_MODEL = 'gemini-flash-latest';

export const GEMINI_CANDIDATE_MODELS = Object.freeze([
  GEMINI_PRIMARY_MODEL,
  GEMINI_FALLBACK_MODEL,
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash'
]);

export const GEMINI_GENERATION_CONFIG = Object.freeze({
  temperature: 0.3,
  maxOutputTokens: 1500,
  timeout: 10000,
  timeoutMs: 10000,
  listModelsTimeoutMs: 5000,
  retryDelayMs: 750
});

export const FOGGY_FALLBACK_MODEL = 'foggy-atmospheric-core';

export const FOGGY_PROVIDER_LABELS = Object.freeze({
  LIVE_GEMINI: 'Google Gemini',
  BUILT_IN_GUIDANCE: "Answered by Foggy's built-in guidance",
  RATE_LIMITER: 'System Rate Limiter'
});

