// tests/geocode.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { statesMatch, normalizeStateName, resolveCityAlias } from '../shared/geocode.js';
import { onRequest } from '../functions/api/geocode.js';

describe('tests/geocode.test.js - Location Matching, Aliases, State Validation & Geocode API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Indian State Name Aliases & Normalization', () => {
    it('normalizes Odisha and Orissa to odisha', () => {
      expect(normalizeStateName('Orissa')).toBe('odisha');
      expect(normalizeStateName('Odisha')).toBe('odisha');
      expect(statesMatch('Orissa', 'Odisha')).toBe(true);
      expect(statesMatch('Odisha', 'Orissa')).toBe(true);
    });

    it('normalizes Pondicherry and Puducherry', () => {
      expect(normalizeStateName('Pondicherry')).toBe('puducherry');
      expect(normalizeStateName('Puducherry')).toBe('puducherry');
      expect(statesMatch('Pondicherry', 'Puducherry')).toBe(true);
    });

    it('matches Delhi, New Delhi, and NCT of Delhi', () => {
      expect(normalizeStateName('New Delhi')).toBe('delhi');
      expect(normalizeStateName('NCT of Delhi')).toBe('delhi');
      expect(normalizeStateName('National Capital Territory of Delhi')).toBe('delhi');
      expect(statesMatch('New Delhi', 'Delhi')).toBe(true);
      expect(statesMatch('NCT of Delhi', 'Delhi')).toBe(true);
    });

    it('matches short acronyms like WB, UP, TN, MH, KA', () => {
      expect(statesMatch('WB', 'West Bengal')).toBe(true);
      expect(statesMatch('UP', 'Uttar Pradesh')).toBe(true);
      expect(statesMatch('TN', 'Tamil Nadu')).toBe(true);
      expect(statesMatch('MH', 'Maharashtra')).toBe(true);
      expect(statesMatch('KA', 'Karnataka')).toBe(true);
    });

    it('correctly rejects mismatched states', () => {
      expect(statesMatch('Maharashtra', 'Tamil Nadu')).toBe(false);
      expect(statesMatch('West Bengal', 'Karnataka')).toBe(false);
      expect(statesMatch('Delhi', 'Punjab')).toBe(false);
    });

    it('handles empty, null, or undefined gracefully', () => {
      expect(statesMatch(null, 'Delhi')).toBe(false);
      expect(statesMatch('Delhi', undefined)).toBe(false);
      expect(statesMatch('', '')).toBe(false);
    });
  });

  describe('City Aliases Resolution', () => {
    it('resolves Bengaluru and Bangalore', () => {
      expect(resolveCityAlias('Bangalore')).toBe('Bengaluru');
      expect(resolveCityAlias('Bengaluru')).toBe('Bengaluru');
    });

    it('resolves Delhi, New Delhi, and Dilli', () => {
      expect(resolveCityAlias('New Delhi')).toBe('Delhi');
      expect(resolveCityAlias('Dilli')).toBe('Delhi');
      expect(resolveCityAlias('NCR')).toBe('Delhi');
    });

    it('resolves Calcutta to Kolkata and Bombay to Mumbai', () => {
      expect(resolveCityAlias('Calcutta')).toBe('Kolkata');
      expect(resolveCityAlias('Bombay')).toBe('Mumbai');
    });
  });

  describe('Geocode Endpoint & Mismatched / Not-Found Handling', () => {
    it('returns geocoded coordinates when upstream API succeeds', async () => {
      const mockApiResponse = {
        results: [
          {
            id: 1273294,
            name: 'Delhi',
            latitude: 28.6139,
            longitude: 77.209,
            country: 'India',
            country_code: 'IN',
            admin1: 'Delhi'
          }
        ]
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      });

      const req = new Request('https://foggy.pages.dev/api/geocode?q=Delhi', {
        headers: { 'cf-connecting-ip': '10.0.0.1' }
      });

      const res = await onRequest({ request: req });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.results).toBeDefined();
      expect(data.results[0].name).toBe('Delhi');
      expect(data.results[0].latitude).toBeCloseTo(28.61, 1);
    });

    it('falls back to local Indian cities database when upstream Open-Meteo returns empty (not found)', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] })
      });

      const req = new Request('https://foggy.pages.dev/api/geocode?q=Kolkata', {
        headers: { 'cf-connecting-ip': '10.0.0.2' }
      });

      const res = await onRequest({ request: req });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.results.length).toBeGreaterThan(0);
      expect(data.results[0].name).toBe('Kolkata');
    });

    it('handles upstream fetch failure with resilient offline Indian city dataset', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network offline'));

      const req = new Request('https://foggy.pages.dev/api/geocode?q=Mumbai', {
        headers: { 'cf-connecting-ip': '10.0.0.3' }
      });

      const res = await onRequest({ request: req });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.results.length).toBeGreaterThan(0);
      expect(data.results[0].name).toBe('Mumbai');
    });

    it('returns empty array when unknown location has no matches anywhere', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      const req = new Request(
        'https://foggy.pages.dev/api/geocode?q=ZzZzZzZzZNonExistentPlace999',
        {
          headers: { 'cf-connecting-ip': '10.0.0.4' }
        }
      );

      const res = await onRequest({ request: req });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.results).toEqual([]);
    });
  });
});
