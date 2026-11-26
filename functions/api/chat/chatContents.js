/**
 * @fileoverview Formats and sanitizes multi-turn message history for Gemini API.
 */

import { MAX_HISTORY_TURNS } from '../../../shared/chat/rateLimiter.js';

const MAX_HISTORY_TEXT_LENGTH = 1000;

/**
 * Constructs sanitized multi-turn contents for Gemini API:
 * 1. Multi-turn talk cannot start with a model turn.
 * 2. Strictly alternates user and model turns (merging consecutive same-role turns).
 * 3. Appends current turn user payload.
 *
 * @param {Array<object>} history - Conversation history.
 * @param {string} currentPayload - Current user turn payload.
 * @returns {Array<{ role: 'user' | 'model', parts: Array<{ text: string }> }>}
 */
export function buildGeminiContents(history = [], currentPayload = '') {
  const turns = [];
  if (Array.isArray(history)) {
    const recent = history.slice(-MAX_HISTORY_TURNS);
    for (const item of recent) {
      if (item && typeof item === 'object') {
        let textContent = (item.text || item.content || item.parts?.[0]?.text || '')
          .toString()
          .slice(0, MAX_HISTORY_TEXT_LENGTH);
        if (textContent.includes('USER QUESTION:')) {
          textContent = textContent.split('USER QUESTION:').pop().trim();
        }
        textContent = textContent.trim();
        if (textContent) {
          const role = item.role === 'user' || item.sender === 'user' ? 'user' : 'model';
          turns.push({ role, text: textContent });
        }
      }
    }
  }

  // 1. Multi-turn talk cannot start with model turn: drop any leading model turns
  while (turns.length > 0 && turns[0].role === 'model') {
    turns.shift();
  }

  // 2. Append current user turn
  if (currentPayload && currentPayload.trim()) {
    turns.push({ role: 'user', text: currentPayload.trim() });
  }

  // 3. Strictly alternate: collapse consecutive turns of identical role
  const formatted = [];
  for (const turn of turns) {
    if (formatted.length > 0 && formatted[formatted.length - 1].role === turn.role) {
      formatted[formatted.length - 1].parts[0].text += `\n\n${turn.text}`;
    } else {
      formatted.push({
        role: turn.role,
        parts: [{ text: turn.text }]
      });
    }
  }

  // 4. Guarantee non-empty array starting with user role
  if (formatted.length === 0) {
    formatted.push({ role: 'user', parts: [{ text: currentPayload || 'Hello' }] });
  } else if (formatted[0].role !== 'user') {
    formatted[0].role = 'user';
  }

  return formatted;
}

/**
 * Sanitizes raw history entries into role/parts objects for internal pipeline handling.
 * @param {Array<object>} history
 * @returns {Array<{ role: 'user' | 'model', parts: Array<{ text: string }> }>}
 */
export function sanitizeChatHistory(history = []) {
  const sanitized = [];
  if (Array.isArray(history)) {
    const recent = history.slice(-MAX_HISTORY_TURNS);
    for (const item of recent) {
      if (item && typeof item === 'object') {
        let textContent = (item.text || item.content || '')
          .toString()
          .slice(0, MAX_HISTORY_TEXT_LENGTH);
        if (textContent.includes('USER QUESTION:')) {
          textContent = textContent.split('USER QUESTION:').pop().trim();
        }
        if (textContent.trim()) {
          sanitized.push({
            role: item.role === 'user' || item.sender === 'user' ? 'user' : 'model',
            parts: [{ text: textContent }]
          });
        }
      }
    }
  }
  return sanitized;
}
