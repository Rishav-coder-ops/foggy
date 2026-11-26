/**
 * @fileoverview Network fetchers for live AQI telemetry, geocoding search, and multi-day timeline endpoints.
 */

import { getAQICategory } from '../../shared/aqi.js';
import { geocodeIndianCity } from '../../shared/timeline/timelineService.js';
import { calculateDistanceKm } from '../../shared/aqi/upstreamClient.js';
import {
  clientAqiCache,
  CLIENT_CACHE_TTL_MS,
  getClientAqiCacheKey,
  getClientLastGoodLive,
  saveClientLastGoodLive,
  buildFallbackAqiPayload,
  buildFallbackTimelinePayload,
  normalizeAqiParams,
  PRESET_CITY_COORDINATES,
  KOLKATA_LATITUDE,
  KOLKATA_LONGITUDE,
  COORDINATE_TOLERANCE,
  MAX_ALLOWED_GRID_DISTANCE_KM
} from './aqiTransformers.js';

export async function fetchAQIData(params = {}, legacyLat = null, legacyLon = null) {
  let { lat, lon, cityName, stateName, signal, bypassCache } = normalizeAqiParams(
    params,
    legacyLat,
    legacyLon
  );

  const isCityKolkata = cityName && cityName.toLowerCase().includes('kolkata');
  const hasKolkataCoords =
    lat != null &&
    lon != null &&
    Math.abs(Number(lat) - KOLKATA_LATITUDE) < COORDINATE_TOLERANCE &&
    Math.abs(Number(lon) - KOLKATA_LONGITUDE) < COORDINATE_TOLERANCE;

  if (!isCityKolkata && hasKolkataCoords) {
    lat = null;
    lon = null;
  }

  let resolvedCity = cityName;
  let resolvedState = stateName;
  if ((lat == null || lon == null || isNaN(Number(lat)) || isNaN(Number(lon))) && cityName) {
    const geo = await geocodeIndianCity(stateName ? `${cityName}, ${stateName}` : cityName);
    if (geo && typeof geo.latitude === 'number' && typeof geo.longitude === 'number') {
      lat = geo.latitude;
      lon = geo.longitude;
      resolvedCity = geo.name || cityName;
      if (!resolvedState && geo.admin1) resolvedState = geo.admin1;
    }
  }

  if (!resolvedCity && (lat == null || lon == null)) {
    resolvedCity = 'Kolkata';
    resolvedState = 'West Bengal';
    lat = KOLKATA_LATITUDE;
    lon = KOLKATA_LONGITUDE;
  }

  const cleanCity = resolvedState ? `${resolvedCity}, ${resolvedState}` : resolvedCity;
  const cacheKey = getClientAqiCacheKey(lat, lon, 'aqi');
  const now = Date.now();

  if (cacheKey && !bypassCache) {
    const cached = clientAqiCache.get(cacheKey);
    if (cached && now < cached.expiresAt) return cached.data;
  }

  try {
    let url = `/api/aqi?city=${encodeURIComponent(cleanCity)}`;
    if (lat !== null && lon !== null && !isNaN(Number(lat)) && !isNaN(Number(lon))) {
      url += `&lat=${encodeURIComponent(Number(lat))}&lon=${encodeURIComponent(Number(lon))}`;
    }

    const res = await fetch(url, signal ? { signal } : {});
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      if (errJson.error === 'GRID_MISMATCH' || errJson.error === 'LOCATION_NOT_FOUND') {
        return {
          error: errJson.error,
          message: errJson.message || `Could not load verified air data for ${cleanCity}.`,
          city: cleanCity,
          requestedCoords:
            lat != null && lon != null
              ? { lat: Number(Number(lat).toFixed(2)), lon: Number(Number(lon).toFixed(2)) }
              : null,
          gridPoint: errJson.gridPoint || null
        };
      }
      throw new Error(`Failed to load AQI data (Status ${res.status})`);
    }

    const json = await res.json();
    if (json.isMock && lat != null && lon != null) {
      const cachedLive = getClientLastGoodLive(lat, lon);
      if (cachedLive) {
        if (cacheKey)
          clientAqiCache.set(cacheKey, { data: cachedLive, expiresAt: now + CLIENT_CACHE_TTL_MS });
        return cachedLive;
      }
    }

    const gridLat = json.gridPoint?.lat ?? json.latitude;
    const gridLon = json.gridPoint?.lon ?? json.longitude;

    if (lat != null && lon != null && gridLat != null && gridLon != null) {
      const dist = calculateDistanceKm(Number(lat), Number(lon), Number(gridLat), Number(gridLon));
      if (dist > MAX_ALLOWED_GRID_DISTANCE_KM) {
        console.error(
          `[AQI Sanity Guard] Discarding response: model grid point (${gridLat}, ${gridLon}) is ${dist.toFixed(1)} km from requested (${lat}, ${lon}) which exceeds 60 km limit.`
        );
        return {
          error: 'GRID_MISMATCH',
          message: `Atmospheric model grid point (${Number(gridLat).toFixed(2)}°N, ${Number(gridLon).toFixed(2)}°E) is ${dist.toFixed(1)} km from ${cleanCity}, exceeding the 60 km accuracy boundary.`,
          city: cleanCity,
          requestedCoords: {
            lat: Number(Number(lat).toFixed(2)),
            lon: Number(Number(lon).toFixed(2))
          },
          gridPoint: {
            lat: Number(Number(gridLat).toFixed(2)),
            lon: Number(Number(gridLon).toFixed(2))
          },
          distanceKm: Math.round(dist * 10) / 10
        };
      }
    }

    if (lat != null && lon != null) {
      json.requestedCoords = {
        lat: Number(Number(lat).toFixed(2)),
        lon: Number(Number(lon).toFixed(2))
      };
    }
    if (!json.gridPoint && gridLat != null && gridLon != null) {
      json.gridPoint = {
        lat: Number(Number(gridLat).toFixed(2)),
        lon: Number(Number(gridLon).toFixed(2))
      };
    }

    const officialCat = getAQICategory(json.aqi);
    json.category = officialCat.name;
    json.color = officialCat.color;
    json.badgeClass = officialCat.badgeClass;
    json.healthImpact = officialCat.healthImpact;
    json.advisory = officialCat.advisory;

    if (!json.isMock) saveClientLastGoodLive(lat, lon, json);
    if (cacheKey)
      clientAqiCache.set(cacheKey, { data: json, expiresAt: now + CLIENT_CACHE_TTL_MS });

    return json;
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    console.warn('AQI fetch error, using safe client fallback:', err);
    if (lat == null || lon == null || isNaN(Number(lat)) || isNaN(Number(lon))) {
      return {
        error: 'LOCATION_NOT_FOUND',
        message: `Could not resolve verified Indian coordinates for '${cleanCity}'. Please check your location.`,
        city: cleanCity
      };
    }

    const cachedLive = getClientLastGoodLive(lat, lon);
    if (cachedLive) {
      if (cacheKey)
        clientAqiCache.set(cacheKey, { data: cachedLive, expiresAt: now + CLIENT_CACHE_TTL_MS });
      return cachedLive;
    }

    const fallbackPayload = buildFallbackAqiPayload(cleanCity, Number(lat), Number(lon), err);
    if (cacheKey)
      clientAqiCache.set(cacheKey, { data: fallbackPayload, expiresAt: now + CLIENT_CACHE_TTL_MS });
    return fallbackPayload;
  }
}

export async function searchCities(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(`/api/geocode?name=${encodeURIComponent(query.trim())}&countryCode=IN`);
    if (!res.ok) throw new Error('Geocoding search failed');
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.warn('City search fallback:', err);
    const qLower = query.toLowerCase().trim();
    return Object.values(PRESET_CITY_COORDINATES)
      .filter((c) => c.name.toLowerCase().includes(qLower))
      .map((c) => ({
        name: c.name,
        country: c.country,
        admin1: c.admin1,
        latitude: c.lat,
        longitude: c.lon
      }));
  }
}

export async function geocodeLocation(options = {}, maybeCountry = 'IN') {
  let name = '';
  let countryCode = 'IN';
  let count = 10;

  if (typeof options === 'string') {
    name = options;
    countryCode = typeof maybeCountry === 'string' ? maybeCountry : 'IN';
  } else if (options && typeof options === 'object') {
    name = options.name || options.query || '';
    countryCode = options.countryCode || options.country || 'IN';
    count = options.count || 10;
  }

  const cleanCountry = (countryCode || '').trim().toLowerCase();
  const normalizedCountry =
    cleanCountry === 'india' || cleanCountry === 'in'
      ? 'IN'
      : (countryCode || 'IN').trim().slice(0, 2).toUpperCase();

  if (!name || name.trim().length < 2) return [];
  const params = new URLSearchParams({ name: name.trim(), count: String(count) });
  if (normalizedCountry) params.append('countryCode', normalizedCountry);

  const res = await fetch(`/api/geocode?${params.toString()}`);
  if (!res.ok) throw new Error(`Geocoding failed with status ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

export async function fetchAQITimeline({ lat = 22.5726, lon = 88.3639, city = 'Kolkata' } = {}) {
  try {
    const res = await fetch(
      `/api/aqi-timeline?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}`
    );
    if (!res.ok) throw new Error(`Timeline fetch failed (Status ${res.status})`);
    return await res.json();
  } catch (err) {
    console.warn('AQI timeline fetch failed, using fallback:', err);
    return buildFallbackTimelinePayload(lat, lon, city);
  }
}
