/**
 * @fileoverview World Air Quality Index (WAQI) reference station fetcher.
 */

const WAQI_TIMEOUT_MS = 4000;
const MIN_TOKEN_LENGTH = 5;

/**
 * Fetches nearest ground-station reference reading from WAQI API if token is provided.
 *
 * @param {string} requestedCity - Target city name.
 * @param {string} [waqiToken] - User or system WAQI API token.
 * @returns {Promise<{ station: string, aqiUS: number, label: string }|null>}
 */
export async function fetchWaqiReference(requestedCity, waqiToken) {
  if (
    !waqiToken ||
    waqiToken === 'your_waqi_token_here' ||
    waqiToken.trim().length <= MIN_TOKEN_LENGTH
  ) {
    return null;
  }
  try {
    const waqiUrl = `https://api.waqi.info/feed/${encodeURIComponent(requestedCity)}/?token=${waqiToken.trim()}`;
    const waqiRes = await fetch(waqiUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(WAQI_TIMEOUT_MS)
    });
    if (waqiRes.ok) {
      const waqiJson = await waqiRes.json();
      if (waqiJson?.status === 'ok' && typeof waqiJson.data?.aqi === 'number') {
        return {
          station: waqiJson.data.city?.name || requestedCity,
          aqiUS: waqiJson.data.aqi,
          label: 'Nearest station (WAQI, US EPA scale)'
        };
      }
    }
  } catch {
    // Non-blocking background reference
  }
  return null;
}
