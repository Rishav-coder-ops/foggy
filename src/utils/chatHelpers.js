// src/utils/chatHelpers.js
/**
 * @fileoverview Message formatting, greeting generation, and localStorage persistence for Foggy chat.
 */

import { formatGreetingName } from './nameFormatter';
import {
  GEMINI_PRIMARY_MODEL,
  FOGGY_FALLBACK_MODEL,
  FOGGY_PROVIDER_LABELS
} from '../../shared/constants.js';

/**
 * Builds the personalized initial greeting message based on profile context and connection status.
 */
export function buildInitialGreetingMessage({
  profile,
  user,
  familyMembers = [],
  preferredName = '',
  loadingProfile = false,
  syncBlocked = false
}) {
  const firstName =
    preferredName || profile?.preferredName || formatGreetingName(profile, user) || 'Friend';

  if (loadingProfile) {
    return {
      id: 'msg_initial',
      sender: 'foggy',
      text: `Hello ${firstName}! I'm **Foggy**, your air quality and smog protection companion. 🌫️✨\n\nLoading your household profile and local air quality context...`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isInitial: true
    };
  }

  const hasProfile = Boolean(
    profile && (profile.city || profile.location || profile.latitude != null)
  );
  if (!hasProfile) {
    return {
      id: 'msg_initial',
      sender: 'foggy',
      text:
        `Hello ${firstName}! I'm **Foggy**, your air quality and smog protection companion. 🌫️✨\n\n` +
        `I couldn't load your saved profile and household context${syncBlocked ? ' (cloud sync appears to be blocked by your browser or an ad blocker)' : ''}. ` +
        `Please check your connection or ad blocker settings so I can provide personalized advice without guessing. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isInitial: true
    };
  }

  const count = Array.isArray(familyMembers) ? familyMembers.length : 0;
  const famText = count === 1 ? '1 family member' : `${count} family members`;
  const cityText = profile.city || profile.location || 'your city';

  return {
    id: 'msg_initial',
    sender: 'foggy',
    text:
      `Hello ${firstName}! I'm **Foggy**, your air quality and smog protection companion. 🌫️✨\n\n` +
      `I'm here to give you practical, reassuring, and personalized advice to protect your household from severe winter pollution while lowering emissions.\n\n` +
      `I have your household context in mind (${famText}, location: ${cityText}). How can I help you today?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isInitial: true
  };
}

export function loadSavedChatHistory(userUid) {
  try {
    const saved = localStorage.getItem(`foggy_chat_history_${userUid}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return null;
}

export function findLastCityInMessages(messages) {
  if (!Array.isArray(messages)) return null;
  const lastWithCity = [...messages]
    .reverse()
    .find((m) => m.sender === 'foggy' && m.cityData?.name);
  return lastWithCity?.cityData || null;
}

export function saveChatHistory(userUid, messages) {
  try {
    localStorage.setItem(`foggy_chat_history_${userUid}`, JSON.stringify(messages));
  } catch (err) {
    console.warn('Failed to save chat history:', err);
  }
}

export function clearStoredChatHistory(userUid) {
  try {
    localStorage.removeItem(`foggy_chat_history_${userUid}`);
  } catch {}
}

export function formatUserMessage(text) {
  return {
    id: 'msg_' + Date.now(),
    sender: 'user',
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

export function formatFoggyReply(response) {
  return {
    id: 'msg_f_' + Date.now(),
    sender: 'foggy',
    text: response.reply,
    provider:
      response.provider ||
      (response.isLive
        ? FOGGY_PROVIDER_LABELS.LIVE_GEMINI
        : FOGGY_PROVIDER_LABELS.BUILT_IN_GUIDANCE),
    model: response.model || (response.isLive ? GEMINI_PRIMARY_MODEL : FOGGY_FALLBACK_MODEL),
    isLive: Boolean(response.isLive),
    reason: response.reason || null,
    cityData: response.cityData,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

export function formatErrorReply() {
  return {
    id: 'msg_err_' + Date.now(),
    sender: 'foggy',
    text: 'Foggy had a brief connection hiccup. Please try asking again!',
    provider: FOGGY_PROVIDER_LABELS.BUILT_IN_GUIDANCE,
    model: FOGGY_FALLBACK_MODEL,
    isLive: false,
    reason: 'Connection interrupted',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

export function formatProfileUnavailableReply() {
  return {
    id: 'msg_f_' + Date.now(),
    sender: 'foggy',
    text: "I couldn't load your saved profile and household context to personalize this advice. Please verify that your ad blocker or Brave Shields isn't blocking cloud sync, then tap Retry in the banner above.",
    provider: FOGGY_PROVIDER_LABELS.BUILT_IN_GUIDANCE,
    model: FOGGY_FALLBACK_MODEL,
    isLive: false,
    reason: 'Profile unavailable',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}
