// functions/api/personalize.js
// Cloudflare Pages Function for Foggy Family Personalization Endpoint (/api/personalize)
// Dedicated handler for tailoring actionable air quality precautions to household members.
// Supports both direct member profile objects and chat-style prompts.

import {
  onRequestPost as handleChatPost,
  onRequestOptions as handleChatOptions,
  onRequest as handleChatRequest
} from './chat.js';

export async function onRequestPost(context) {
  return handleChatPost(context);
}

export async function onRequestOptions(context) {
  return handleChatOptions(context);
}

export async function onRequest(context) {
  return handleChatRequest(context);
}
