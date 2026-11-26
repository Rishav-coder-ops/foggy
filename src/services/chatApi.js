/**
 * @fileoverview Chat API Service for Foggy communicating with /api/chat.
 * Handles rate limits, Firebase token auth, and smart offline core fallback.
 */

import { auth } from '../firebase';
import { getAQICategory } from '../../shared/aqi.js';
import { classifyIntent } from '../../shared/chatIntent/intentClassifier.js';
import {
  generateSmartFallbackResponse,
  validateAndAlignReplyWithAqi
} from '../../shared/chat/responseValidator.js';
import { FOGGY_FALLBACK_MODEL, FOGGY_PROVIDER_LABELS } from '../../shared/constants.js';
import { getStoredCity } from './aqiApi.js';

const CHAT_REQUEST_TIMEOUT_MS = 28000;
const DEFAULT_FALLBACK_CITY_AQI = 165;
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;

/**
 * Sends a chat message to /api/chat with dual rate limits, Firebase token auth, and smart offline core fallback.
 * @param {object} params
 * @param {string} params.message - User prompt text
 * @param {Array<object>} [params.history=[]] - Conversation history
 * @param {object} [params.user] - Optional user object
 * @param {object} [params.aqiData] - Current atmospheric AQI data
 * @param {object} [params.profile] - Household health profile
 * @param {object} [params.selectedCity] - Active city object
 * @returns {Promise<object>}
 */
export async function sendChatMessage({
  message,
  history = [],
  user,
  aqiData,
  profile,
  selectedCity
}) {
  try {
    let idToken = null;
    const activeUser =
      user && typeof user.getIdToken === 'function' ? user : auth && auth.currentUser;
    if (activeUser && typeof activeUser.getIdToken === 'function') {
      try {
        idToken = await activeUser.getIdToken();
      } catch (_err) {
        // Token retrieval failure defaults to anonymous rate limit
      }
    }

    const headers = { 'Content-Type': 'application/json' };
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    const payload = JSON.stringify({
      message,
      history,
      user,
      aqiData,
      profile,
      selectedCity: selectedCity || getStoredCity()
    });

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: payload,
      signal: AbortSignal.timeout(CHAT_REQUEST_TIMEOUT_MS)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errObj = new Error(
        errorData.message || errorData.error || `Chat service unavailable (Status ${res.status})`
      );
      if (res.status === HTTP_STATUS_TOO_MANY_REQUESTS) {
        errObj.isRateLimited = true;
      }
      throw errObj;
    }

    const data = await res.json();
    if (data && data.reply && aqiData?.aqi != null) {
      data.reply = validateAndAlignReplyWithAqi(data.reply, aqiData.aqi, aqiData.category);
      if (data.memo) {
        data.memo = data.reply;
      }
      if (data.cityData) {
        const cName = (data.cityData.name || '').toLowerCase();
        const aName = (aqiData.city || '').toLowerCase();
        if (cName.includes(aName) || aName.includes(cName)) {
          data.cityData.aqi = aqiData.aqi;
          if (aqiData.category) data.cityData.category = aqiData.category;
          if (aqiData.isMock != null) {
            data.cityData.isMock = Boolean(aqiData.isMock);
            data.isSample = Boolean(aqiData.isMock);
          }
        }
      }
    }
    return data;
  } catch (err) {
    if (err.isRateLimited) {
      return {
        reply: `⚠️ **Rate Limit Notice**\n\n${err.message}\n\n> 💡 *Signed-in users enjoy a higher limit (60 messages/hour). Please sign in or try again shortly.*`,
        extractedFacts: [],
        provider: FOGGY_PROVIDER_LABELS.RATE_LIMITER
      };
    }
    console.warn('Chat request failed, providing supportive client fallback:', err.message);
    const reason =
      err.name === 'TimeoutError' || err.message?.toLowerCase().includes('timeout')
        ? 'AI temporarily unavailable: timeout'
        : err.message?.toLowerCase().includes('network') ||
            err.message?.toLowerCase().includes('failed to fetch')
          ? 'AI temporarily unavailable: network error'
          : err.message || 'AI temporarily unavailable';

    const isFirst =
      !history || history.filter((m) => m.sender === 'user' || m.role === 'user').length <= 1;
    const greetingPrefix = isFirst
      ? `Hello ${user?.displayName || user?.name ? (user.displayName || user.name).split(' ')[0] : 'friend'}! I'm **Foggy**, your air quality guide.\n\n`
      : '';

    const cityAqi = aqiData?.aqi || DEFAULT_FALLBACK_CITY_AQI;
    const cat = getAQICategory(cityAqi);
    const detectedIntent = classifyIntent(message, history);

    const fallback = generateSmartFallbackResponse({
      message,
      cityReports: [
        {
          city: aqiData?.city || 'Kolkata',
          current: {
            aqi: cityAqi,
            category: cat.label,
            dominant: aqiData?.dominantPollutant || 'PM2.5',
            time: aqiData?.updatedAt || '14:00 IST'
          },
          bestHour24h: { hour: '14:00', aqi: Math.round(cityAqi * 0.7) },
          worstHour24h: { hour: '07:00', aqi: Math.round(cityAqi * 1.3) }
        }
      ],
      profile,
      intentType: detectedIntent
    });

    let reply = `${greetingPrefix}${fallback.reply}`;
    if (!reply.includes('Safeguards')) {
      reply += `\n\n### 🛡️ Recommended Safeguards:\n* **Indoor Air:** Keep windows sealed during peak smog and run damp-mopping.\n* **Outdoor Transit:** Wear a certified N95 respirator during high-traffic hours.`;
    }
    reply = validateAndAlignReplyWithAqi(reply, cityAqi, cat.label);

    return {
      reply,
      extractedFacts: fallback.extractedFacts || [],
      provider: FOGGY_PROVIDER_LABELS.BUILT_IN_GUIDANCE,
      model: FOGGY_FALLBACK_MODEL,
      isLive: false,
      reason,
      cityData: {
        name: aqiData?.city || 'Kolkata',
        aqi: cityAqi,
        category: cat.label,
        isMock: Boolean(aqiData?.isMock)
      }
    };
  }
}
