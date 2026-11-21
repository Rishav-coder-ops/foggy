// tests/services-api.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getStoredCity,
  setStoredCity,
  fetchAQIData,
  sendChatMessage,
  searchCities,
  geocodeLocation,
  fetchAQITimeline,
  DEFAULT_CITY
} from '../src/services/api.js';

describe('tests/services-api.test.js - Client API Services & Offline Fallbacks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Local Storage City Persistence', () => {
    it('returns DEFAULT_CITY (Kolkata) when localStorage is empty', () => {
      const city = getStoredCity();
      expect(city.name).toBe(DEFAULT_CITY.name);
      expect(city.lat).toBe(DEFAULT_CITY.lat);
    });

    it('saves and retrieves selected city from localStorage', () => {
      const customCity = { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, admin1: 'Karnataka' };
      setStoredCity(customCity);
      const retrieved = getStoredCity();
      expect(retrieved.name).toBe('Bengaluru');
      expect(retrieved.lat).toBe(12.9716);
    });
  });

  describe('fetchAQIData', () => {
    it('fetches live AQI data successfully from /api/aqi', async () => {
      const mockResult = {
        city: 'Delhi, India',
        aqi: 240,
        category: 'Poor',
        dominantPollutant: 'PM2.5'
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult
      });

      const data = await fetchAQIData('Delhi', 28.61, 77.2);
      expect(data.aqi).toBe(240);
      expect(data.category).toBe('Poor');
    });

    it('falls back to safe mock payload when network request fails', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network offline'));

      const data = await fetchAQIData('Kolkata');
      expect(data).toBeDefined();
      expect(data.isMock).toBe(true);
      expect(data.scale).toContain('CPCB National AQI');
      expect(data.city).toContain('Kolkata');
    });
  });

  describe('sendChatMessage', () => {
    it('posts chat payload and returns assistant reply', async () => {
      const mockChatReply = {
        reply: 'The cleanest window today is between 1 PM and 3 PM.',
        city: 'Kolkata',
        isLive: true
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockChatReply
      });

      const res = await sendChatMessage({
        message: 'When is it safe to venture out?',
        history: []
      });

      expect(res.reply).toContain('cleanest window');
    });

    it('returns smart client fallback when backend chat API fails', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Service Unavailable'));

      const res = await sendChatMessage({
        message: 'How do I clean my indoor air on a budget?',
        history: []
      });

      expect(res).toBeDefined();
      expect(res.reply).toContain('Safeguards');
      expect(res.isLive).toBe(false);
    });
  });

  describe('searchCities & geocodeLocation', () => {
    it('returns search results from geocode endpoint', async () => {
      const mockResults = [
        { id: 1, name: 'Mumbai', latitude: 19.07, longitude: 72.87, admin1: 'Maharashtra' }
      ];

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: mockResults })
      });

      const results = await searchCities('Mumbai');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Mumbai');
    });

    it('returns best matching city coordinates via geocodeLocation', async () => {
      const mockResults = [
        { id: 2, name: 'Pune', latitude: 18.52, longitude: 73.85, admin1: 'Maharashtra' }
      ];

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: mockResults })
      });

      const loc = await geocodeLocation({ name: 'Pune' });
      expect(loc).toBeDefined();
      expect(loc[0].name).toBe('Pune');
      expect(loc[0].latitude).toBe(18.52);
    });
  });

  describe('fetchAQITimeline', () => {
    it('returns timeline projections for the requested city', async () => {
      const mockTimeline = {
        city: 'Delhi',
        last24Hours: [{ hour: '12:00', aqi: 180 }],
        daily7d: []
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockTimeline
      });

      const data = await fetchAQITimeline({ city: 'Delhi', lat: 28.61, lon: 77.2 });
      expect(data.city).toBe('Delhi');
      expect(data.last24Hours).toHaveLength(1);
    });

    it('falls back safely when timeline fetch fails', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Fetch failed'));

      const data = await fetchAQITimeline({ city: 'Kolkata' });
      expect(data).toBeDefined();
      expect(data.last24Hours.length).toBe(24);
    });
  });
});
