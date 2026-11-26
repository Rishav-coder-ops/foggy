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
 * 0-50 Good green, 51-100 Satisfactory light green, 101-200 Moderate yellow,
 * 201-300 Poor orange, 301-400 Very Poor red, 401-500 Severe maroon.
 */
export const AQI_CATEGORIES = Object.freeze({
  GOOD: {
    label: 'Good',
    name: 'Good',
    min: 0,
    max: 50,
    color: '#10b981',
    textColor: '#ffffff',
    badgeClass:
      'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    healthImpact: 'Minimal impact',
    advisory: 'Air quality is considered satisfactory, and air pollution poses little or no risk.'
  },
  SATISFACTORY: {
    label: 'Satisfactory',
    name: 'Satisfactory',
    min: 51,
    max: 100,
    color: '#84cc16',
    textColor: '#0f172a',
    badgeClass:
      'bg-lime-100 text-lime-950 dark:bg-lime-950/80 dark:text-lime-300 border-lime-300 dark:border-lime-800',
    healthImpact: 'Minor breathing discomfort to sensitive people',
    advisory: 'Sensitive individuals should consider limiting prolonged outdoor exertion.'
  },
  MODERATE: {
    label: 'Moderate',
    name: 'Moderate',
    min: 101,
    max: 200,
    color: '#eab308',
    textColor: '#0f172a',
    badgeClass:
      'bg-yellow-100 text-yellow-950 dark:bg-yellow-950/80 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800',
    healthImpact: 'Breathing discomfort to the people with lungs, asthma and heart diseases',
    advisory:
      'Children, seniors, and individuals with respiratory issues should reduce prolonged outdoor exertion.'
  },
  POOR: {
    label: 'Poor',
    name: 'Poor',
    min: 201,
    max: 300,
    color: '#f97316',
    textColor: '#ffffff',
    badgeClass:
      'bg-orange-100 text-orange-950 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-800',
    healthImpact: 'Breathing discomfort to most people on prolonged exposure',
    advisory: 'Wear an N95 mask outdoors. Avoid strenuous outdoor activities.'
  },
  VERY_POOR: {
    label: 'Very Poor',
    name: 'Very Poor',
    min: 301,
    max: 400,
    color: '#ef4444',
    textColor: '#ffffff',
    badgeClass:
      'bg-red-100 text-red-950 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800',
    healthImpact: 'Respiratory illness on prolonged exposure',
    advisory: 'Avoid outdoor activities. Keep windows closed and run air filtration.'
  },
  SEVERE: {
    label: 'Severe',
    name: 'Severe',
    min: 401,
    max: 500,
    color: '#7f1d1d',
    textColor: '#ffffff',
    badgeClass:
      'bg-rose-950 text-rose-100 dark:bg-rose-950/90 dark:text-rose-200 border-rose-800 dark:border-rose-900',
    healthImpact: 'Affects healthy people and seriously impacts those with existing diseases',
    advisory: 'Remain indoors. Keep windows and doors sealed. Run HEPA filtration.'
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
 * Model identifiers, generation settings, and provider labels.
 */
export const GEMINI_PRIMARY_MODEL = 'gemini-3.1-flash-lite';
export const GEMINI_FALLBACK_MODEL = 'gemini-flash-latest';

export const GEMINI_CANDIDATE_MODELS = Object.freeze([
  GEMINI_PRIMARY_MODEL,
  GEMINI_FALLBACK_MODEL,
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash'
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
