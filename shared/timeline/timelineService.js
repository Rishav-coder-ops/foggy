// shared/timeline/timelineService.js
/**
 * @fileoverview Domain service for fetching, calculating, and structuring Indian City AQI timelines.
 */

import { getAQICategory } from '../aqi.js';
import { INDIAN_FALLBACK_CITIES } from '../geocode.js';
import { INDIAN_METROS, INDIAN_CITY_ALIASES } from './constants.js';
import { buildTimelinePoints, findBestAndWorstHours } from './cpcbCalculation.js';
import { generateSampleTimelineData, getSlotAdvice } from './sampleFallback.js';

export async function geocodeIndianCity(cityName) {
  if (!cityName || typeof cityName !== 'string') return null;
  const trimmed = cityName.trim();
  const baseName = trimmed.split(/[,–—|-]/)[0].trim();
  const canonicalName =
    INDIAN_CITY_ALIASES[trimmed.toLowerCase()] ||
    INDIAN_CITY_ALIASES[baseName.toLowerCase()] ||
    baseName;

  const fallback = INDIAN_FALLBACK_CITIES.find(
    (c) =>
      c.name.toLowerCase() === canonicalName.toLowerCase() ||
      c.name.toLowerCase() === trimmed.toLowerCase() ||
      c.name.toLowerCase() === baseName.toLowerCase()
  );
  if (fallback) {
    return {
      name: fallback.name,
      latitude: fallback.latitude ?? fallback.lat,
      longitude: fallback.longitude ?? fallback.lon,
      admin1: fallback.admin1 ?? fallback.state ?? '',
      country: 'India',
      population: fallback.population || 0
    };
  }

  const metro = INDIAN_METROS.find(
    (m) =>
      m.name.toLowerCase() === canonicalName.toLowerCase() ||
      m.name.toLowerCase() === trimmed.toLowerCase() ||
      m.name.toLowerCase() === baseName.toLowerCase()
  );
  if (metro) {
    return {
      name: metro.name,
      latitude: metro.lat,
      longitude: metro.lon,
      admin1: metro.admin1,
      country: 'India',
      population: 5000000
    };
  }

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(canonicalName)}&count=5&language=en&format=json`;
    const res = await fetch(geoUrl, {
      headers: { 'User-Agent': 'FoggyAirQualityIndia/1.0' },
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = await res.json();
      const validResults = (data.results || []).filter(
        (r) => r && (r.country === 'India' || r.country_code === 'IN')
      );
      const validFeatureCodes = [
        'PPLC',
        'PPLA',
        'PPLA2',
        'PPLA3',
        'PPLA4',
        'PPL',
        'ADM1',
        'ADM2',
        'ADM3'
      ];
      const top = validResults.find((r) => !r.feature_code || validFeatureCodes.includes(r.feature_code)) || null;

      if (top) {
        // Prevent fuzzy prefix false positives for short words (<= 4 chars)
        if (canonicalName.length <= 4 && top.name.toLowerCase() !== canonicalName.toLowerCase()) {
          return null;
        }
        return {
          name: top.name,
          latitude: top.latitude,
          longitude: top.longitude,
          admin1: top.admin1 || '',
          country: 'India',
          population: top.population || 0
        };
      }
    }
  } catch (err) {
    console.warn(`Geocoding error for ${canonicalName}:`, err.message);
  }

  return null;
}

function resolveCityTarget(cityNameOrObj) {
  if (typeof cityNameOrObj === 'string') {
    return null; // needs async geocoding
  }
  if (cityNameOrObj && typeof cityNameOrObj.lat === 'number' && typeof cityNameOrObj.lon === 'number') {
    return {
      name: cityNameOrObj.name || 'Unknown City',
      latitude: cityNameOrObj.lat,
      longitude: cityNameOrObj.lon,
      admin1: cityNameOrObj.admin1 || '',
      country: 'India'
    };
  }
  return { notFound: true };
}

export async function fetchCityAqiReport(cityNameOrObj, timeframe = 'now') {
  let cityInfo = resolveCityTarget(cityNameOrObj);
  if (!cityInfo && typeof cityNameOrObj === 'string') {
    cityInfo = await geocodeIndianCity(cityNameOrObj);
  }
  if (!cityInfo || cityInfo.notFound) {
    return { found: false, city: typeof cityNameOrObj === 'string' ? cityNameOrObj : 'Unknown' };
  }

  const { name, latitude: lat, longitude: lon, admin1 } = cityInfo;

  try {
    const apiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10&past_days=1&forecast_days=7&timezone=auto`;
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': 'FoggyAirQualityIndia/1.0' },
      signal: AbortSignal.timeout(7000)
    });

    if (!res.ok) throw new Error(`Open-Meteo responded with status ${res.status}`);
    const data = await res.json();
    const times = data.hourly?.time || [];
    const pm25s = data.hourly?.pm2_5 || [];
    const pm10s = data.hourly?.pm10 || [];

    if (times.length === 0) throw new Error('No hourly data from Open-Meteo');

    const tz = data.timezone || 'Asia/Kolkata';
    const points = buildTimelinePoints(times, pm25s, pm10s);

    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: tz });
    const currentHourInt = parseInt(
      now.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', hour12: false }),
      10
    );
    const targetHourStr = `${todayStr}T${String(currentHourInt).padStart(2, '0')}:00`;

    let currentIdx = times.indexOf(targetHourStr);
    if (currentIdx === -1) {
      currentIdx = times.findIndex((t) => t.startsWith(todayStr));
      if (currentIdx === -1) currentIdx = Math.min(36, times.length - 1);
    }

    const currentPoint = points[currentIdx] || points[points.length - 1];

    const start24 = Math.max(0, currentIdx - 12);
    const end24 = Math.min(points.length, start24 + 24);
    const slice24 = points.slice(start24, end24);
    const { best: bestHour24h, worst: worstHour24h } = findBestAndWorstHours(slice24);

    const validAqis = slice24.map((p) => p.aqi).filter((a) => a != null);
    const avg24 = validAqis.length > 0 ? Math.round(validAqis.reduce((a, b) => a + b, 0) / validAqis.length) : currentPoint.aqi;

    const tonightSlot = points.slice(currentIdx).find((p) => p.hour.startsWith('20:')) || currentPoint;
    const tomorrowStr = new Date(now.getTime() + 86400 * 1000).toLocaleDateString('en-CA', { timeZone: tz });
    const tomorrowPoints = points.filter((p) => p.date === tomorrowStr);
    const tomorrowAqis = tomorrowPoints.map((p) => p.aqi).filter((a) => a != null);
    const tomorrowAvg = tomorrowAqis.length > 0 ? Math.round(tomorrowAqis.reduce((a, b) => a + b, 0) / tomorrowAqis.length) : avg24;
    const tomorrowCat = getAQICategory(tomorrowAvg);
    const { best: tomorrowBest, worst: tomorrowWorst } = findBestAndWorstHours(tomorrowPoints.length > 0 ? tomorrowPoints : [currentPoint]);

    return {
      found: true,
      city: name,
      admin1,
      lat,
      lon,
      country: 'India',
      timeframe,
      current: {
        aqi: currentPoint.aqi,
        category: currentPoint.category,
        dominant: currentPoint.dominant,
        pm25: currentPoint.pm25,
        pm10: currentPoint.pm10,
        rollingPm25: currentPoint.rollingPm25,
        rollingPm10: currentPoint.rollingPm10,
        time: `${currentPoint.hour} IST`,
        hourStr: currentPoint.hour
      },
      averageAqi24h: avg24,
      bestHour24h: {
        hour: bestHour24h?.hour || '14:00',
        aqi: bestHour24h?.aqi || currentPoint.aqi,
        category: bestHour24h?.category || currentPoint.category
      },
      worstHour24h: {
        hour: worstHour24h?.hour || '08:00',
        aqi: worstHour24h?.aqi || currentPoint.aqi,
        category: worstHour24h?.category || currentPoint.category
      },
      tonight: {
        time: `${tonightSlot.hour} IST`,
        aqi: tonightSlot.aqi,
        category: tonightSlot.category,
        dominant: tonightSlot.dominant
      },
      tomorrow: {
        date: tomorrowStr,
        averageAqi: tomorrowAvg,
        category: tomorrowCat.name,
        cleanestSlot: {
          hour: tomorrowBest?.hour || '14:00',
          aqi: tomorrowBest?.aqi || tomorrowAvg,
          category: tomorrowBest?.category || tomorrowCat.name
        },
        peakSlot: {
          hour: tomorrowWorst?.hour || '08:00',
          aqi: tomorrowWorst?.aqi || tomorrowAvg,
          category: tomorrowWorst?.category || tomorrowCat.name
        }
      },
      isSample: false,
      source: 'Open-Meteo CAMS Model (Live Feed)'
    };
  } catch (err) {
    console.warn(`Live AQI fetch failed for ${name}, using sample generator:`, err.message);
    const sample = generateSampleTimelineData(lat, lon, name);
    return {
      found: true,
      city: name,
      admin1,
      lat,
      lon,
      country: 'India',
      timeframe,
      current: {
        aqi: sample.currentAqi,
        category: getAQICategory(sample.currentAqi).name,
        dominant: sample.dominantPollutant,
        pm25: Math.round(sample.currentAqi * 0.48 * 10) / 10,
        pm10: Math.round(sample.currentAqi * 0.85 * 10) / 10,
        time: `${sample.currentHour} IST`,
        hourStr: sample.currentHour
      },
      averageAqi24h: sample.averageAqi24h,
      bestHour24h: {
        hour: sample.bestHour24h.hour,
        aqi: sample.bestHour24h.aqi,
        category: getAQICategory(sample.bestHour24h.aqi).name
      },
      worstHour24h: {
        hour: sample.worstHour24h.hour,
        aqi: sample.worstHour24h.aqi,
        category: getAQICategory(sample.worstHour24h.aqi).name
      },
      tonight: {
        time: '20:00 IST',
        aqi: Math.round(sample.currentAqi * 1.15),
        category: getAQICategory(Math.round(sample.currentAqi * 1.15)).name,
        dominant: 'PM2.5'
      },
      tomorrow: {
        date: sample.forecast7Days[1]?.date || 'Tomorrow',
        averageAqi: sample.forecast7Days[1]?.averageAqi || sample.currentAqi,
        category: getAQICategory(sample.forecast7Days[1]?.averageAqi || sample.currentAqi).label,
        cleanestSlot: {
          hour: '14:00',
          aqi: Math.round(sample.currentAqi * 0.75),
          category: getAQICategory(Math.round(sample.currentAqi * 0.75)).label
        },
        peakSlot: {
          hour: '08:00',
          aqi: Math.round(sample.currentAqi * 1.3),
          category: getAQICategory(Math.round(sample.currentAqi * 1.3)).label
        }
      },
      isSample: true,
      source: 'Simulation Mode (Sample data, live data unavailable)'
    };
  }
}

function buildForecast7Days(points, weekdays, shortDays, targetSlotHours) {
  const dayMap = {};
  points.forEach((p) => {
    if (!dayMap[p.date]) dayMap[p.date] = [];
    dayMap[p.date].push(p);
  });

  const dates = Object.keys(dayMap).sort();
  const forecastDates = dates.length > 7 ? dates.slice(1, 8) : dates.slice(0, 7);

  return forecastDates.map((dateStr, dayIndex) => {
    const dayPoints = dayMap[dateStr] || [];
    const dObj = new Date(dateStr + 'T12:00:00Z');
    const weekday = weekdays[dObj.getUTCDay()];
    const shortDay = shortDays[dObj.getUTCDay()];

    const intervals3h = targetSlotHours.map((slotTime) => {
      const found = dayPoints.find((p) => p.hour === slotTime);
      let aqiVal = found?.aqi;
      if (aqiVal == null) {
        const nearest = dayPoints.find((p) => p.aqi != null);
        aqiVal = nearest ? nearest.aqi : 160;
      }
      const cat = getAQICategory(aqiVal);
      return {
        time: slotTime,
        aqi: aqiVal,
        dominant: found?.dominant || 'PM2.5',
        pm25: found?.pm25 ?? Math.round(aqiVal * 0.45 * 10) / 10,
        pm10: found?.pm10 ?? Math.round(aqiVal * 0.82 * 10) / 10,
        category: cat.name,
        color: cat.color,
        badgeClass: cat.badgeClass,
        healthImpact: cat.healthImpact,
        advice: getSlotAdvice(aqiVal, slotTime),
        diffFromAvg: 0
      };
    });

    const validAqis = intervals3h.map((s) => s.aqi);
    const avgAqi = Math.round(validAqis.reduce((a, b) => a + b, 0) / validAqis.length);
    const minAqi = Math.min(...validAqis);
    const maxAqi = Math.max(...validAqis);

    intervals3h.forEach((s) => {
      s.diffFromAvg = s.aqi - avgAqi;
      s.diffText = s.diffFromAvg > 0 ? `+${s.diffFromAvg} vs avg` : `${s.diffFromAvg} vs avg`;
    });

    let bestSlot = intervals3h[0];
    let worstSlot = intervals3h[0];
    intervals3h.forEach((s) => {
      if (s.aqi < bestSlot.aqi) bestSlot = s;
      if (s.aqi > worstSlot.aqi) worstSlot = s;
    });

    const dayCat = getAQICategory(avgAqi);

    return {
      date: dateStr,
      dayName: weekday,
      shortDay,
      isToday: dayIndex === 0,
      dayIndex,
      averageAqi: avgAqi,
      minAqi,
      maxAqi,
      dominantCategory: dayCat.name,
      color: dayCat.color,
      badgeClass: dayCat.badgeClass,
      healthImpact: dayCat.healthImpact,
      intervals3h,
      bestSlot,
      worstSlot
    };
  });
}

export async function fetchTimelineData(lat, lon, cityName) {
  try {
    const apiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10&past_days=1&forecast_days=7&timezone=auto`;
    const upstreamRes = await fetch(apiUrl, {
      headers: { 'User-Agent': 'FoggyAirQualityIndia/1.0' },
      signal: AbortSignal.timeout(8000)
    });

    if (!upstreamRes.ok) {
      throw new Error(`Open-Meteo responded with status ${upstreamRes.status}`);
    }

    const data = await upstreamRes.json();
    const timezone = data.timezone || 'Asia/Kolkata';
    const times = data.hourly?.time || [];
    const pm25s = data.hourly?.pm2_5 || [];
    const pm10s = data.hourly?.pm10 || [];

    if (times.length === 0) {
      throw new Error('No hourly data returned from Open-Meteo.');
    }

    const points = buildTimelinePoints(times, pm25s, pm10s);

    let latestValidIdx = points.length - 1;
    for (let i = points.length - 1; i >= 0; i--) {
      if (points[i].aqi !== null) {
        latestValidIdx = i;
        break;
      }
    }

    const currentHourIdx = Math.min(latestValidIdx, 36);
    const start24Idx = Math.max(0, currentHourIdx - 23);
    const last24Slice = points.slice(start24Idx, start24Idx + 24);

    let lastValidAqi = 150;
    const last24Hours = last24Slice.map((p) => {
      if (p.aqi !== null) {
        lastValidAqi = p.aqi;
      } else {
        p.aqi = lastValidAqi;
        const cat = getAQICategory(p.aqi);
        p.category = cat.name;
        p.color = cat.color;
        p.badgeClass = cat.badgeClass;
        p.healthImpact = cat.healthImpact;
      }
      return p;
    });

    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const targetSlotHours = ['02:00', '05:00', '08:00', '11:00', '14:00', '17:00', '20:00', '23:00'];

    const forecast7Days = buildForecast7Days(points, weekdays, shortDays, targetSlotHours);

    const latest = last24Hours[last24Hours.length - 1];
    const all24Aqi = last24Hours.map((h) => h.aqi);
    const avg24 = Math.round(all24Aqi.reduce((a, b) => a + b, 0) / all24Aqi.length);
    let bestHour = last24Hours[0];
    let worstHour = last24Hours[0];
    last24Hours.forEach((h) => {
      if (h.aqi < bestHour.aqi) bestHour = h;
      if (h.aqi > worstHour.aqi) worstHour = h;
    });

    return {
      timezone,
      location: {
        latitude: lat,
        longitude: lon,
        city: cityName,
        country: 'India'
      },
      scale: 'CPCB National AQI (0-500)',
      standard: 'Estimated NAQI (from PM2.5 and PM10)',
      currentAqi: latest.aqi,
      currentHour: latest.hour,
      dominantPollutant: latest.dominant || 'PM2.5',
      averageAqi24h: avg24,
      bestHour24h: { hour: bestHour.hour, aqi: bestHour.aqi },
      worstHour24h: { hour: worstHour.hour, aqi: worstHour.aqi },
      cleanestWindowTip: `Cleanest window was around ${bestHour.hour} (Estimated NAQI ${bestHour.aqi}). Safest window for outdoor activity or airing your space.`,
      last24Hours,
      forecast7Days,
      attribution:
        'Air quality data: Open-Meteo.com, based on Copernicus Atmosphere Monitoring Service (CAMS) model data',
      disclaimer:
        'Estimated from modelled data; official CPCB station readings may differ. Check the official CPCB bulletin or the SAMEER app for authoritative values.',
      medicalDisclaimer:
        'Foggy is an AI assistant, not a doctor. In a medical emergency, call 112.',
      isSample: false,
      source: 'Open-Meteo CAMS Model (Live Feed)'
    };
  } catch (err) {
    console.warn('Open-Meteo request failed, serving clearly labelled sample data:', err);
    const sampleData = generateSampleTimelineData(lat, lon, cityName);
    sampleData.simulationReason =
      'Upstream atmospheric service temporarily unavailable; using atmospheric simulation model.';
    return sampleData;
  }
}
