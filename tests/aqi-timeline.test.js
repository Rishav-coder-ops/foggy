import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  onRequestOptions,
  onRequestGet,
  timelineCache,
  getTimelineCacheKey,
  geocodeIndianCity,
  fetchCityAqiReport,
  calculatePM25SubIndex,
  calculatePM10SubIndex
} from '../functions/api/aqi-timeline.js';
import {
  findBestAndWorstHours,
  computeDailyAverages
} from '../shared/timeline/cpcbCalculation.js';

describe('aqi-timeline.js Backend Endpoint & Domain Services', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    timelineCache.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('CORS and Preflight (onRequestOptions)', () => {
    it('returns 204 with standard CORS headers', async () => {
      const request = new Request('http://localhost/api/aqi-timeline', {
        method: 'OPTIONS',
        headers: { Origin: 'http://localhost:5173' }
      });
      const response = await onRequestOptions({ request });
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });
  });

  describe('Rate Limiting', () => {
    it('returns 429 when client exceeds rate limit', async () => {
      const ip = '192.168.1.99';
      // Rate limiter allows 60 requests per window
      for (let i = 0; i < 60; i++) {
        const req = new Request('http://localhost/api/aqi-timeline?lat=28.61&lon=77.21', {
          headers: { 'CF-Connecting-IP': ip }
        });
        // Mock fetch so valid requests don't hit real network
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            timezone: 'Asia/Kolkata',
            hourly: {
              time: Array.from({ length: 48 }, (_, i) => `2026-11-21T${String(i % 24).padStart(2, '0')}:00`),
              pm2_5: Array(48).fill(45),
              pm10: Array(48).fill(85)
            }
          })
        });
        await onRequestGet({ request: req });
      }

      // 61st request from same IP should get 429
      const blockedReq = new Request('http://localhost/api/aqi-timeline?lat=28.61&lon=77.21', {
        headers: { 'CF-Connecting-IP': ip }
      });
      const res = await onRequestGet({ request: blockedReq });
      expect(res.status).toBe(429);
      const json = await res.json();
      expect(json.error).toBe('Too many requests');
    });
  });

  describe('Geocoding Search API (?search= or ?q=)', () => {
    it('returns empty array if search query is shorter than 2 characters', async () => {
      const request = new Request('http://localhost/api/aqi-timeline?search=a');
      const res = await onRequestGet({ request });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.results).toEqual([]);
    });

    it('returns geocoding results filtered to India when Open-Meteo succeeds', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            { name: 'Kolkata', country_code: 'IN', admin1: 'West Bengal', latitude: 22.57, longitude: 88.36, population: 4500000 },
            { name: 'Kolkata Foreign', country_code: 'US', admin1: 'Other', latitude: 10, longitude: 20, population: 100 }
          ]
        })
      });

      const request = new Request('http://localhost/api/aqi-timeline?search=Kolkata');
      const res = await onRequestGet({ request });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.results).toHaveLength(1);
      expect(json.results[0].name).toBe('Kolkata');
      expect(json.results[0].country).toBe('India');
    });

    it('falls back to INDIAN_METROS when Open-Meteo returns no matching results', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] })
      });

      const request = new Request('http://localhost/api/aqi-timeline?q=delhi');
      const res = await onRequestGet({ request });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.results.length).toBeGreaterThan(0);
      expect(json.results[0].name.toLowerCase()).toContain('delhi');
    });

    it('falls back to INDIAN_METROS when Open-Meteo network request fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

      const request = new Request('http://localhost/api/aqi-timeline?search=mumbai');
      const res = await onRequestGet({ request });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.results.length).toBeGreaterThan(0);
      expect(json.results[0].name.toLowerCase()).toContain('mumbai');
    });
  });

  describe('Timeline Data Endpoint (?lat=&lon=)', () => {
    it('returns 400 for out-of-range coordinates', async () => {
      const badLat = new Request('http://localhost/api/aqi-timeline?lat=120&lon=77');
      const resLat = await onRequestGet({ request: badLat });
      expect(resLat.status).toBe(400);

      const badLon = new Request('http://localhost/api/aqi-timeline?lat=28&lon=200');
      const resLon = await onRequestGet({ request: badLon });
      expect(resLon.status).toBe(400);

      const nanReq = new Request('http://localhost/api/aqi-timeline?lat=abc&lon=def');
      const resNan = await onRequestGet({ request: nanReq });
      expect(resNan.status).toBe(400);
    });

    it('fetches live timeline data, caches it, and isolates distinct coordinates', async () => {
      const mockTimes = Array.from({ length: 48 }, (_, i) => `2026-11-21T${String(i % 24).padStart(2, '0')}:00`);
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          timezone: 'Asia/Kolkata',
          hourly: {
            time: mockTimes,
            pm2_5: Array(48).fill(30),
            pm10: Array(48).fill(60)
          }
        })
      });

      // First request: MISS
      const req1 = new Request('http://localhost/api/aqi-timeline?lat=28.61&lon=77.21&city=Delhi');
      const res1 = await onRequestGet({ request: req1 });
      expect(res1.status).toBe(200);
      expect(res1.headers.get('X-Cache')).toBe('MISS');
      const json1 = await res1.json();
      expect(json1.isSample).toBe(false);
      expect(json1.currentAqi).toBeGreaterThan(0);

      // Second request same coord: HIT
      const req2 = new Request('http://localhost/api/aqi-timeline?lat=28.61&lon=77.21&city=Delhi');
      const res2 = await onRequestGet({ request: req2 });
      expect(res2.status).toBe(200);
      expect(res2.headers.get('X-Cache')).toBe('HIT');

      // Request different coordinates: MISS
      const req3 = new Request('http://localhost/api/aqi-timeline?lat=19.07&lon=72.87&city=Mumbai');
      const res3 = await onRequestGet({ request: req3 });
      expect(res3.status).toBe(200);
      expect(res3.headers.get('X-Cache')).toBe('MISS');
      expect(res3.headers.get('X-Cache-Key')).toBe('timeline_19.07_72.87');
    });

    it('falls back to deterministic sample data when upstream atmospheric API fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Open-Meteo down'));

      const req = new Request('http://localhost/api/aqi-timeline?lat=25.31&lon=82.97&city=Varanasi');
      const res = await onRequestGet({ request: req });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.isSample).toBe(true);
      expect(json.simulationReason).toBeDefined();
      expect(json.location.city).toBe('Varanasi');
      // Sample data should NOT be cached
      expect(timelineCache.has('timeline_25.31_82.97')).toBe(false);
    });
  });

  describe('Domain Services & Helpers', () => {
    it('getTimelineCacheKey formats coordinates to 2 decimal places', () => {
      expect(getTimelineCacheKey(28.61234, 77.20987)).toBe('timeline_28.61_77.21');
      expect(getTimelineCacheKey(13.0, 80.0)).toBe('timeline_13.00_80.00');
    });

    it('geocodeIndianCity resolves canonical names, fallback cities, and metros', async () => {
      // Alias resolution
      const delhi = await geocodeIndianCity('delhi');
      expect(delhi).toBeDefined();
      expect(delhi.name).toBe('Delhi');

      // Bangalore / Bengaluru
      const blr = await geocodeIndianCity('bangalore');
      expect(blr).toBeDefined();
      expect(blr.latitude).toBeCloseTo(12.97, 1);

      // Null on invalid input
      const invalid = await geocodeIndianCity(null);
      expect(invalid).toBeNull();
    });

    it('fetchCityAqiReport returns structured report for a city name or coordinates object', async () => {
      const mockTimes = Array.from({ length: 48 }, (_, i) => `2026-11-21T${String(i % 24).padStart(2, '0')}:00`);
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          timezone: 'Asia/Kolkata',
          hourly: {
            time: mockTimes,
            pm2_5: Array(48).fill(25),
            pm10: Array(48).fill(55)
          }
        })
      });

      const report = await fetchCityAqiReport('Kolkata');
      expect(report.found).toBe(true);
      expect(report.city).toBe('Kolkata');
      expect(report.current.aqi).toBeDefined();
      expect(report.averageAqi24h).toBeDefined();
      expect(report.bestHour24h).toBeDefined();
    });

    it('fetchCityAqiReport handles unknown city gracefully', async () => {
      const report = await fetchCityAqiReport({ notFound: true });
      expect(report.found).toBe(false);
    });

    it('sub-index calculation functions work correctly', () => {
      expect(calculatePM25SubIndex(15)).toBe(25);
      expect(calculatePM10SubIndex(25)).toBe(25);
    });

    it('findBestAndWorstHours handles empty array and identifies extremes', () => {
      expect(findBestAndWorstHours([])).toEqual({ best: null, worst: null });
      const points = [
        { hour: '08:00', aqi: 240 },
        { hour: '14:00', aqi: 110 },
        { hour: '20:00', aqi: 190 }
      ];
      const { best, worst } = findBestAndWorstHours(points);
      expect(best.hour).toBe('14:00');
      expect(worst.hour).toBe('08:00');
    });

    it('computeDailyAverages groups points by date and returns daily averages', () => {
      expect(computeDailyAverages([])).toEqual([]);
      const points = [
        { date: '2026-11-21', aqi: 100 },
        { date: '2026-11-21', aqi: 150 },
        { date: '2026-11-22', aqi: 200 }
      ];
      const daily = computeDailyAverages(points);
      expect(daily).toHaveLength(2);
      expect(daily[0].date).toBe('2026-11-21');
      expect(daily[0].aqi).toBe(125);
      expect(daily[0].category).toBe('Moderate');
      expect(daily[1].date).toBe('2026-11-22');
      expect(daily[1].aqi).toBe(200);
    });
  });
});
