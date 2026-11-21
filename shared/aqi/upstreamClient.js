// shared/aqi/upstreamClient.js
/**
 * @fileoverview Upstream atmospheric fetching from Open-Meteo, rolling averages, and city coordinate resolution.
 */

import { INDIAN_METROS } from '../timeline/constants.js';
import { INDIAN_FALLBACK_CITIES } from '../geocode.js';
import { INDIAN_CITY_SIMULATION_DB, getDeterministicMockCity, generateHourlyForecast } from './simulationDb.js';
import { calculateCPCBNAQI, getAQICategory, calculateRollingAverages } from '../aqi.js';

export { calculateRollingAverages };

export function resolveCityCoordinates(requestedCity, rawLat, rawLon) {
  let lat = 22.5726;
  let lon = 88.3639;
  let displayCity = requestedCity || 'Kolkata, West Bengal';

  if (
    !Number.isNaN(rawLat) &&
    !Number.isNaN(rawLon) &&
    rawLat >= -90 &&
    rawLat <= 90 &&
    rawLon >= -180 &&
    rawLon <= 180
  ) {
    return { lat: rawLat, lon: rawLon, displayCity: requestedCity };
  }

  const queryNorm = (requestedCity || '').toLowerCase().trim();

  const metroMatch = INDIAN_METROS.find(
    (m) => m.name.toLowerCase() === queryNorm || queryNorm.includes(m.name.toLowerCase())
  );
  if (metroMatch) {
    lat = metroMatch.lat;
    lon = metroMatch.lon;
    displayCity = `${metroMatch.name}, ${metroMatch.admin1 || 'India'}`;
    return { lat, lon, displayCity };
  }

  if (Array.isArray(INDIAN_FALLBACK_CITIES)) {
    const fallbackMatch = INDIAN_FALLBACK_CITIES.find(
      (c) =>
        c.name.toLowerCase() === queryNorm ||
        queryNorm.includes(c.name.toLowerCase()) ||
        (c.admin1 && queryNorm.includes(c.admin1.toLowerCase()))
    );
    if (fallbackMatch) {
      lat = fallbackMatch.latitude;
      lon = fallbackMatch.longitude;
      displayCity = `${fallbackMatch.name}, ${fallbackMatch.admin1 ? fallbackMatch.admin1 + ', ' : ''}India`;
      return { lat, lon, displayCity };
    }
  }

  const dbKey = Object.keys(INDIAN_CITY_SIMULATION_DB).find(
    (k) => queryNorm.includes(k) || k.includes(queryNorm)
  );
  if (dbKey) {
    lat = INDIAN_CITY_SIMULATION_DB[dbKey].lat;
    lon = INDIAN_CITY_SIMULATION_DB[dbKey].lon;
    displayCity = INDIAN_CITY_SIMULATION_DB[dbKey].city;
    return { lat, lon, displayCity };
  }

  return { lat, lon, displayCity };
}

export async function fetchWaqiReference(requestedCity, waqiToken) {
  if (!waqiToken || waqiToken === 'your_waqi_token_here' || waqiToken.trim().length <= 5) {
    return null;
  }
  try {
    const waqiUrl = `https://api.waqi.info/feed/${encodeURIComponent(requestedCity)}/?token=${waqiToken.trim()}`;
    const waqiRes = await fetch(waqiUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000)
    });
    if (waqiRes.ok) {
      const waqiJson = await waqiRes.json();
      if (waqiJson?.status === 'ok' && typeof waqiJson.data?.aqi === 'number') {
        return {
          station: waqiJson.data.city?.name || requestedCity,
          aqiUS: waqiJson.data.aqi,
          label: 'Nearest station (WAQI, US EPA scale)'
        };
      }
    }
  } catch {
    // Non-blocking
  }
  return null;
}

export async function fetchUpstreamAqiData(lat, lon, requestedCity, displayCity, waqiToken) {
  const waqiReference = await fetchWaqiReference(requestedCity, waqiToken);

  try {
    const openMeteoUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10&current=pm2_5,pm10&past_days=1&forecast_days=1&timezone=auto`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`;

    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      console.log('[API /api/aqi] Outbound Open-Meteo Air Quality URL:', openMeteoUrl);
      console.log('[API /api/aqi] Outbound Open-Meteo Weather URL:', weatherUrl);
    }

    const [openMeteoRes, weatherRes] = await Promise.allSettled([
      fetch(openMeteoUrl, {
        headers: { 'User-Agent': 'FoggyAirQualityIndia/1.0' },
        signal: AbortSignal.timeout(7500)
      }),
      fetch(weatherUrl, {
        headers: { 'User-Agent': 'FoggyAirQualityIndia/1.0' },
        signal: AbortSignal.timeout(7500)
      })
    ]);

    if (openMeteoRes.status !== 'fulfilled' || !openMeteoRes.value.ok) {
      throw new Error(
        `Open-Meteo Air Quality failed: ${openMeteoRes.status === 'fulfilled' ? openMeteoRes.value.status : openMeteoRes.reason?.message}`
      );
    }

    const data = await openMeteoRes.value.json();
    const pm25s = data.hourly?.pm2_5 || [];
    const pm10s = data.hourly?.pm10 || [];

    if (pm25s.length === 0) {
      throw new Error('Empty hourly data from Open-Meteo.');
    }

    const { avgPm25, avgPm10 } = calculateRollingAverages(pm25s, pm10s);
    const naqi = calculateCPCBNAQI(avgPm25, avgPm10);
    const cat = getAQICategory(naqi.aqi);
    const hourlyForecast = generateHourlyForecast(naqi.aqi);

    let weather = {
      temp: 24,
      humidity: 68,
      windSpeed: 3.2,
      condition: 'Atmospheric Station'
    };

    if (weatherRes.status === 'fulfilled' && weatherRes.value.ok) {
      try {
        const wJson = await weatherRes.value.json();
        if (wJson.current) {
          weather = {
            temp:
              wJson.current.temperature_2m != null
                ? Math.round(wJson.current.temperature_2m * 10) / 10
                : 24,
            humidity:
              wJson.current.relative_humidity_2m != null
                ? Math.round(wJson.current.relative_humidity_2m)
                : 68,
            windSpeed:
              wJson.current.wind_speed_10m != null
                ? Math.round(wJson.current.wind_speed_10m * 10) / 10
                : 3.2,
            condition: 'Live Meteorological Station'
          };
        }
      } catch {}
    }

    const gridLat = typeof data.latitude === 'number' ? data.latitude : lat;
    const gridLon = typeof data.longitude === 'number' ? data.longitude : lon;
    const gridPoint = {
      lat: Number(gridLat.toFixed(2)),
      lon: Number(gridLon.toFixed(2))
    };

    const rawTime =
      data.current?.time ||
      (data.hourly?.time && data.hourly.time.length > 0
        ? data.hourly.time[data.hourly.time.length - 1]
        : null);

    let formattedTime = 'Just now';
    if (rawTime) {
      try {
        const parsed = new Date(rawTime);
        if (!isNaN(parsed.getTime())) {
          formattedTime = parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
          const part = rawTime.split('T')[1];
          if (part) formattedTime = part.slice(0, 5);
        }
      } catch {
        formattedTime = 'Just now';
      }
    }

    return {
      city: displayCity,
      aqi: naqi.aqi,
      scale: 'CPCB National AQI (0-500)',
      standard: 'Estimated NAQI (from PM2.5 and PM10)',
      category: cat.name,
      color: cat.color,
      badgeClass: cat.badgeClass,
      healthImpact: cat.healthImpact,
      advisory: cat.advisory,
      dominantPollutant: naqi.dominant,
      pollutants: {
        pm25: Math.round(avgPm25 * 10) / 10,
        pm10: Math.round(avgPm10 * 10) / 10,
        no2: Math.round(avgPm25 * 0.42),
        o3: Math.round(avgPm25 * 0.32),
        so2: Math.round(avgPm25 * 0.12),
        co: Math.round(avgPm25 * 0.015 * 10) / 10
      },
      weather,
      gridPoint,
      latitude: gridPoint.lat,
      longitude: gridPoint.lon,
      dataTimestamp: rawTime,
      time: rawTime,
      updatedAt: formattedTime,
      forecastHourly: hourlyForecast,
      isMock: false,
      source: 'Live Open-Meteo CAMS Model Feed',
      attribution:
        'Air quality data: Open-Meteo.com, based on Copernicus Atmosphere Monitoring Service (CAMS) model data',
      disclaimer:
        'Estimated from modelled data; official CPCB station readings may differ. Check the official CPCB bulletin or the SAMEER app for authoritative values.',
      medicalDisclaimer:
        'Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.',
      waqiReference
    };
  } catch (_err) {
    const mock = getDeterministicMockCity(requestedCity, lat, lon);
    const cat = getAQICategory(mock.aqi);
    const hourlyForecast = generateHourlyForecast(mock.aqi);

    return {
      city: mock.city,
      aqi: mock.aqi,
      scale: 'CPCB National AQI (0-500)',
      standard: 'Estimated NAQI (from PM2.5 and PM10)',
      category: cat.name,
      color: cat.color,
      badgeClass: cat.badgeClass,
      healthImpact: cat.healthImpact,
      advisory: cat.advisory,
      dominantPollutant: mock.dominant || 'PM2.5',
      pollutants: {
        pm25: mock.pm25,
        pm10: mock.pm10,
        no2: mock.no2,
        o3: mock.o3,
        so2: mock.so2,
        co: mock.co
      },
      weather: {
        temp: mock.temp,
        humidity: mock.humidity,
        windSpeed: mock.windSpeed,
        condition: mock.condition
      },
      gridPoint: {
        lat: Number(lat.toFixed(2)),
        lon: Number(lon.toFixed(2))
      },
      latitude: Number(lat.toFixed(2)),
      longitude: Number(lon.toFixed(2)),
      time: new Date().toISOString(),
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      forecastHourly: hourlyForecast,
      isMock: true,
      source: 'Simulation Mode (Sample data, live data unavailable)',
      simulationReason:
        'Upstream air quality service temporarily unavailable; using atmospheric simulation model.',
      attribution:
        'Air quality data: Open-Meteo.com, based on Copernicus Atmosphere Monitoring Service (CAMS) model data',
      disclaimer:
        'Estimated from modelled data; official CPCB station readings may differ. Check the official CPCB bulletin or the SAMEER app for authoritative values.',
      medicalDisclaimer:
        'Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.',
      waqiReference
    };
  }
}
