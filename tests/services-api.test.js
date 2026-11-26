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
  DEFAULT_CITY,
  clearClientAqiCache,
  clearClientLastGoodLiveCache
} from '../src/services/api.js';
import { requestJson } from '../src/services/httpClient.js';
import { requestPersonalizeMemo } from '../src/services/profileApi.js';
import { auth } from '../src/firebase.js';

describe('tests/services-api.test.js - Client API Services & Offline Fallbacks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearClientAqiCache();
    clearClientLastGoodLiveCache();
    localStorage.clear();
    auth.currentUser = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearClientAqiCache();
    clearClientLastGoodLiveCache();
    auth.currentUser = null;
  });

  describe('Local Storage City Persistence', () => {
    it('returns DEFAULT_CITY (Kolkata) when localStorage is empty', () => {
      const city = getStoredCity();
      expect(city.name).toBe(DEFAULT_CITY.name);
      expect(city.lat).toBe(DEFAULT_CITY.lat);
    });

    it('returns DEFAULT_CITY when localStorage contains corrupted or incomplete JSON', () => {
      localStorage.setItem('foggy_selected_city', 'invalid-json{{{');
      expect(getStoredCity().name).toBe(DEFAULT_CITY.name);

      localStorage.setItem('foggy_selected_city', JSON.stringify({ name: 'Incomplete' }));
      expect(getStoredCity().name).toBe(DEFAULT_CITY.name);
    });

    it('saves and retrieves selected city from localStorage', () => {
      const customCity = { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, admin1: 'Karnataka' };
      setStoredCity(customCity);
      const retrieved = getStoredCity();
      expect(retrieved.name).toBe('Bengaluru');
      expect(retrieved.lat).toBe(12.9716);
    });

    it('ignores invalid city object in setStoredCity', () => {
      setStoredCity(null);
      expect(getStoredCity().name).toBe(DEFAULT_CITY.name);
      setStoredCity({ noName: true });
      expect(getStoredCity().name).toBe(DEFAULT_CITY.name);
    });
  });

  describe('fetchAQIData', () => {
    it('fetches live AQI data successfully from /api/aqi using object parameters', async () => {
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

      const data = await fetchAQIData({
        cityName: 'Delhi',
        stateName: 'Delhi',
        lat: 28.61,
        lon: 77.2
      });
      expect(data.aqi).toBe(240);
      expect(data.category).toBe('Poor');
    });

    it('fetches live AQI data using legacy string and coordinate arguments', async () => {
      const mockResult = {
        city: 'Mumbai',
        aqi: 120,
        category: 'Moderate',
        dominantPollutant: 'PM10'
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult
      });

      const data = await fetchAQIData('Mumbai', 19.07, 72.87);
      expect(data.aqi).toBe(120);
    });

    it('rethrows AbortError when request is cancelled by caller', async () => {
      const abortError = new Error('The user aborted a request.');
      abortError.name = 'AbortError';

      vi.spyOn(global, 'fetch').mockRejectedValueOnce(abortError);

      const controller = new AbortController();
      controller.abort();

      await expect(
        fetchAQIData({ cityName: 'Kolkata', signal: controller.signal })
      ).rejects.toThrow('The user aborted a request.');
    });

    it('falls back to safe mock payload when network request fails', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network offline'));

      const data = await fetchAQIData('Kolkata');
      expect(data).toBeDefined();
      expect(data.isMock).toBe(true);
      expect(data.scale).toContain('CPCB National AQI');
      expect(data.city).toContain('Kolkata');
      expect(data.pollutants.pm25).toBeGreaterThan(0);
      expect(data.weather.temp).toBeGreaterThan(0);
    });

    it('falls back to safe mock payload when server responds with 500 error', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const data = await fetchAQIData({ cityName: 'Chennai', lat: 13.08, lon: 80.27 });
      expect(data.isMock).toBe(true);
      expect(data.city).toBe('Chennai');
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

    it('attaches Authorization header when user is authenticated with Firebase', async () => {
      const mockUser = {
        getIdToken: vi.fn().mockResolvedValue('mock-token-xyz-123')
      };
      auth.currentUser = mockUser;

      let capturedHeaders = null;
      vi.spyOn(global, 'fetch').mockImplementationOnce(async (_url, opts) => {
        capturedHeaders = opts.headers;
        return {
          ok: true,
          json: async () => ({ reply: 'Authenticated reply' })
        };
      });

      await sendChatMessage({ message: 'Hello', history: [], user: mockUser });
      const authHeader = new Headers(capturedHeaders).get('authorization');
      expect(authHeader).toBe('Bearer mock-token-xyz-123');
      auth.currentUser = null;
    });

    it('attaches Authorization header from auth.currentUser fallback when user param is omitted', async () => {
      auth.currentUser = {
        getIdToken: vi.fn().mockResolvedValue('mock-token-fallback-456')
      };

      let capturedHeaders = null;
      vi.spyOn(global, 'fetch').mockImplementationOnce(async (_url, opts) => {
        capturedHeaders = opts.headers;
        return {
          ok: true,
          json: async () => ({ reply: 'Authenticated reply' })
        };
      });

      await sendChatMessage({ message: 'Hello', history: [] });
      const authHeader = new Headers(capturedHeaders).get('authorization');
      expect(authHeader).toBe('Bearer mock-token-fallback-456');
      auth.currentUser = null;
    });

    it('handles rate-limited (429) backend responses with helpful guidance', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Rate limit of 10 messages/hour reached.' })
      });

      const res = await sendChatMessage({ message: 'Is it safe?', history: [] });
      expect(res.reply).toContain('Rate Limit Notice');
      expect(res.provider).toBe('System Rate Limiter');
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

    it('omits greeting in fallback if this is not the first user message', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Down'));

      const res = await sendChatMessage({
        message: 'Follow up question',
        history: [
          { role: 'user', text: 'Hi' },
          { role: 'assistant', text: 'Hello' },
          { role: 'user', text: 'Follow up' }
        ]
      });

      expect(res.reply).not.toContain("I'm **Foggy**, your air quality guide");
    });
  });

  describe('searchCities & geocodeLocation', () => {
    it('returns empty array when query is less than 2 characters', async () => {
      expect(await searchCities('a')).toEqual([]);
      expect(await searchCities('')).toEqual([]);
      expect(await geocodeLocation('x')).toEqual([]);
      expect(await geocodeLocation({ name: ' ' })).toEqual([]);
    });

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

    it('falls back to PRESET_CITY_COORDINATES when searchCities fetch fails', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Offline'));

      const results = await searchCities('Kolkata');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('Kolkata');
    });

    it('returns matching coordinates via geocodeLocation with string and object formats', async () => {
      const mockResults = [
        { id: 2, name: 'Pune', latitude: 18.52, longitude: 73.85, admin1: 'Maharashtra' }
      ];

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ results: mockResults })
      });

      const loc1 = await geocodeLocation({ name: 'Pune', countryCode: 'IN', count: 5 });
      expect(loc1[0].name).toBe('Pune');

      const loc2 = await geocodeLocation('Pune', 'IN');
      expect(loc2[0].name).toBe('Pune');
    });

    it('throws error when geocodeLocation response is not ok', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 503
      });

      await expect(geocodeLocation({ name: 'Varanasi' })).rejects.toThrow(
        'Geocoding failed with status 503'
      );
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
      expect(data.forecast7Days.length).toBe(7);
      expect(data.isSample).toBe(true);
    });
  });

  describe('Shared HTTP Client (requestJson)', () => {
    it('returns parsed json on successful request', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, count: 42 })
      });

      const res = await requestJson('/api/test');
      expect(res.ok).toBe(true);
      expect(res.status).toBe(200);
      expect(res.data).toEqual({ success: true, count: 42 });
    });

    it('returns null data when json parsing fails', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      const res = await requestJson('/api/broken');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(500);
      expect(res.data).toBeNull();
    });
  });

  describe('Profile API (requestPersonalizeMemo)', () => {
    it('sends personalization payload with Authorization token when available', async () => {
      auth.currentUser = {
        getIdToken: vi.fn().mockResolvedValue('test-token-123')
      };

      let capturedUrl = '';
      let capturedOptions = {};
      vi.spyOn(global, 'fetch').mockImplementationOnce(async (url, opts) => {
        capturedUrl = url;
        capturedOptions = opts;
        return {
          ok: true,
          json: async () => ({ reply: 'Personalized guidance', memo: 'Personalized guidance' })
        };
      });

      const res = await requestPersonalizeMemo({
        member: { name: 'Aarav' },
        prompt: 'Give advice',
        context: { aqi: 250 }
      });

      expect(capturedUrl).toBe('/api/personalize');
      expect(capturedOptions.headers['Authorization']).toBe('Bearer test-token-123');
      expect(res.reply).toBe('Personalized guidance');
    });

    it('throws error when personalize endpoint returns non-ok status', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'AI processing failed' })
      });

      await expect(
        requestPersonalizeMemo({ member: { name: 'Aarav' }, prompt: 'test' })
      ).rejects.toThrow('AI processing failed');
    });
  });
});
