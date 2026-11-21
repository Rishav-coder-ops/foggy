// shared/aqi/simulationDb.js
/**
 * @fileoverview Deterministic simulated air quality metrics and hourly forecast generator.
 */

import { calculateCPCBNAQI } from '../aqi.js';

export const INDIAN_CITY_SIMULATION_DB = Object.freeze({
  kolkata: {
    city: 'Kolkata, West Bengal',
    lat: 22.5726,
    lon: 88.3639,
    pm25: 84.5,
    pm10: 148.0,
    no2: 46,
    o3: 32,
    so2: 14,
    co: 1.2,
    temp: 24,
    humidity: 72,
    windSpeed: 2.4,
    condition: 'Winter Riverine Inversion Haze'
  },
  delhi: {
    city: 'Delhi, India',
    lat: 28.6139,
    lon: 77.209,
    pm25: 168.0,
    pm10: 295.0,
    no2: 82,
    o3: 42,
    so2: 22,
    co: 3.4,
    temp: 16,
    humidity: 78,
    windSpeed: 1.8,
    condition: 'Heavy Winter Stagnation Smog'
  },
  mumbai: {
    city: 'Mumbai, Maharashtra',
    lat: 19.076,
    lon: 72.8777,
    pm25: 68.2,
    pm10: 122.0,
    no2: 44,
    o3: 28,
    so2: 12,
    co: 1.1,
    temp: 28,
    humidity: 68,
    windSpeed: 4.2,
    condition: 'Coastal Particulate Haze'
  },
  chennai: {
    city: 'Chennai, Tamil Nadu',
    lat: 13.0827,
    lon: 80.2707,
    pm25: 38.5,
    pm10: 64.0,
    no2: 24,
    o3: 22,
    so2: 8,
    co: 0.6,
    temp: 29,
    humidity: 80,
    windSpeed: 5.6,
    condition: 'Moderate Coastal Breeze'
  },
  bengaluru: {
    city: 'Bengaluru, Karnataka',
    lat: 12.9716,
    lon: 77.5946,
    pm25: 42.0,
    pm10: 72.0,
    no2: 32,
    o3: 26,
    so2: 7,
    co: 0.8,
    temp: 22,
    humidity: 62,
    windSpeed: 4.8,
    condition: 'Plateau Particulate Dispersion'
  },
  hyderabad: {
    city: 'Hyderabad, Telangana',
    lat: 17.385,
    lon: 78.4867,
    pm25: 58.0,
    pm10: 98.0,
    no2: 38,
    o3: 30,
    so2: 10,
    co: 0.9,
    temp: 25,
    humidity: 58,
    windSpeed: 3.6,
    condition: 'Urban Particulate Haze'
  },
  ahmedabad: {
    city: 'Ahmedabad, Gujarat',
    lat: 23.0225,
    lon: 72.5714,
    pm25: 92.0,
    pm10: 165.0,
    no2: 52,
    o3: 36,
    so2: 16,
    co: 1.4,
    temp: 23,
    humidity: 48,
    windSpeed: 3.1,
    condition: 'Industrial Dry Smog'
  },
  pune: {
    city: 'Pune, Maharashtra',
    lat: 18.5204,
    lon: 73.8567,
    pm25: 52.0,
    pm10: 88.0,
    no2: 34,
    o3: 28,
    so2: 9,
    co: 0.7,
    temp: 22,
    humidity: 55,
    windSpeed: 3.4,
    condition: 'Valley Evening Stagnation'
  }
});

export function getDeterministicMockCity(cityName, lat = 22.5726, lon = 88.3639) {
  const norm = (cityName || '').toLowerCase().trim();
  for (const [key, data] of Object.entries(INDIAN_CITY_SIMULATION_DB)) {
    if (norm.includes(key) || key.includes(norm)) {
      const naqiRes = calculateCPCBNAQI(data.pm25, data.pm10);
      return {
        ...data,
        city: data.city,
        lat: data.lat,
        lon: data.lon,
        aqi: naqiRes.aqi,
        dominant: naqiRes.dominant
      };
    }
  }

  const seed = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233)) * 1000;
  const pm25 = Math.round((25 + (seed % 110)) * 10) / 10;
  const pm10 = Math.round((pm25 * 1.55 + (seed % 35)) * 10) / 10;
  const naqiRes = calculateCPCBNAQI(pm25, pm10);
  const temp = Math.round(18 + (seed % 14));
  const humidity = Math.round(40 + (seed % 42));
  const windSpeed = Math.round((2.0 + (seed % 7)) * 10) / 10;

  return {
    city: cityName || 'Kolkata, West Bengal',
    lat,
    lon,
    pm25,
    pm10,
    no2: Math.round(pm25 * 0.42),
    o3: Math.round(pm25 * 0.32),
    so2: Math.round(pm25 * 0.12),
    co: Math.round(pm25 * 0.015 * 10) / 10,
    temp,
    humidity,
    windSpeed,
    condition: 'Atmospheric Inversion Dispersion',
    aqi: naqiRes.aqi,
    dominant: naqiRes.dominant
  };
}

export function generateHourlyForecast(baseAqi) {
  const hours = [];
  const currentHour = new Date().getHours();

  for (let i = 0; i < 24; i++) {
    const hour = (currentHour + i) % 24;
    let factor = 1.0;
    if (hour >= 6 && hour <= 9) factor = 1.3;
    else if (hour >= 10 && hour <= 12) factor = 1.02;
    else if (hour >= 13 && hour <= 16) factor = 0.72;
    else if (hour >= 17 && hour <= 21) factor = 1.25;
    else factor = 1.12;

    const hourlyAqi = Math.max(25, Math.min(500, Math.round(baseAqi * factor)));
    const isBestWindow = hour >= 13 && hour <= 16;
    const isPeakWindow = (hour >= 7 && hour <= 9) || (hour >= 18 && hour <= 21);

    hours.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      hour,
      aqi: hourlyAqi,
      isBestWindow,
      isPeakWindow,
      recommendation: isBestWindow
        ? 'Safest window for errands or outdoor exercise'
        : isPeakWindow
          ? 'Peak smog inversion: keep doors and windows sealed'
          : 'Moderate ambient concentration'
    });
  }
  return hours;
}
