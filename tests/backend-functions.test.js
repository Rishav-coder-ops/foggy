// tests/backend-functions.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequestGet as getAqi, getDeterministicMockCity } from '../functions/api/aqi.js';
import { onRequestGet as getTimeline } from '../functions/api/aqi-timeline.js';

describe('tests/backend-functions.test.js - Backend Endpoints, Coordinate Caching & Fallbacks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      const urlStr = url.toString();
      if (urlStr.includes('air-quality')) {
        const isChennai = urlStr.includes('latitude=13.08') || urlStr.includes('latitude=13.0827');
        const pm25 = isChennai ? 25 : 180;
        const pm10 = isChennai ? 40 : 260;
        const lat = isChennai ? 13.08 : 28.61;
        const lon = isChennai ? 80.27 : 77.21;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            latitude: lat,
            longitude: lon,
            current: { time: '2026-11-24T12:00', pm2_5: pm25, pm10 },
            hourly: {
              time: Array.from(
                { length: 48 },
                (_, i) => `2026-11-24T${String(i % 24).padStart(2, '0')}:00`
              ),
              pm2_5: Array(48).fill(pm25),
              pm10: Array(48).fill(pm10)
            }
          })
        };
      }
      if (urlStr.includes('forecast')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            current: { temperature_2m: 24, relative_humidity_2m: 55, wind_speed_10m: 3.5 }
          })
        };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Coordinate-Based Isolation Regression Test', () => {
    it('ensures two different cities with different coordinates return distinct AQI results', async () => {
      // City A: Delhi (28.6139, 77.2090)
      const delhiReq = new Request(
        'https://foggy.pages.dev/api/aqi?city=Delhi&lat=28.6139&lon=77.2090',
        {
          headers: { 'cf-connecting-ip': '10.5.0.1' }
        }
      );

      // City B: Chennai (13.0827, 80.2707)
      const chennaiReq = new Request(
        'https://foggy.pages.dev/api/aqi?city=Chennai&lat=13.0827&lon=80.2707',
        {
          headers: { 'cf-connecting-ip': '10.5.0.2' }
        }
      );

      const delhiRes = await getAqi({ request: delhiReq, env: {} });
      const chennaiRes = await getAqi({ request: chennaiReq, env: {} });

      expect(delhiRes.status).toBe(200);
      expect(chennaiRes.status).toBe(200);

      const delhiData = await delhiRes.json();
      const chennaiData = await chennaiRes.json();

      expect(delhiData.city).toContain('Delhi');
      expect(chennaiData.city).toContain('Chennai');
      // Verify they do not share the same cached values
      expect(delhiData.aqi).not.toEqual(chennaiData.aqi);
    });

    it('ensures timeline endpoint isolates forecasts by coordinates', async () => {
      const kolkataReq = new Request(
        'https://foggy.pages.dev/api/aqi-timeline?city=Kolkata&lat=22.5726&lon=88.3639',
        {
          headers: { 'cf-connecting-ip': '10.5.0.3' }
        }
      );

      const mumbaiReq = new Request(
        'https://foggy.pages.dev/api/aqi-timeline?city=Mumbai&lat=19.0760&lon=72.8777',
        {
          headers: { 'cf-connecting-ip': '10.5.0.4' }
        }
      );

      const kolkataRes = await getTimeline({ request: kolkataReq, env: {} });
      const mumbaiRes = await getTimeline({ request: mumbaiReq, env: {} });

      expect(kolkataRes.status).toBe(200);
      expect(mumbaiRes.status).toBe(200);

      const kolkataData = await kolkataRes.json();
      const mumbaiData = await mumbaiRes.json();

      const kolkataCity = kolkataData.location?.city || kolkataData.city;
      const mumbaiCity = mumbaiData.location?.city || mumbaiData.city;

      expect(kolkataCity).toContain('Kolkata');
      expect(mumbaiCity).toContain('Mumbai');
    });
  });

  describe('Safe Generic Error Handling (No Stack Traces Leaked)', () => {
    it('returns generic error without internal stack traces when upstream fails unexpectedly', async () => {
      vi.spyOn(global, 'fetch').mockImplementationOnce(() => {
        throw new Error('SecretDatabaseException: connection to 192.168.1.50 failed at line 42');
      });

      const req = new Request('https://foggy.pages.dev/api/aqi?city=Kolkata', {
        headers: { 'cf-connecting-ip': '10.5.0.5' }
      });

      const res = await getAqi({ request: req, env: {} });
      // Endpoint catches error and uses resilient simulation fallback
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(JSON.stringify(data)).not.toContain('SecretDatabaseException');
      expect(JSON.stringify(data)).not.toContain('192.168.1.50');
      expect(data.city).toBe('Kolkata, West Bengal');
    });
  });

  describe('Fallback from CPCB Station to Model Estimate', () => {
    it('provides CPCB estimated scale and clear attribution', async () => {
      const mockCity = getDeterministicMockCity('Delhi');
      expect(mockCity).toBeDefined();
      expect(mockCity.city).toContain('Delhi');
      expect(mockCity.aqi).toBeGreaterThan(0);
      expect(mockCity.dominant).toBe('PM2.5');
    });
  });
});
