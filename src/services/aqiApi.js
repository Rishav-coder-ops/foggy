/**
 * @fileoverview Client AQI API service barrel for Foggy communicating with /api/aqi, /api/geocode, and /api/aqi-timeline.
 * Re-exports network fetchers from ./aqiFetchers.js and caching/transformers from ./aqiTransformers.js.
 */

import { INDIAN_METROS } from '../../shared/timeline/constants.js';

export { INDIAN_METROS };

export {
  PRESET_CITY_COORDINATES,
  DEFAULT_CITY,
  clearClientAqiCache,
  clearClientLastGoodLiveCache,
  saveClientLastGoodLive,
  getClientLastGoodLive,
  getStoredCity,
  setStoredCity
} from './aqiTransformers.js';

export { fetchAQIData, searchCities, geocodeLocation, fetchAQITimeline } from './aqiFetchers.js';
