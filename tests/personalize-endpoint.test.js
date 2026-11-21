// tests/personalize-endpoint.test.js
// Unit and integration tests for /api/personalize and /api/chat endpoints
// Validates:
// 1. Valid request with member profile and AQI context
// 2. Valid request with long prompt (> 500 chars)
// 3. Invalid request handling (empty message/member, malformed payload)
// 4. Missing / anonymous token handling (IP fallback)
// 5. Rate limit enforcement (429 RATE_LIMITED)
// 6. Gemini failure / safety block fallback
// 7. Express adapter parity

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  onRequestPost as handleChatPost,
  onRequestOptions as _handleChatOptions
} from '../functions/api/chat.js';
import {
  onRequestPost as handlePersonalizePost,
  onRequestOptions as handlePersonalizeOptions,
  onRequest as handlePersonalizeRequest
} from '../functions/api/personalize.js';
import personalizeRouter from '../server/routes/personalize.js';

describe('Personalization & Chat Endpoints (/api/personalize & /api/chat)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('handles OPTIONS preflight with appropriate CORS headers', async () => {
    const req = new Request('https://foggy.pages.dev/api/personalize', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://foggy.pages.dev',
        'Access-Control-Request-Method': 'POST'
      }
    });

    const res = await handlePersonalizeOptions({ request: req, env: {} });
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://foggy.pages.dev');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');

    const res2 = await handlePersonalizeRequest({ request: req, env: {} });
    expect(res2.status).toBe(204);
  });

  it('processes a valid request with member profile and AQI context (returns 200 + reply + memo)', async () => {
    const payload = {
      member: {
        name: 'Beta',
        relationship: 'Son',
        age: 7,
        city: 'Kolkata',
        state: 'West Bengal',
        conditions: ['Asthma (uses a salbutamol inhaler)'],
        sensitivity: 'High',
        commute: ['School Bus'],
        lifestyle: ['Cricket Outdoors'],
        notes: 'Needs indoor alternative during high smog days'
      },
      aqiData: {
        aqi: 220,
        category: 'Poor',
        city: 'Kolkata'
      },
      city: 'Kolkata'
    };

    const req = new Request('https://foggy.pages.dev/api/personalize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-connecting-ip': '192.168.1.100'
      },
      body: JSON.stringify(payload)
    });

    const res = await handlePersonalizePost({ request: req, env: {} });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.reply).toBeTruthy();
    expect(json.memo).toBeTruthy();
    expect(json.city).toBe('Kolkata');
  }, 15000);

  it('accepts and sanitizes structured member requests with extended details without returning 400', async () => {
    const longNotes =
      'A'.repeat(600) + ' Special requirements for air purifier filter and inhaler.';
    const payload = {
      member: {
        name: 'Beta',
        relationship: 'Son',
        age: 7,
        city: 'Kolkata',
        conditions: ['Asthma'],
        notes: longNotes
      },
      city: 'Kolkata'
    };

    const req = new Request('https://foggy.pages.dev/api/personalize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-connecting-ip': '192.168.1.101'
      },
      body: JSON.stringify(payload)
    });

    const res = await handlePersonalizePost({ request: req, env: {} });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.reply).toBeTruthy();
  });

  it('rejects invalid request with missing message and missing member profile with 400', async () => {
    const req = new Request('https://foggy.pages.dev/api/personalize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-connecting-ip': '192.168.1.102'
      },
      body: JSON.stringify({ city: 'Kolkata' })
    });

    const res = await handlePersonalizePost({ request: req, env: {} });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe('Bad Request');
    expect(json.code).toBe('INVALID_REQUEST');
  });

  it('handles unauthenticated requests gracefully with IP rate limiting', async () => {
    const req = new Request('https://foggy.pages.dev/api/personalize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-connecting-ip': '192.168.1.103'
      },
      body: JSON.stringify({
        message: 'How is the air in Kolkata today?'
      })
    });

    const res = await handlePersonalizePost({ request: req, env: {} });
    expect(res.status).toBe(200);
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
  });

  it('handles demo user tokens as authenticated with higher limits', async () => {
    const req = new Request('https://foggy.pages.dev/api/personalize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer demo_token',
        'cf-connecting-ip': '192.168.1.104'
      },
      body: JSON.stringify({
        message: 'Personalize care for Beta.'
      })
    });

    const res = await handlePersonalizePost({ request: req, env: {} });
    expect(res.status).toBe(200);
    expect(res.headers.get('X-RateLimit-Limit')).toBe('60');
  });

  it('enforces rate limit and returns 429 with RATE_LIMITED code when limit exceeded', async () => {
    const testIp = '10.0.99.1';
    let lastRes;

    // Send 11 anonymous requests (max limit is 10)
    for (let i = 0; i < 12; i++) {
      const req = new Request('https://foggy.pages.dev/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': testIp
        },
        body: JSON.stringify({ message: `Test ping ${i}` })
      });
      lastRes = await handleChatPost({ request: req, env: {} });
      if (lastRes.status === 429) break;
    }

    expect(lastRes.status).toBe(429);
    const json = await lastRes.json();
    expect(json.code).toBe('RATE_LIMITED');
    expect(json.message).toContain('Rate limit exceeded');
  }, 20000);

  it('falls back gracefully to intelligent deterministic core when Gemini fails', async () => {
    // Mock fetch to simulate Gemini API 500 failure
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url, opts) => {
      if (typeof url === 'string' && url.includes('generativelanguage.googleapis.com')) {
        return new Response(JSON.stringify({ error: { message: 'Internal Gemini Error' } }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return originalFetch(url, opts);
    });

    const req = new Request('https://foggy.pages.dev/api/personalize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-connecting-ip': '192.168.1.105'
      },
      body: JSON.stringify({
        message: 'Care memo for Beta with asthma',
        city: 'Kolkata'
      })
    });

    const res = await handlePersonalizePost({
      request: req,
      env: { GEMINI_API_KEY: 'test_mock_gemini_api_key_valid_len' }
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.isLive).toBe(false);
    expect(json.model).toBe('foggy-atmospheric-core');
    expect(json.reply).toBeTruthy();
    expect(json.memo).toBeTruthy();

    globalThis.fetch = originalFetch;
  });

  it('shares logic with local Express router adapter', async () => {
    expect(personalizeRouter).toBeDefined();
    // Test invoking the express router handler stack
    const postRoute = personalizeRouter.stack.find(
      (layer) => layer.route && layer.route.methods.post
    );
    expect(postRoute).toBeDefined();

    const mockReq = {
      method: 'POST',
      originalUrl: '/api/personalize',
      headers: {
        'content-type': 'application/json',
        'cf-connecting-ip': '127.0.0.1'
      },
      body: {
        message: 'Personalize for Dadi in Kolkata',
        city: 'Kolkata'
      }
    };

    let statusCode = 200;
    const responseHeaders = {};
    let responseBody = '';

    const mockRes = {
      status: vi.fn((code) => {
        statusCode = code;
        return mockRes;
      }),
      setHeader: vi.fn((k, v) => {
        responseHeaders[k] = v;
      }),
      send: vi.fn((text) => {
        responseBody = text;
      }),
      json: vi.fn((data) => {
        responseBody = JSON.stringify(data);
      })
    };

    const handler = postRoute.route.stack[0].handle;
    await handler(mockReq, mockRes);

    expect(statusCode).toBe(200);
    expect(responseBody).toBeTruthy();
    const parsed = JSON.parse(responseBody);
    expect(parsed.reply).toBeTruthy();
  });
});
