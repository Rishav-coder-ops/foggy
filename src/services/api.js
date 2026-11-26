// src/services/api.js
/**
 * @fileoverview Barrel export for Foggy client API services.
 * Re-exports domain-specific modules: AQI, Chat, Profile, and HTTP client.
 */

export {
  INDIAN_METROS,
  clearClientAqiCache,
  clearClientLastGoodLiveCache,
  saveClientLastGoodLive,
  getClientLastGoodLive,
  PRESET_CITY_COORDINATES,
  DEFAULT_CITY,
  getStoredCity,
  setStoredCity,
  fetchAQIData,
  searchCities,
  geocodeLocation,
  fetchAQITimeline
} from './aqiApi.js';

export { sendChatMessage } from './chatApi.js';
