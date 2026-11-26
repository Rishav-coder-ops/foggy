// shared/aqi/upstreamClient.js
/**
 * @fileoverview Upstream atmospheric fetching from Open-Meteo, rolling averages, and city coordinate resolution.
 */

export { calculateDistanceKm } from './distance.js';
export { resolveCityCoordinates } from './coordinateResolver.js';
export { fetchUpstreamAqiData } from './upstreamFetcher.js';
