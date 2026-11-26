// tests/aqi-display-helpers.test.js
import { describe, it, expect } from 'vitest';
import {
  getAQIAdviceBanner,
  getMaskAdvisory,
  formatPollutants,
  getTrajectoryStats,
  get3hSlotStyle
} from '../src/utils/aqiDisplayHelpers.js';
import {
  AQI_SEVERITY_THRESHOLDS,
  MASK_ADVISORY_THRESHOLDS,
  POLLUTANT_STANDARDS,
  CPCB_SPECTRUM_SEGMENTS,
  PLAYBOOK_DATA
} from '../src/constants/aqiThresholds.js';

describe('src/utils/aqiDisplayHelpers.js & src/constants/aqiThresholds.js', () => {
  describe('Constants exports', () => {
    it('exports all standard thresholds, standards, spectrum segments, and playbook data', () => {
      expect(AQI_SEVERITY_THRESHOLDS.GOOD.max).toBe(50);
      expect(AQI_SEVERITY_THRESHOLDS.SEVERE.min).toBe(401);
      expect(MASK_ADVISORY_THRESHOLDS.length).toBe(4);
      expect(POLLUTANT_STANDARDS.length).toBe(6);
      expect(CPCB_SPECTRUM_SEGMENTS.length).toBe(6);
      expect(PLAYBOOK_DATA.free.length).toBeGreaterThan(0);
      expect(PLAYBOOK_DATA.budget.length).toBeGreaterThan(0);
      expect(PLAYBOOK_DATA.premium.length).toBeGreaterThan(0);
    });
  });

  describe('getAQIAdviceBanner', () => {
    it('returns proper level, message, and badgeClass for various AQI values', () => {
      const goodBanner = getAQIAdviceBanner(35);
      expect(goodBanner.level).toContain('Good');
      expect(goodBanner.badgeClass).toContain('emerald');

      const poorBanner = getAQIAdviceBanner(240);
      expect(poorBanner.level).toContain('Poor');
      expect(poorBanner.badgeClass).toContain('orange');

      const severeBanner = getAQIAdviceBanner(450);
      expect(severeBanner.level).toContain('Severe');
    });
  });

  describe('getMaskAdvisory', () => {
    it('returns Mandatory for AQI > 300', () => {
      const adv = getMaskAdvisory(320);
      expect(adv.urgency).toBe('Mandatory');
      expect(adv.title).toContain('N95 / FFP2');
    });

    it('returns Strongly Advised for AQI 201-300', () => {
      const adv = getMaskAdvisory(250);
      expect(adv.urgency).toBe('Strongly Advised');
    });

    it('returns Recommended for AQI 101-200', () => {
      const adv = getMaskAdvisory(150);
      expect(adv.urgency).toBe('Recommended');
      expect(adv.title).toContain('Sensitive Groups');
    });

    it('returns Optional for AQI <= 100 or non-numeric/empty values', () => {
      expect(getMaskAdvisory(45).urgency).toBe('Optional');
      expect(getMaskAdvisory(null).urgency).toBe('Optional');
      expect(getMaskAdvisory('invalid').urgency).toBe('Optional');
    });
  });

  describe('formatPollutants', () => {
    it('formats pollutant values and detects limit breaches', () => {
      const raw = {
        pm25: 120, // limit 60 -> over
        pm10: 80, // limit 100 -> ok
        no2: 40,
        o3: 95,
        so2: 25,
        co: 1.2
      };
      const formatted = formatPollutants(raw);
      expect(formatted.length).toBe(6);

      const pm25Item = formatted.find((p) => p.label === 'PM2.5');
      expect(pm25Item.val).toBe(120);
      expect(pm25Item.isOver).toBe(true);

      const pm10Item = formatted.find((p) => p.label === 'PM10');
      expect(pm10Item.val).toBe(80);
      expect(pm10Item.isOver).toBe(false);
    });

    it('handles undefined or empty pollutant map safely', () => {
      const empty = formatPollutants(undefined);
      expect(empty.length).toBe(6);
      expect(empty[0].val).toBe('--');
      expect(empty[0].isOver).toBe(false);
    });
  });

  describe('getTrajectoryStats', () => {
    it('calculates min and max values across day forecasts', () => {
      const days = [
        { minAqi: 80, maxAqi: 220, averageAqi: 150 },
        { minAqi: 110, maxAqi: 310, averageAqi: 210 },
        { minAqi: 60, maxAqi: 190, averageAqi: 120 }
      ];
      const stats = getTrajectoryStats(days);
      expect(stats.minAqi).toBe(60);
      expect(stats.maxAqi).toBe(310);
    });

    it('handles empty or missing days array with default minimums', () => {
      expect(getTrajectoryStats([])).toEqual({ minAqi: 100, maxAqi: 250 });
      expect(getTrajectoryStats(null)).toEqual({ minAqi: 100, maxAqi: 250 });
    });
  });

  describe('get3hSlotStyle', () => {
    it('returns green styling when isBest is true', () => {
      const style = get3hSlotStyle({ time: '14:00' }, true, false);
      expect(style.cardClasses).toContain('emerald');
      expect(style.timeClasses).toContain('emerald');
    });

    it('returns rose styling when isWorst is true', () => {
      const style = get3hSlotStyle({ time: '08:00' }, false, true);
      expect(style.cardClasses).toContain('rose');
      expect(style.timeClasses).toContain('rose');
    });

    it('returns neutral slate styling when neither best nor worst', () => {
      const style = get3hSlotStyle({ time: '11:00' }, false, false);
      expect(style.cardClasses).toContain('[#E2E8F0]');
      expect(style.timeClasses).toContain('[#334155]');
    });
  });
});
