// tests/aqi-locality-cache.test.js
/**
 * @fileoverview Regression tests for coordinate-specific AQI fetching,
 * backend cache isolation, canonical place formatting, locality proof, and race condition prevention.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  getAqiCacheKey,
  aqiCache,
  onRequestGet,
  resolveCityCoordinates
} from '../functions/api/aqi.js';
import { fetchAQIData } from '../src/services/api.js';
import AQICard from '../src/components/AQICard.jsx';
import SearchAQIPage from '../src/pages/SearchAQIPage.jsx';

describe('tests/aqi-locality-cache.test.js - Coordinate Locality & Cache Isolation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    aqiCache.clear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    aqiCache.clear();
  });

  describe('1. Cache Key Coordinate Isolation', () => {
    it('produces distinct cache keys incorporating lat/lon rounded to 2 decimals plus data type', () => {
      const delhiKey = getAqiCacheKey(28.6139, 77.209, 'aqi');
      const chennaiKey = getAqiCacheKey(13.0827, 80.2707, 'aqi');
      const varanasiKey = getAqiCacheKey(25.3176, 82.9739, 'aqi');

      expect(delhiKey).toBe('aqi_28.61_77.21');
      expect(chennaiKey).toBe('aqi_13.08_80.27');
      expect(varanasiKey).toBe('aqi_25.32_82.97');

      // They must be strictly distinct
      expect(delhiKey).not.toBe(chennaiKey);
      expect(delhiKey).not.toBe(varanasiKey);
      expect(chennaiKey).not.toBe(varanasiKey);
    });

    it('outbound client fetchAQIData produces distinct URLs with coordinates for Delhi and Chennai', async () => {
      const fetchCalls = [];
      vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
        fetchCalls.push(url);
        if (url.includes('28.61')) {
          return {
            ok: true,
            json: async () => ({
              city: 'Delhi, India',
              aqi: 240,
              gridPoint: { lat: 28.61, lon: 77.21 },
              weather: { temp: 23, humidity: 55, windSpeed: 3.5 }
            })
          };
        }
        return {
          ok: true,
          json: async () => ({
            city: 'Chennai, Tamil Nadu, India',
            aqi: 65,
            gridPoint: { lat: 13.08, lon: 80.27 },
            weather: { temp: 31, humidity: 75, windSpeed: 10.2 }
          })
        };
      });

      const delhiData = await fetchAQIData({ lat: 28.61, lon: 77.21, cityName: 'Delhi' });
      const chennaiData = await fetchAQIData({ lat: 13.08, lon: 80.27, cityName: 'Chennai' });

      expect(fetchCalls.length).toBe(2);
      expect(fetchCalls[0]).toContain('lat=28.61');
      expect(fetchCalls[0]).toContain('lon=77.21');
      expect(fetchCalls[1]).toContain('lat=13.08');
      expect(fetchCalls[1]).toContain('lon=80.27');

      expect(delhiData.aqi).toBe(240);
      expect(chennaiData.aqi).toBe(65);
      expect(delhiData.weather.temp).toBe(23);
      expect(chennaiData.weather.temp).toBe(31);
    });
  });

  describe('2. Backend Cache Isolation', () => {
    it('calling API for location A then location B returns B data, not cached A', async () => {
      // Mock fetch in onRequestGet for Open-Meteo Air Quality & Weather
      vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
        const urlStr = String(url);
        if (urlStr.includes('latitude=28.61')) {
          if (urlStr.includes('air-quality')) {
            return {
              ok: true,
              json: async () => ({
                latitude: 28.6,
                longitude: 77.2,
                current: { time: '2026-11-21T14:30', pm2_5: 68.7, pm10: 73.3 },
                hourly: {
                  time: Array.from({ length: 48 }, (_, i) => `2026-11-21T${String(i % 24).padStart(2, '0')}:00`),
                  pm2_5: Array(48).fill(68.7),
                  pm10: Array(48).fill(73.3)
                }
              })
            };
          }
          return {
            ok: true,
            json: async () => ({
              current: { temperature_2m: 23.9, relative_humidity_2m: 53, wind_speed_10m: 3.5 }
            })
          };
        }

        if (urlStr.includes('latitude=13.08')) {
          if (urlStr.includes('air-quality')) {
            return {
              ok: true,
              json: async () => ({
                latitude: 13.1,
                longitude: 80.3,
                current: { time: '2026-11-21T14:30', pm2_5: 22.5, pm10: 35.0 },
                hourly: {
                  time: Array.from({ length: 48 }, (_, i) => `2026-11-21T${String(i % 24).padStart(2, '0')}:00`),
                  pm2_5: Array(48).fill(22.5),
                  pm10: Array(48).fill(35.0)
                }
              })
            };
          }
          return {
            ok: true,
            json: async () => ({
              current: { temperature_2m: 31.0, relative_humidity_2m: 78, wind_speed_10m: 11.5 }
            })
          };
        }

        return { ok: false, status: 404 };
      });

      // 1. Request for Location A (Delhi)
      const reqA = new Request('https://foggy.pages.dev/api/aqi?city=Delhi&lat=28.61&lon=77.21');
      const resA = await onRequestGet({ request: reqA });
      expect(resA.status).toBe(200);
      const jsonA = await resA.json();

      expect(jsonA.gridPoint.lat).toBe(28.6);
      expect(jsonA.weather.temp).toBe(23.9);
      expect(resA.headers.get('X-Cache')).toBe('MISS');
      expect(resA.headers.get('X-Cache-Key')).toBe('aqi_28.61_77.21');

      // 2. Request for Location B (Chennai) - MUST NOT return cached Delhi data!
      const reqB = new Request('https://foggy.pages.dev/api/aqi?city=Chennai&lat=13.08&lon=80.27');
      const resB = await onRequestGet({ request: reqB });
      expect(resB.status).toBe(200);
      const jsonB = await resB.json();

      expect(jsonB.gridPoint.lat).toBe(13.1);
      expect(jsonB.weather.temp).toBe(31.0);
      expect(jsonB.pollutants.pm25).toBe(22.5);
      expect(jsonB.aqi).not.toBe(jsonA.aqi);
      expect(resB.headers.get('X-Cache')).toBe('MISS');
      expect(resB.headers.get('X-Cache-Key')).toBe('aqi_13.08_80.27');

      // 3. Repeat Request for Location A (Delhi) - Should hit cache
      const reqA2 = new Request('https://foggy.pages.dev/api/aqi?city=Delhi&lat=28.61&lon=77.21');
      const resA2 = await onRequestGet({ request: reqA2 });
      expect(resA2.status).toBe(200);
      expect(resA2.headers.get('X-Cache')).toBe('HIT');
      expect(resA2.headers.get('X-Cache-Key')).toBe('aqi_28.61_77.21');
      const jsonA2 = await resA2.json();
      expect(jsonA2.gridPoint.lat).toBe(28.6);
      expect(jsonA2.weather.temp).toBe(23.9);
    });

    it('resolves Varanasi and Patna accurately without hardcoding to Kolkata', () => {
      const varanasi = resolveCityCoordinates('Varanasi', NaN, NaN);
      expect(varanasi.lat).toBeCloseTo(25.32, 1);
      expect(varanasi.lon).toBeCloseTo(82.97, 1);
      expect(varanasi.displayCity).toContain('Varanasi');

      const patna = resolveCityCoordinates('Patna', NaN, NaN);
      expect(patna.lat).toBeCloseTo(25.59, 1);
      expect(patna.lon).toBeCloseTo(85.14, 1);
      expect(patna.displayCity).toContain('Patna');
    });
  });

  describe('3. UI Proof of Locality in AQICard', () => {
    it('renders model grid point coordinates and data timestamp on AQICard', () => {
      const sampleAQI = {
        city: 'Varanasi, Uttar Pradesh, India',
        aqi: 72,
        category: 'Satisfactory',
        color: '#16A34A',
        badgeClass: 'bg-green-100 text-green-950',
        dominantPollutant: 'PM2.5',
        gridPoint: { lat: 25.32, lon: 82.97 },
        updatedAt: '02:30 PM',
        weather: { temp: 25.3, humidity: 67, windSpeed: 11.5 }
      };

      render(<AQICard aqiData={sampleAQI} loading={false} showSearch={false} />);

      expect(screen.getByText(/grid point 25\.32N, 82\.97E/i)).toBeInTheDocument();
      expect(screen.getByText(/updated 02:30 PM/i)).toBeInTheDocument();
      expect(screen.getByText('25.3°C')).toBeInTheDocument();
      expect(screen.getByText('67% Hum')).toBeInTheDocument();
      expect(screen.getByText('11.5 km/h')).toBeInTheDocument();
    });
  });

  describe('4. Canonical Geocoded Place Title & Race Condition Prevention in SearchAQIPage', () => {
    it('displays canonical geocoded title with coordinates and never raw typed text', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
        const urlStr = String(url);
        if (urlStr.includes('/api/geocode')) {
          return {
            ok: true,
            json: async () => ({
              results: [
                {
                  id: 1253405,
                  name: 'Varanasi',
                  admin1: 'Uttar Pradesh',
                  country: 'India',
                  latitude: 25.3176,
                  longitude: 82.9739
                }
              ]
            })
          };
        }
        if (urlStr.includes('/api/aqi')) {
          return {
            ok: true,
            json: async () => ({
              city: 'Varanasi, Uttar Pradesh, India',
              aqi: 58,
              category: 'Satisfactory',
              dominantPollutant: 'PM2.5',
              gridPoint: { lat: 25.32, lon: 82.97 },
              updatedAt: '02:30 PM',
              weather: { temp: 25.3, humidity: 67, windSpeed: 11.5 }
            })
          };
        }
        return { ok: false };
      });

      render(<SearchAQIPage />);

      const input = screen.getByPlaceholderText(/Search any Indian city/i);
      // Type lowercase raw input
      fireEvent.change(input, { target: { value: 'varanasi, India' } });

      const searchBtn = screen.getByRole('button', { name: /^search$/i });
      fireEvent.click(searchBtn);

      await waitFor(() => {
        // Must show canonical geocoded place name "Varanasi, Uttar Pradesh, India (25.32°N, 82.97°E)"
        // and NOT raw unselected input "varanasi, India"
        const elements = screen.getAllByText(/Varanasi, Uttar Pradesh, India \(25.32°N, 82.97°E\)/i);
        expect(elements.length).toBeGreaterThan(0);
        expect(elements[0]).toBeInTheDocument();
      });
    });

    it('rejects stale out-of-order responses when switching cities quickly', async () => {
      let resolveFirstCall;
      const firstCallPromise = new Promise((resolve) => {
        resolveFirstCall = resolve;
      });

      vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
        const urlStr = String(url);
        if (urlStr.includes('/api/geocode')) {
          if (urlStr.toLowerCase().includes('patna')) {
            return {
              ok: true,
              json: async () => ({
                results: [
                  { id: 1260086, name: 'Patna', admin1: 'Bihar', country: 'India', latitude: 25.5941, longitude: 85.1376 }
                ]
              })
            };
          }
          return {
            ok: true,
            json: async () => ({
              results: [
                { id: 1253405, name: 'Varanasi', admin1: 'Uttar Pradesh', country: 'India', latitude: 25.3176, longitude: 82.9739 }
              ]
            })
          };
        }

        if (urlStr.includes('/api/aqi')) {
          if (urlStr.includes('82.97')) {
            // Varanasi request: artificially delayed
            await firstCallPromise;
            return {
              ok: true,
              json: async () => ({
                city: 'Varanasi, Uttar Pradesh, India',
                aqi: 58,
                category: 'Satisfactory',
                dominantPollutant: 'PM2.5',
                gridPoint: { lat: 25.32, lon: 82.97 },
                updatedAt: '02:30 PM',
                weather: { temp: 25.3, humidity: 67, windSpeed: 11.5 }
              })
            };
          }

          if (urlStr.includes('85.14') || urlStr.includes('85.1376')) {
            // Patna request: resolves fast
            return {
              ok: true,
              json: async () => ({
                city: 'Patna, Bihar, India',
                aqi: 45,
                category: 'Good',
                dominantPollutant: 'PM2.5',
                gridPoint: { lat: 25.59, lon: 85.14 },
                updatedAt: '02:30 PM',
                weather: { temp: 25.5, humidity: 66, windSpeed: 8.3 }
              })
            };
          }
        }
        return { ok: false };
      });

      render(<SearchAQIPage />);

      const input = screen.getByPlaceholderText(/Search any Indian city/i);
      const searchBtn = screen.getByRole('button', { name: /^search$/i });

      // First query: Varanasi (delayed)
      fireEvent.change(input, { target: { value: 'Varanasi' } });
      fireEvent.click(searchBtn);

      // Quickly query: Patna (fast)
      fireEvent.change(input, { target: { value: 'Patna' } });
      fireEvent.click(searchBtn);

      // Fast response for Patna finishes first
      await waitFor(() => {
        const matches = screen.getAllByText(/Patna, Bihar, India/i);
        expect(matches.length).toBeGreaterThan(0);
        expect(matches[0]).toBeInTheDocument();
      });

      // Now resolve the late Varanasi response
      resolveFirstCall();

      // Ensure Patna data remains and is not overwritten by late Varanasi response
      await new Promise((r) => setTimeout(r, 50));
      const finalPatnaMatches = screen.getAllByText(/Patna, Bihar, India/i);
      expect(finalPatnaMatches.length).toBeGreaterThan(0);
      expect(screen.queryByText(/Varanasi, Uttar Pradesh, India/i)).not.toBeInTheDocument();
    });
  });
});
