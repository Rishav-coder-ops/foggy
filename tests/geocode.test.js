// tests/geocode.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  statesMatch,
  normalizeStateName,
  normalizeLocationQuery,
  resolveCityAlias,
  extractCityAndState,
  isValidCityStatePair,
  rankAndDeduplicateLocations,
  normalizeCountryCode
} from '../shared/geocode.js';
import { onRequest, clearGeocodeCache } from '../functions/api/geocode.js';

describe('tests/geocode.test.js - Comprehensive Indian Location Matching, Aliases, State Validation & Geocode API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearGeocodeCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Indian State Name Aliases & Normalization', () => {
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

    it('normalizes Uttaranchal and Uttarakhand', () => {
      expect(normalizeStateName('Uttaranchal')).toBe('uttarakhand');
      expect(normalizeStateName('Uttarakhand')).toBe('uttarakhand');
      expect(statesMatch('Uttaranchal', 'Uttarakhand')).toBe(true);
    });

    it('normalizes Jammu & Kashmir variations and acronyms', () => {
      expect(normalizeStateName('Jammu & Kashmir')).toBe('jammu and kashmir');
      expect(normalizeStateName('J&K')).toBe('jammu and kashmir');
      expect(normalizeStateName('JK')).toBe('jammu and kashmir');
      expect(statesMatch('J&K', 'Jammu and Kashmir')).toBe(true);
    });

    it('normalizes Andaman & Nicobar Islands', () => {
      expect(normalizeStateName('Andaman & Nicobar')).toBe('andaman and nicobar islands');
      expect(normalizeStateName('A&N')).toBe('andaman and nicobar islands');
      expect(statesMatch('A&N', 'Andaman and Nicobar Islands')).toBe(true);
    });

    it('normalizes Telangana and Telengana', () => {
      expect(normalizeStateName('Telengana')).toBe('telangana');
      expect(normalizeStateName('Telangana')).toBe('telangana');
      expect(statesMatch('Telengana', 'Telangana')).toBe(true);
    });

    it('normalizes Chhattisgarh and Chattisgarh', () => {
      expect(normalizeStateName('Chattisgarh')).toBe('chhattisgarh');
      expect(normalizeStateName('Chhattisgarh')).toBe('chhattisgarh');
      expect(statesMatch('Chattisgarh', 'Chhattisgarh')).toBe(true);
    });

    it('normalizes Daman and Diu and Dadra & Nagar Haveli', () => {
      expect(normalizeStateName('Daman and Diu')).toBe('dadra and nagar haveli and daman and diu');
      expect(normalizeStateName('DNH')).toBe('dadra and nagar haveli and daman and diu');
      expect(statesMatch('Daman and Diu', 'Dadra and Nagar Haveli and Daman and Diu')).toBe(true);
    });

    it('matches two-letter state acronyms: WB, UP, TN, MH, KA, GJ, RJ, PB, HR, BR, KL, AS, CG', () => {
      expect(statesMatch('WB', 'West Bengal')).toBe(true);
      expect(statesMatch('UP', 'Uttar Pradesh')).toBe(true);
      expect(statesMatch('TN', 'Tamil Nadu')).toBe(true);
      expect(statesMatch('MH', 'Maharashtra')).toBe(true);
      expect(statesMatch('KA', 'Karnataka')).toBe(true);
      expect(statesMatch('GJ', 'Gujarat')).toBe(true);
      expect(statesMatch('RJ', 'Rajasthan')).toBe(true);
      expect(statesMatch('PB', 'Punjab')).toBe(true);
      expect(statesMatch('HR', 'Haryana')).toBe(true);
      expect(statesMatch('BR', 'Bihar')).toBe(true);
      expect(statesMatch('KL', 'Kerala')).toBe(true);
      expect(statesMatch('AS', 'Assam')).toBe(true);
      expect(statesMatch('CG', 'Chhattisgarh')).toBe(true);
    });

    it('correctly rejects mismatched states', () => {
      expect(statesMatch('Maharashtra', 'Tamil Nadu')).toBe(false);
      expect(statesMatch('West Bengal', 'Karnataka')).toBe(false);
      expect(statesMatch('Delhi', 'Punjab')).toBe(false);
      expect(statesMatch('Odisha', 'Gujarat')).toBe(false);
      expect(statesMatch('Kerala', 'Himachal Pradesh')).toBe(false);
    });

    it('handles empty, null, or undefined gracefully', () => {
      expect(statesMatch(null, 'Delhi')).toBe(false);
      expect(statesMatch('Delhi', undefined)).toBe(false);
      expect(statesMatch('', '')).toBe(false);
      expect(normalizeStateName('')).toBe('');
      expect(normalizeStateName(null)).toBe('');
    });
  });

  describe('2. Query Normalization & Diacritics Stripping', () => {
    it('strips accents and diacritics', () => {
      expect(normalizeLocationQuery('Pūri')).toBe('puri');
      expect(normalizeLocationQuery('Bhubanēshwar')).toBe('bhubaneshwar');
      expect(normalizeLocationQuery('Kozhikkōde')).toBe('kozhikkode');
    });

    it('removes punctuation and collapses extra spaces', () => {
      expect(normalizeLocationQuery('Bhubaneswar,  Odisha!')).toBe('bhubaneswar odisha');
      expect(normalizeLocationQuery('New-Delhi / NCR')).toBe('new delhi ncr');
    });

    it('handles non-string inputs safely', () => {
      expect(normalizeLocationQuery(null)).toBe('');
      expect(normalizeLocationQuery(undefined)).toBe('');
      expect(normalizeLocationQuery(123)).toBe('');
    });
  });

  describe('3. City Aliases, Spelling Variants & Abbreviations', () => {
    it('resolves Bhubaneswar spelling variants (Bhubaneshwar, Bhuvaneshwar)', () => {
      expect(resolveCityAlias('Bhubaneswar')).toBe('Bhubaneswar');
      expect(resolveCityAlias('Bhubaneshwar')).toBe('Bhubaneswar');
      expect(resolveCityAlias('Bhuvaneshwar')).toBe('Bhubaneswar');
    });

    it('resolves Bhubaneswar abbreviations (BBSR, BBI)', () => {
      expect(resolveCityAlias('BBSR')).toBe('Bhubaneswar');
      expect(resolveCityAlias('bbsr')).toBe('Bhubaneswar');
      expect(resolveCityAlias('BBI')).toBe('Bhubaneswar');
    });

    it('resolves Bengaluru, Bangalore, and BLR', () => {
      expect(resolveCityAlias('Bangalore')).toBe('Bengaluru');
      expect(resolveCityAlias('Bengaluru')).toBe('Bengaluru');
      expect(resolveCityAlias('BLR')).toBe('Bengaluru');
    });

    it('resolves Kolkata, Calcutta, and CCU', () => {
      expect(resolveCityAlias('Calcutta')).toBe('Kolkata');
      expect(resolveCityAlias('Kolkata')).toBe('Kolkata');
      expect(resolveCityAlias('CCU')).toBe('Kolkata');
    });

    it('resolves Mumbai, Bombay, and BOM', () => {
      expect(resolveCityAlias('Bombay')).toBe('Mumbai');
      expect(resolveCityAlias('Mumbai')).toBe('Mumbai');
      expect(resolveCityAlias('BOM')).toBe('Mumbai');
    });

    it('resolves Chennai, Madras, and MAA', () => {
      expect(resolveCityAlias('Madras')).toBe('Chennai');
      expect(resolveCityAlias('Chennai')).toBe('Chennai');
      expect(resolveCityAlias('MAA')).toBe('Chennai');
    });

    it('resolves Delhi, New Delhi, Dilli, NCR, and DEL', () => {
      expect(resolveCityAlias('New Delhi')).toBe('Delhi');
      expect(resolveCityAlias('Dilli')).toBe('Delhi');
      expect(resolveCityAlias('NCR')).toBe('Delhi');
      expect(resolveCityAlias('DEL')).toBe('Delhi');
    });

    it('resolves Hyderabad and HYD', () => {
      expect(resolveCityAlias('Hyderabad')).toBe('Hyderabad');
      expect(resolveCityAlias('HYD')).toBe('Hyderabad');
    });

    it('resolves Ahmedabad and AMD', () => {
      expect(resolveCityAlias('Ahmedabad')).toBe('Ahmedabad');
      expect(resolveCityAlias('AMD')).toBe('Ahmedabad');
    });

    it('resolves Pune, Poona, and PNQ', () => {
      expect(resolveCityAlias('Poona')).toBe('Pune');
      expect(resolveCityAlias('Pune')).toBe('Pune');
      expect(resolveCityAlias('PNQ')).toBe('Pune');
    });

    it('resolves Jaipur and JAI', () => {
      expect(resolveCityAlias('Jaipur')).toBe('Jaipur');
      expect(resolveCityAlias('JAI')).toBe('Jaipur');
    });

    it('resolves Lucknow and LKO', () => {
      expect(resolveCityAlias('Lucknow')).toBe('Lucknow');
      expect(resolveCityAlias('LKO')).toBe('Lucknow');
    });

    it('resolves Patna and PAT', () => {
      expect(resolveCityAlias('Patna')).toBe('Patna');
      expect(resolveCityAlias('PAT')).toBe('Patna');
    });

    it('resolves Varanasi, Banaras, Benares, Kashi, and VNS', () => {
      expect(resolveCityAlias('Banaras')).toBe('Varanasi');
      expect(resolveCityAlias('Benares')).toBe('Varanasi');
      expect(resolveCityAlias('Kashi')).toBe('Varanasi');
      expect(resolveCityAlias('VNS')).toBe('Varanasi');
    });

    it('resolves Gurugram and Gurgaon', () => {
      expect(resolveCityAlias('Gurgaon')).toBe('Gurugram');
      expect(resolveCityAlias('Gurugram')).toBe('Gurugram');
    });

    it('resolves Vadodara, Baroda, and BDQ', () => {
      expect(resolveCityAlias('Baroda')).toBe('Vadodara');
      expect(resolveCityAlias('Vadodara')).toBe('Vadodara');
      expect(resolveCityAlias('BDQ')).toBe('Vadodara');
    });

    it('resolves Thiruvananthapuram, Trivandrum, and TRV', () => {
      expect(resolveCityAlias('Trivandrum')).toBe('Thiruvananthapuram');
      expect(resolveCityAlias('TRV')).toBe('Thiruvananthapuram');
    });

    it('resolves Prayagraj, Allahabad, and ALD', () => {
      expect(resolveCityAlias('Allahabad')).toBe('Prayagraj');
      expect(resolveCityAlias('ALD')).toBe('Prayagraj');
    });

    it('resolves Visakhapatnam, Vizag, VTZ, and Waltair', () => {
      expect(resolveCityAlias('Vizag')).toBe('Visakhapatnam');
      expect(resolveCityAlias('VTZ')).toBe('Visakhapatnam');
      expect(resolveCityAlias('Waltair')).toBe('Visakhapatnam');
    });

    it('resolves Chandigarh and IXC', () => {
      expect(resolveCityAlias('IXC')).toBe('Chandigarh');
      expect(resolveCityAlias('Chandigarh')).toBe('Chandigarh');
    });

    it('resolves Bhopal and BHO', () => {
      expect(resolveCityAlias('BHO')).toBe('Bhopal');
      expect(resolveCityAlias('Bhopal')).toBe('Bhopal');
    });

    it('resolves Kochi, Cochin, and COK', () => {
      expect(resolveCityAlias('Cochin')).toBe('Kochi');
      expect(resolveCityAlias('COK')).toBe('Kochi');
    });

    it('resolves Guwahati, Gauhati, Dispur, and GAU', () => {
      expect(resolveCityAlias('Gauhati')).toBe('Guwahati');
      expect(resolveCityAlias('Dispur')).toBe('Guwahati');
      expect(resolveCityAlias('GAU')).toBe('Guwahati');
    });

    it('resolves Panaji and Panjim', () => {
      expect(resolveCityAlias('Panjim')).toBe('Panaji');
      expect(resolveCityAlias('Panaji')).toBe('Panaji');
    });

    it('resolves Dehradun and DED', () => {
      expect(resolveCityAlias('DED')).toBe('Dehradun');
      expect(resolveCityAlias('Dehradun')).toBe('Dehradun');
    });

    it('resolves Raipur and RPR', () => {
      expect(resolveCityAlias('RPR')).toBe('Raipur');
      expect(resolveCityAlias('Raipur')).toBe('Raipur');
    });

    it('resolves Ranchi and IXR', () => {
      expect(resolveCityAlias('IXR')).toBe('Ranchi');
      expect(resolveCityAlias('Ranchi')).toBe('Ranchi');
    });

    it('resolves Shimla and Simla', () => {
      expect(resolveCityAlias('Simla')).toBe('Shimla');
      expect(resolveCityAlias('Shimla')).toBe('Shimla');
    });

    it('resolves Srinagar and SXR', () => {
      expect(resolveCityAlias('SXR')).toBe('Srinagar');
      expect(resolveCityAlias('Srinagar')).toBe('Srinagar');
    });

    it('resolves Jammu and IXJ', () => {
      expect(resolveCityAlias('IXJ')).toBe('Jammu');
      expect(resolveCityAlias('Jammu')).toBe('Jammu');
    });

    it('resolves Leh and IXL', () => {
      expect(resolveCityAlias('IXL')).toBe('Leh');
      expect(resolveCityAlias('Leh')).toBe('Leh');
    });

    it('resolves Puducherry, Pondicherry, and PNY', () => {
      expect(resolveCityAlias('Pondicherry')).toBe('Puducherry');
      expect(resolveCityAlias('PNY')).toBe('Puducherry');
    });

    it('resolves Odisha cities: Cuttack, Puri, Rourkela', () => {
      expect(resolveCityAlias('Cuttack')).toBe('Cuttack');
      expect(resolveCityAlias('Puri')).toBe('Puri');
      expect(resolveCityAlias('Rourkela')).toBe('Rourkela');
    });
  });

  describe('4. City-to-State Validation Matrix (isValidCityStatePair)', () => {
    it('validates Bhubaneswar with Odisha', () => {
      const res = isValidCityStatePair('Bhubaneswar', 'Odisha');
      expect(res.valid).toBe(true);
    });

    it('validates Bhubaneswar with state alias Orissa', () => {
      const res = isValidCityStatePair('Bhubaneswar', 'Orissa');
      expect(res.valid).toBe(true);
    });

    it('validates Bhubaneswar abbreviation BBSR with Odisha', () => {
      const res = isValidCityStatePair('BBSR', 'Odisha');
      expect(res.valid).toBe(true);
    });

    it('validates Cuttack, Puri, and Rourkela with Odisha', () => {
      expect(isValidCityStatePair('Cuttack', 'Odisha').valid).toBe(true);
      expect(isValidCityStatePair('Puri', 'Odisha').valid).toBe(true);
      expect(isValidCityStatePair('Rourkela', 'Odisha').valid).toBe(true);
    });

    it('validates Kolkata with West Bengal or WB', () => {
      expect(isValidCityStatePair('Kolkata', 'West Bengal').valid).toBe(true);
      expect(isValidCityStatePair('Calcutta', 'WB').valid).toBe(true);
    });

    it('validates Delhi with Delhi or NCT of Delhi', () => {
      expect(isValidCityStatePair('Delhi', 'Delhi').valid).toBe(true);
      expect(isValidCityStatePair('New Delhi', 'NCT of Delhi').valid).toBe(true);
    });

    it('validates Mumbai and Pune with Maharashtra', () => {
      expect(isValidCityStatePair('Mumbai', 'Maharashtra').valid).toBe(true);
      expect(isValidCityStatePair('Bombay', 'MH').valid).toBe(true);
      expect(isValidCityStatePair('Pune', 'Maharashtra').valid).toBe(true);
    });

    it('validates Bengaluru with Karnataka', () => {
      expect(isValidCityStatePair('Bengaluru', 'Karnataka').valid).toBe(true);
      expect(isValidCityStatePair('Bangalore', 'KA').valid).toBe(true);
    });

    it('validates Chennai with Tamil Nadu', () => {
      expect(isValidCityStatePair('Chennai', 'Tamil Nadu').valid).toBe(true);
      expect(isValidCityStatePair('Madras', 'TN').valid).toBe(true);
    });

    it('validates Hyderabad with Telangana', () => {
      expect(isValidCityStatePair('Hyderabad', 'Telangana').valid).toBe(true);
    });

    it('validates Ahmedabad, Surat, and Vadodara with Gujarat', () => {
      expect(isValidCityStatePair('Ahmedabad', 'Gujarat').valid).toBe(true);
      expect(isValidCityStatePair('Vadodara', 'Gujarat').valid).toBe(true);
      expect(isValidCityStatePair('Baroda', 'GJ').valid).toBe(true);
    });

    it('validates Lucknow, Varanasi, Prayagraj, and Noida with Uttar Pradesh', () => {
      expect(isValidCityStatePair('Lucknow', 'Uttar Pradesh').valid).toBe(true);
      expect(isValidCityStatePair('Varanasi', 'UP').valid).toBe(true);
      expect(isValidCityStatePair('Banaras', 'Uttar Pradesh').valid).toBe(true);
      expect(isValidCityStatePair('Noida', 'Uttar Pradesh').valid).toBe(true);
      expect(isValidCityStatePair('Prayagraj', 'Uttar Pradesh').valid).toBe(true);
    });

    it('validates Chandigarh with Chandigarh, Punjab, or Haryana', () => {
      expect(isValidCityStatePair('Chandigarh', 'Chandigarh').valid).toBe(true);
      expect(isValidCityStatePair('Chandigarh', 'Punjab').valid).toBe(true);
      expect(isValidCityStatePair('Chandigarh', 'Haryana').valid).toBe(true);
    });

    it('rejects Mumbai paired with Odisha with helpful error message', () => {
      const res = isValidCityStatePair('Mumbai', 'Odisha');
      expect(res.valid).toBe(false);
      expect(res.expectedState).toBe('Maharashtra');
      expect(res.message).toContain('Maharashtra, not Odisha');
    });

    it('rejects Bhubaneswar paired with Maharashtra', () => {
      const res = isValidCityStatePair('Bhubaneswar', 'Maharashtra');
      expect(res.valid).toBe(false);
      expect(res.expectedState).toBe('Odisha');
      expect(res.message).toContain('Odisha, not Maharashtra');
    });

    it('rejects Kolkata paired with Gujarat', () => {
      const res = isValidCityStatePair('Kolkata', 'Gujarat');
      expect(res.valid).toBe(false);
      expect(res.expectedState).toBe('West Bengal');
    });

    it('rejects Chennai paired with Punjab', () => {
      const res = isValidCityStatePair('Chennai', 'Punjab');
      expect(res.valid).toBe(false);
      expect(res.expectedState).toBe('Tamil Nadu');
    });

    it('allows unknown cities without error if not in static dictionary', () => {
      const res = isValidCityStatePair('SomeSmallVillage', 'Odisha');
      expect(res.valid).toBe(true);
    });
  });

  describe('5. Query Parsing (extractCityAndState)', () => {
    it('splits "Bhubaneswar, Odisha" into city and state', () => {
      const { city, state } = extractCityAndState('Bhubaneswar, Odisha');
      expect(city).toBe('Bhubaneswar');
      expect(state).toBe('Odisha');
    });

    it('splits "Kolkata, West Bengal, India" into city and state', () => {
      const { city, state } = extractCityAndState('Kolkata, West Bengal, India');
      expect(city).toBe('Kolkata');
      expect(state).toBe('West Bengal, India');
    });

    it('handles single city without comma', () => {
      const { city, state } = extractCityAndState('Bhubaneswar');
      expect(city).toBe('Bhubaneswar');
      expect(state).toBe('');
    });

    it('handles empty input gracefully', () => {
      expect(extractCityAndState('')).toEqual({ city: '', state: '' });
      expect(extractCityAndState(null)).toEqual({ city: '', state: '' });
    });
  });

  describe('6. Ranking & Deduplication (rankAndDeduplicateLocations)', () => {
    it('ranks exact alias match ahead of partial or substring match', () => {
      const items = [
        { name: 'Bhubaneswar North', latitude: 20.35, longitude: 85.85, population: 50000 },
        { name: 'Bhubaneswar', latitude: 20.29, longitude: 85.82, population: 885000 },
        { name: 'Old Bhubaneswar', latitude: 20.24, longitude: 85.83, population: 30000 }
      ];
      const ranked = rankAndDeduplicateLocations(items, 'Bhubaneswar');
      expect(ranked[0].name).toBe('Bhubaneswar');
    });

    it('boosts results matching the target state', () => {
      const items = [
        { name: 'Puri', admin1: 'Madhya Pradesh', latitude: 24.51, longitude: 82.48 },
        { name: 'Puri', admin1: 'Odisha', latitude: 19.81, longitude: 85.83 }
      ];
      const ranked = rankAndDeduplicateLocations(items, 'Puri', 'Odisha');
      expect(ranked[0].admin1).toBe('Odisha');
    });

    it('deduplicates locations with nearly identical coordinates', () => {
      const items = [
        { name: 'Bhubaneswar 1', latitude: 20.291, longitude: 85.824 },
        { name: 'Bhubaneswar 2', latitude: 20.294, longitude: 85.821 }, // rounds to 20.29, 85.82
        { name: 'Cuttack', latitude: 20.464, longitude: 85.879 }
      ];
      const deduped = rankAndDeduplicateLocations(items, 'Bhubaneswar');
      expect(deduped.length).toBe(2);
    });
  });

  describe('7. Country Code Normalization (normalizeCountryCode)', () => {
    it('normalizes India, IN, ind to IN', () => {
      expect(normalizeCountryCode('India')).toBe('IN');
      expect(normalizeCountryCode('india')).toBe('IN');
      expect(normalizeCountryCode('IN')).toBe('IN');
      expect(normalizeCountryCode('ind')).toBe('IN');
      expect(normalizeCountryCode('')).toBe('IN');
      expect(normalizeCountryCode(null)).toBe('IN');
    });

    it('handles foreign 2-letter country codes', () => {
      expect(normalizeCountryCode('US')).toBe('US');
      expect(normalizeCountryCode('GB')).toBe('GB');
    });
  });

  describe('8. Geocode Cloudflare Function Endpoint (/api/geocode)', () => {
    it('returns geocoded coordinates when upstream API succeeds for Bhubaneswar', async () => {
      const mockApiResponse = {
        results: [
          {
            id: 12758171,
            name: 'Bhubaneswar',
            latitude: 20.2961,
            longitude: 85.8245,
            country: 'India',
            country_code: 'IN',
            admin1: 'Odisha',
            population: 885363
          }
        ]
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      });

      const req = new Request('https://foggy.pages.dev/api/geocode?q=Bhubaneswar', {
        headers: { 'cf-connecting-ip': '10.1.0.1' }
      });

      const res = await onRequest({ request: req });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.results).toBeDefined();
      expect(data.results[0].name).toBe('Bhubaneswar');
      expect(data.results[0].admin1).toBe('Odisha');
      expect(data.results[0].latitude).toBeCloseTo(20.29, 1);
    });

    it('resolves BBSR abbreviation to Bhubaneswar upstream', async () => {
      const mockApiResponse = {
        results: [
          {
            id: 12758171,
            name: 'Bhubaneswar',
            latitude: 20.2961,
            longitude: 85.8245,
            country: 'India',
            country_code: 'IN',
            admin1: 'Odisha'
          }
        ]
      };

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      });

      const req = new Request('https://foggy.pages.dev/api/geocode?name=BBSR', {
        headers: { 'cf-connecting-ip': '10.1.0.2' }
      });

      const res = await onRequest({ request: req });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.results[0].name).toBe('Bhubaneswar');
      // Verify outbound query converted alias BBSR to Bhubaneswar
      expect(fetchSpy.mock.calls[0][0]).toContain('name=Bhubaneswar');
    });

    it('handles query with comma like "Bhubaneswar, Odisha"', async () => {
      const mockApiResponse = {
        results: [
          {
            id: 12758171,
            name: 'Bhubaneswar',
            latitude: 20.2961,
            longitude: 85.8245,
            country: 'India',
            country_code: 'IN',
            admin1: 'Odisha'
          }
        ]
      };

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      });

      const req = new Request('https://foggy.pages.dev/api/geocode?q=Bhubaneswar%2C%20Odisha', {
        headers: { 'cf-connecting-ip': '10.1.0.3' }
      });

      const res = await onRequest({ request: req });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.results[0].name).toBe('Bhubaneswar');
      expect(fetchSpy.mock.calls[0][0]).toContain('name=Bhubaneswar');
    });

    it('falls back to local Indian cities database when upstream returns empty (not found)', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] })
      });

      const req = new Request('https://foggy.pages.dev/api/geocode?q=Bhubaneswar', {
        headers: { 'cf-connecting-ip': '10.1.0.4' }
      });

      const res = await onRequest({ request: req });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.results.length).toBeGreaterThan(0);
      expect(data.results[0].name).toBe('Bhubaneswar');
      expect(data.results[0].admin1).toBe('Odisha');
    });

    it('falls back to local Indian cities database for Cuttack, Puri, and Rourkela', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] })
      });

      for (const cityName of ['Cuttack', 'Puri', 'Rourkela']) {
        const req = new Request(`https://foggy.pages.dev/api/geocode?q=${cityName}`, {
          headers: { 'cf-connecting-ip': `10.1.0.${cityName.length}` }
        });
        const res = await onRequest({ request: req });
        const data = await res.json();
        expect(data.results.length).toBeGreaterThan(0);
        expect(data.results[0].name).toBe(cityName);
        expect(data.results[0].admin1).toBe('Odisha');
      }
    });

    it('retries transient network error and serves offline index with status upstream_error', async () => {
      vi.spyOn(global, 'fetch')
        .mockRejectedValueOnce(new Error('Network offline'))
        .mockRejectedValueOnce(new Error('Network offline'));

      const req = new Request('https://foggy.pages.dev/api/geocode?q=Bhubaneswar', {
        headers: { 'cf-connecting-ip': '10.1.0.5' }
      });

      const res = await onRequest({ request: req });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.fallback).toBe(true);
      expect(data.status).toBe('upstream_error');
      expect(data.results[0].name).toBe('Bhubaneswar');
    });

    it('retries transient 500 error once before serving offline index', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [{ name: 'Kolkata', latitude: 22.57, longitude: 88.36, admin1: 'West Bengal' }]
          })
        });

      const req = new Request('https://foggy.pages.dev/api/geocode?q=Kolkata', {
        headers: { 'cf-connecting-ip': '10.1.0.6' }
      });

      const res = await onRequest({ request: req });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.results[0].name).toBe('Kolkata');
      expect(fetchSpy).toHaveBeenCalledTimes(2); // Retried once on 500
    });

    it('returns 503 service_busy when upstream fails and query is not in offline index', async () => {
      vi.spyOn(global, 'fetch')
        .mockRejectedValueOnce(new Error('Network offline'))
        .mockRejectedValueOnce(new Error('Network offline'));

      const req = new Request('https://foggy.pages.dev/api/geocode?q=UnknownRandomPlace12345', {
        headers: { 'cf-connecting-ip': '10.1.0.7' }
      });

      const res = await onRequest({ request: req });
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.status).toBe('service_busy');
      expect(data.error).toContain('temporarily unavailable');
    });

    it('returns empty array with not_found status when unknown location is queried and upstream returns empty', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] })
      });

      const req = new Request(
        'https://foggy.pages.dev/api/geocode?q=ZzZzZzZzZNonExistentPlace999',
        {
          headers: { 'cf-connecting-ip': '10.1.0.8' }
        }
      );

      const res = await onRequest({ request: req });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.results).toEqual([]);
      expect(data.status).toBe('not_found');
    });

    it('returns empty results immediately when query length is less than 2 characters', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      const req = new Request('https://foggy.pages.dev/api/geocode?name=a', {
        headers: { 'cf-connecting-ip': '10.1.0.9' }
      });
      const res = await onRequest({ request: req });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.results).toEqual([]);
      expect(data.status).toBe('not_found');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('returns cached results on subsequent requests for the same query', async () => {
      const mockApiResponse = {
        results: [
          { id: 99, name: 'Jaipur', latitude: 26.91, longitude: 75.78, admin1: 'Rajasthan' }
        ]
      };

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse
      });

      const req1 = new Request('https://foggy.pages.dev/api/geocode?name=JaipurCity', {
        headers: { 'cf-connecting-ip': '10.1.0.10' }
      });
      const res1 = await onRequest({ request: req1 });
      const data1 = await res1.json();
      expect(data1.results[0].name).toBe('Jaipur');
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Second request with same query hits in-memory cache
      const req2 = new Request('https://foggy.pages.dev/api/geocode?name=JaipurCity', {
        headers: { 'cf-connecting-ip': '10.1.0.10' }
      });
      const res2 = await onRequest({ request: req2 });
      const data2 = await res2.json();
      expect(data2.cached).toBe(true);
      expect(data2.results[0].name).toBe('Jaipur');
      expect(fetchSpy).toHaveBeenCalledTimes(1); // No new network call
    });

    it('enforces rate limiting when client IP exceeds 60 requests in window', async () => {
      const ip = '10.1.0.99';
      for (let i = 0; i < 60; i++) {
        const req = new Request('https://foggy.pages.dev/api/geocode?name=a', {
          headers: { 'cf-connecting-ip': ip }
        });
        await onRequest({ request: req });
      }

      const blockedReq = new Request('https://foggy.pages.dev/api/geocode?name=a', {
        headers: { 'cf-connecting-ip': ip }
      });
      const res = await onRequest({ request: blockedReq });
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.status).toBe('rate_limited');
      expect(data.error).toContain('Too many requests');
    });
  });
});
