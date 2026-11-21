// tests/aqi.test.js
import { describe, it, expect } from 'vitest';
import {
  calculatePM25SubIndex,
  calculatePM10SubIndex,
  calculateCPCBNAQI,
  getAQICategory,
  calculateRollingAverages
} from '../shared/aqi.js';

describe('tests/aqi.test.js - CPCB NAQI Calculation, Breakpoints, Dominant Pollutant & Categories', () => {
  describe('CPCB PM2.5 Sub-Index Breakpoint Boundaries', () => {
    it('calculates boundaries for Good (0-30 µg/m³ -> 0-50)', () => {
      expect(calculatePM25SubIndex(0)).toBe(0);
      expect(calculatePM25SubIndex(15)).toBe(25);
      expect(calculatePM25SubIndex(30)).toBe(50);
    });

    it('calculates boundaries for Satisfactory (31-60 µg/m³ -> 51-100)', () => {
      expect(calculatePM25SubIndex(31)).toBe(51);
      expect(calculatePM25SubIndex(45)).toBe(75);
      expect(calculatePM25SubIndex(60)).toBe(100);
    });

    it('calculates boundaries for Moderate (61-90 µg/m³ -> 101-200)', () => {
      expect(calculatePM25SubIndex(61)).toBe(101);
      expect(calculatePM25SubIndex(75)).toBe(149);
      expect(calculatePM25SubIndex(90)).toBe(200);
    });

    it('calculates boundaries for Poor (91-120 µg/m³ -> 201-300)', () => {
      expect(calculatePM25SubIndex(91)).toBe(201);
      expect(calculatePM25SubIndex(105)).toBe(249);
      expect(calculatePM25SubIndex(120)).toBe(300);
    });

    it('calculates boundaries for Very Poor (121-250 µg/m³ -> 301-400)', () => {
      expect(calculatePM25SubIndex(121)).toBe(301);
      expect(calculatePM25SubIndex(185)).toBe(350);
      expect(calculatePM25SubIndex(250)).toBe(400);
    });

    it('calculates boundaries for Severe (251-500 µg/m³ -> 401-500)', () => {
      expect(calculatePM25SubIndex(251)).toBe(401);
      expect(calculatePM25SubIndex(375)).toBe(450);
      expect(calculatePM25SubIndex(500)).toBe(500);
    });

    it('caps sub-index at 500 when concentration exceeds 500 µg/m³', () => {
      expect(calculatePM25SubIndex(650)).toBe(500);
    });

    it('returns null on negative or invalid concentration', () => {
      expect(calculatePM25SubIndex(-5)).toBeNull();
      expect(calculatePM25SubIndex(null)).toBeNull();
      expect(calculatePM25SubIndex(undefined)).toBeNull();
      expect(calculatePM25SubIndex(NaN)).toBeNull();
    });
  });

  describe('CPCB PM10 Sub-Index Breakpoint Boundaries', () => {
    it('calculates boundaries for Good (0-50 µg/m³ -> 0-50)', () => {
      expect(calculatePM10SubIndex(0)).toBe(0);
      expect(calculatePM10SubIndex(25)).toBe(25);
      expect(calculatePM10SubIndex(50)).toBe(50);
    });

    it('calculates boundaries for Satisfactory (51-100 µg/m³ -> 51-100)', () => {
      expect(calculatePM10SubIndex(51)).toBe(51);
      expect(calculatePM10SubIndex(75)).toBe(75);
      expect(calculatePM10SubIndex(100)).toBe(100);
    });

    it('calculates boundaries for Moderate (101-250 µg/m³ -> 101-200)', () => {
      expect(calculatePM10SubIndex(101)).toBe(101);
      expect(calculatePM10SubIndex(175)).toBe(150);
      expect(calculatePM10SubIndex(250)).toBe(200);
    });

    it('calculates boundaries for Poor (251-350 µg/m³ -> 201-300)', () => {
      expect(calculatePM10SubIndex(251)).toBe(201);
      expect(calculatePM10SubIndex(300)).toBe(250);
      expect(calculatePM10SubIndex(350)).toBe(300);
    });

    it('calculates boundaries for Very Poor (351-430 µg/m³ -> 301-400)', () => {
      expect(calculatePM10SubIndex(351)).toBe(301);
      expect(calculatePM10SubIndex(390)).toBe(350);
      expect(calculatePM10SubIndex(430)).toBe(400);
    });

    it('calculates boundaries for Severe (431-500 µg/m³ -> 401-500)', () => {
      expect(calculatePM10SubIndex(431)).toBe(401);
      expect(calculatePM10SubIndex(500)).toBe(500);
    });

    it('caps sub-index at 500 when concentration exceeds 500 µg/m³', () => {
      expect(calculatePM10SubIndex(750)).toBe(500);
    });

    it('returns null on negative or invalid concentration', () => {
      expect(calculatePM10SubIndex(-10)).toBeNull();
      expect(calculatePM10SubIndex(null)).toBeNull();
      expect(calculatePM10SubIndex(undefined)).toBeNull();
    });
  });

  describe('Highest-Sub-Index Rule & Dominant Pollutant', () => {
    it('selects PM2.5 as dominant when its sub-index is higher', () => {
      // PM2.5 = 90 -> sub-index 200
      // PM10 = 75 -> sub-index 75
      const res = calculateCPCBNAQI(90, 75);
      expect(res.aqi).toBe(200);
      expect(res.dominant).toBe('PM2.5');
    });

    it('selects PM10 as dominant when its sub-index is higher', () => {
      // PM2.5 = 20 -> sub-index 33
      // PM10 = 200 -> sub-index 167
      const res = calculateCPCBNAQI(20, 200);
      expect(res.aqi).toBe(167);
      expect(res.dominant).toBe('PM10');
    });

    it('handles tie between PM2.5 and PM10 cleanly defaulting to PM2.5', () => {
      // PM2.5 = 30 -> sub-index 50
      // PM10 = 50 -> sub-index 50
      const res = calculateCPCBNAQI(30, 50);
      expect(res.aqi).toBe(50);
      expect(res.dominant).toBe('PM2.5');
    });

    it('handles partial data: only PM2.5 available', () => {
      const res = calculateCPCBNAQI(80, null);
      expect(res.aqi).toBe(166);
      expect(res.dominant).toBe('PM2.5');
      expect(res.pm10SubIndex).toBeNull();
    });

    it('handles partial data: only PM10 available', () => {
      const res = calculateCPCBNAQI(null, 150);
      expect(res.aqi).toBe(134);
      expect(res.dominant).toBe('PM10');
      expect(res.pm25SubIndex).toBeNull();
    });

    it('handles missing data: neither pollutant available', () => {
      const res = calculateCPCBNAQI(null, null);
      expect(res.aqi).toBeNull();
      expect(res.dominant).toBeNull();
    });
  });

  describe('Category Mapping and Hex Colours', () => {
    it('maps AQI bands to proper CPCB labels and colors', () => {
      expect(getAQICategory(30)).toMatchObject({ label: 'Good', color: '#10b981', severity: 1 });
      expect(getAQICategory(85)).toMatchObject({
        label: 'Satisfactory',
        color: '#84cc16',
        severity: 2
      });
      expect(getAQICategory(150)).toMatchObject({
        label: 'Moderate',
        color: '#eab308',
        severity: 3
      });
      expect(getAQICategory(240)).toMatchObject({ label: 'Poor', color: '#f97316', severity: 4 });
      expect(getAQICategory(350)).toMatchObject({
        label: 'Very Poor',
        color: '#ef4444',
        severity: 5
      });
      expect(getAQICategory(460)).toMatchObject({ label: 'Severe', color: '#7f1d1d', severity: 6 });
    });

    it('handles invalid AQI values gracefully', () => {
      const unknown = getAQICategory(null);
      expect(unknown.label).toBe('Unknown');
      expect(unknown.severity).toBe(0);
    });
  });

  describe('Rolling 24-Hour Averages', () => {
    it('calculates mean over 24-hour window accurately', () => {
      const pm25Series = new Array(24).fill(60);
      const pm10Series = new Array(24).fill(100);
      const res = calculateRollingAverages(pm25Series, pm10Series, 23);
      expect(res.pm25Avg24h).toBe(60);
      expect(res.pm10Avg24h).toBe(100);
      expect(res.count).toBe(24);
    });

    it('handles incomplete series gracefully', () => {
      const pm25Series = [30, 50, 70];
      const res = calculateRollingAverages(pm25Series, [], 2);
      expect(res.pm25Avg24h).toBe(50);
      expect(res.count).toBe(3);
    });

    it('handles empty series with safe fallback', () => {
      const res = calculateRollingAverages([], []);
      expect(res.pm25Avg24h).toBe(60);
      expect(res.count).toBe(0);
    });
  });
});
