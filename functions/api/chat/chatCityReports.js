/**
 * @fileoverview City atmospheric report resolution and single-source-of-truth alignment for /api/chat.
 */

import { fetchCityAqiReport } from '../aqi-timeline.js';

/**
 * Resolves city reports for detected locations and aligns primary report with client's active AQI data.
 *
 * @param {object} params
 * @param {object} params.requestBody
 * @param {object} params.intent
 * @param {string} params.currentSelectedCityName
 * @returns {Promise<{
 *   found: boolean,
 *   cityReports?: Array<object>,
 *   primaryReport?: object,
 *   secondaryReport?: object|null,
 *   isDifferentFromSelected?: boolean
 * }>}
 */
export async function resolveAndFetchCityReports({ requestBody, intent, currentSelectedCityName }) {
  const cityReports = [];
  for (const c of intent.cities) {
    const report = await fetchCityAqiReport(c, intent.timeframe);
    if (report && report.found) {
      cityReports.push(report);
    }
  }

  if (cityReports.length === 0) {
    return { found: false };
  }

  const primaryReport = cityReports[0];
  const secondaryReport = cityReports.length > 1 ? cityReports[1] : null;

  // Single source of truth alignment with client's active aqiData if same place
  const clientAqi = requestBody.aqiData;
  if (clientAqi && clientAqi.aqi != null) {
    const clientCityNorm = (clientAqi.city || '').toLowerCase().trim();
    const primaryCityNorm = (primaryReport.city || '').toLowerCase().trim();
    if (
      intent.usedDefault ||
      clientCityNorm.includes(primaryCityNorm) ||
      primaryCityNorm.includes(clientCityNorm)
    ) {
      primaryReport.current.aqi = clientAqi.aqi;
      if (clientAqi.category) primaryReport.current.category = clientAqi.category;
      if (clientAqi.dominantPollutant) primaryReport.current.dominant = clientAqi.dominantPollutant;
      if (clientAqi.isMock != null) primaryReport.isMock = Boolean(clientAqi.isMock);
    }
  }

  const isDifferentFromSelected =
    !intent.usedDefault &&
    primaryReport.city.toLowerCase() !== currentSelectedCityName.toLowerCase();

  return {
    found: true,
    cityReports,
    primaryReport,
    secondaryReport,
    isDifferentFromSelected
  };
}
