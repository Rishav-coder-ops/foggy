// tests/verify-firebase-token.test.js
import { describe, it, expect } from 'vitest';
import { verifyFirebaseIdToken } from '../functions/api/verifyFirebaseToken.js';

describe('tests/verify-firebase-token.test.js - Firebase Token Cryptographic & Claims Validation', () => {
  it('returns invalid on missing or non-string token', async () => {
    expect((await verifyFirebaseIdToken(null)).valid).toBe(false);
    expect((await verifyFirebaseIdToken('')).valid).toBe(false);
    expect((await verifyFirebaseIdToken(12345)).valid).toBe(false);
  });

  it('returns invalid on malformed token structure (not 3 dot-separated parts)', async () => {
    expect((await verifyFirebaseIdToken('onlyonepart')).valid).toBe(false);
    expect((await verifyFirebaseIdToken('part1.part2')).valid).toBe(false);
  });

  it('returns invalid on unparseable header or payload', async () => {
    expect((await verifyFirebaseIdToken('notbase64.notbase64.signature')).valid).toBe(false);
  });

  it('returns invalid if token is expired', async () => {
    const expiredPayload = {
      iss: 'https://securetoken.google.com/foggy-air',
      aud: 'foggy-air',
      sub: 'user_123',
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour in the past
    };

    const header = btoa(JSON.stringify({ alg: 'RS256', kid: 'fake_kid' }));
    const payload = btoa(JSON.stringify(expiredPayload));
    const token = `${header}.${payload}.fakesig`;

    const res = await verifyFirebaseIdToken(token, 'foggy-air');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Token expired');
  });

  it('returns invalid if issuer does not match project', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const wrongIssuerPayload = {
      iss: 'https://securetoken.google.com/wrong-project',
      aud: 'foggy-air',
      sub: 'user_123',
      iat: nowSec - 60,
      exp: nowSec + 3600
    };

    const header = btoa(JSON.stringify({ alg: 'RS256', kid: 'fake_kid' }));
    const payload = btoa(JSON.stringify(wrongIssuerPayload));
    const token = `${header}.${payload}.fakesig`;

    const res = await verifyFirebaseIdToken(token, 'foggy-air');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Issuer mismatch');
  });

  it('returns invalid if audience does not match project', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const wrongAudPayload = {
      iss: 'https://securetoken.google.com/foggy-air',
      aud: 'wrong-audience',
      sub: 'user_123',
      iat: nowSec - 60,
      exp: nowSec + 3600
    };

    const header = btoa(JSON.stringify({ alg: 'RS256', kid: 'fake_kid' }));
    const payload = btoa(JSON.stringify(wrongAudPayload));
    const token = `${header}.${payload}.fakesig`;

    const res = await verifyFirebaseIdToken(token, 'foggy-air');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Audience mismatch');
  });

  it('returns invalid if sub claim is missing or empty', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const missingSubPayload = {
      iss: 'https://securetoken.google.com/foggy-air',
      aud: 'foggy-air',
      sub: '',
      iat: nowSec - 60,
      exp: nowSec + 3600
    };

    const header = btoa(JSON.stringify({ alg: 'RS256', kid: 'fake_kid' }));
    const payload = btoa(JSON.stringify(missingSubPayload));
    const token = `${header}.${payload}.fakesig`;

    const res = await verifyFirebaseIdToken(token, 'foggy-air');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Invalid user ID');
  });
});
