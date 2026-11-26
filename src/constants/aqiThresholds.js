// src/constants/aqiThresholds.js
/**
 * @fileoverview Single source of truth for AQI severity thresholds, mask advisories,
 * 24-hour pollutant standards, and CPCB spectrum definitions.
 */

import { AQI_CATEGORIES } from '../../shared/constants.js';
export { PLAYBOOK_DATA } from './playbookData.js';

/**
 * CPCB NAQI Category bands with min/max breakpoints.
 */
export const AQI_SEVERITY_THRESHOLDS = Object.freeze({
  GOOD: { min: 0, max: 50, name: 'Good' },
  SATISFACTORY: { min: 51, max: 100, name: 'Satisfactory' },
  MODERATE: { min: 101, max: 200, name: 'Moderate' },
  POOR: { min: 201, max: 300, name: 'Poor' },
  VERY_POOR: { min: 301, max: 400, name: 'Very Poor' },
  SEVERE: { min: 401, max: 500, name: 'Severe' }
});

/**
 * Mask recommendation rules based on estimated NAQI levels.
 */
export const MASK_ADVISORY_THRESHOLDS = Object.freeze([
  {
    minAqi: 301,
    urgency: 'Mandatory',
    title: 'Certified N95 / FFP2 Mask Advised Outdoors',
    subtitle: 'Cloth and surgical masks do not block fine PM2.5 particulates.'
  },
  {
    minAqi: 201,
    urgency: 'Strongly Advised',
    title: 'Certified N95 / FFP2 Mask Advised Outdoors',
    subtitle: 'Cloth and surgical masks do not block fine PM2.5 particulates.'
  },
  {
    minAqi: 101,
    urgency: 'Recommended',
    title: 'Mask Recommended for Sensitive Groups',
    subtitle: 'Cloth and surgical masks do not block fine PM2.5 particulates.'
  },
  {
    minAqi: 0,
    urgency: 'Optional',
    title: 'Mask Optional Outdoors',
    subtitle: 'Cloth and surgical masks do not block fine PM2.5 particulates.'
  }
]);

/**
 * 24-hour average regulatory limits for key air pollutants.
 */
export const POLLUTANT_STANDARDS = Object.freeze([
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', limit: 60 },
  { key: 'pm10', label: 'PM10', unit: 'µg/m³', limit: 100 },
  { key: 'no2', label: 'NO2', unit: 'µg/m³', limit: 80 },
  { key: 'o3', label: 'O3', unit: 'µg/m³', limit: 100 },
  { key: 'so2', label: 'SO2', unit: 'µg/m³', limit: 80 },
  { key: 'co', label: 'CO', unit: 'mg/m³', limit: 2 }
]);

/**
 * CPCB 0-500 scale gradient segments for the visual spectrum bar.
 */
export const CPCB_SPECTRUM_SEGMENTS = Object.freeze([
  { widthPct: '10%', color: AQI_CATEGORIES.GOOD.color, title: 'Good (0-50)' },
  { widthPct: '10%', color: AQI_CATEGORIES.SATISFACTORY.color, title: 'Satisfactory (51-100)' },
  { widthPct: '20%', color: AQI_CATEGORIES.MODERATE.color, title: 'Moderate (101-200)' },
  { widthPct: '20%', color: AQI_CATEGORIES.POOR.color, title: 'Poor (201-300)' },
  { widthPct: '20%', color: AQI_CATEGORIES.VERY_POOR.color, title: 'Very Poor (301-400)' },
  { widthPct: '20%', color: AQI_CATEGORIES.SEVERE.color, title: 'Severe (401-500)' }
]);
