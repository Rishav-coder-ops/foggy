// tests/headers-and-csp.test.js
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('tests/headers-and-csp.test.js - COOP, COEP, and CSP Security Headers Validation', () => {
  const headersFilePath = path.resolve(process.cwd(), 'public/_headers');
  const headersContent = fs.readFileSync(headersFilePath, 'utf-8');

  // Parse headers from Cloudflare _headers file format
  const parsedHeaders = {};
  const lines = headersContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('/*')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0) {
      const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
      const val = trimmed.slice(colonIdx + 1).trim();
      parsedHeaders[key] = val;
    }
  }

  it('configures Cross-Origin-Opener-Policy as same-origin-allow-popups for Firebase Google Sign-in popup', () => {
    expect(parsedHeaders['cross-origin-opener-policy']).toBe('same-origin-allow-popups');
  });

  it('does not configure Cross-Origin-Embedder-Policy as require-corp (prevents breaking Google popup & Firebase)', () => {
    const coep = parsedHeaders['cross-origin-embedder-policy'];
    expect(coep).not.toBe('require-corp');
  });

  it('preserves essential security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)', () => {
    expect(parsedHeaders['x-content-type-options']).toBe('nosniff');
    expect(parsedHeaders['x-frame-options']).toBe('DENY');
    expect(parsedHeaders['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(parsedHeaders['permissions-policy']).toContain('geolocation=(self)');
  });

  describe('Content-Security-Policy (CSP) Directives Validation', () => {
    const csp = parsedHeaders['content-security-policy'] || '';

    it('CSP directive exists and is non-empty', () => {
      expect(csp.length).toBeGreaterThan(0);
    });

    it('allows Firebase Auth hosts in script-src, frame-src, and connect-src', () => {
      expect(csp).toContain('https://apis.google.com');
      expect(csp).toContain('https://accounts.google.com');
      expect(csp).toContain('https://*.firebaseapp.com');
      expect(csp).toContain('https://identitytoolkit.googleapis.com');
      expect(csp).toContain('https://securetoken.googleapis.com');
    });

    it('allows Google popup and profile pictures in img-src', () => {
      expect(csp).toContain('https://*.googleusercontent.com');
      expect(csp).toContain('https://lh3.googleusercontent.com');
    });

    it('allows Firestore database communication in connect-src', () => {
      expect(csp).toContain('https://firestore.googleapis.com');
      expect(csp).toContain('https://*.googleapis.com');
      expect(csp).toContain('https://*.firebaseio.com');
    });

    it('allows Open-Meteo atmospheric and geocoding APIs', () => {
      expect(csp).toContain('https://air-quality-api.open-meteo.com');
      expect(csp).toContain('https://geocoding-api.open-meteo.com');
      expect(csp).toContain('https://*.open-meteo.com');
    });

    it('allows Google Fonts in style-src and font-src', () => {
      expect(csp).toContain('https://fonts.googleapis.com');
      expect(csp).toContain('https://fonts.gstatic.com');
    });
  });
});
