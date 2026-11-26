/**
 * @fileoverview Shared HTTP client utilities with timeout and JSON handling for Foggy frontend.
 */

const DEFAULT_HTTP_TIMEOUT_MS = 15000;

/**
 * Performs a fetch request with timeout protection and parses JSON responses.
 * @param {string} url - Request target URL.
 * @param {RequestInit} [options={}] - Standard fetch options.
 * @param {number} [timeoutMs=15000] - Timeout in milliseconds.
 * @returns {Promise<{ ok: boolean, status: number, data: any }>}
 */
export async function requestJson(url, options = {}, timeoutMs = DEFAULT_HTTP_TIMEOUT_MS) {
  const signal = options.signal || AbortSignal.timeout(timeoutMs);
  const response = await fetch(url, { ...options, signal });
  let data = null;
  try {
    data = await response.json();
  } catch (_e) {
    data = null;
  }
  return {
    ok: response.ok,
    status: response.status,
    data
  };
}
