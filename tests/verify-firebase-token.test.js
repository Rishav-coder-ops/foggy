// tests/verify-firebase-token.test.js
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { verifyFirebaseIdToken } from '../functions/api/verifyFirebaseToken.js';

function toBase64Url(objOrStr) {
  const str = typeof objOrStr === 'string' ? objOrStr : JSON.stringify(objOrStr);
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('tests/verify-firebase-token.test.js - Firebase Token Cryptographic & Claims Validation', () => {
  let keyPair;
  let publicJwk;
  let originalFetch;

  beforeAll(async () => {
    // Generate real 2048-bit RSA key pair once for cryptographic testing
    keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['sign', 'verify']
    );

    const exported = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    publicJwk = { ...exported, kid: 'test_key_1', alg: 'RS256', use: 'sig' };
  });

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('jwk/securetoken')) {
        return Promise.resolve(
          new Response(JSON.stringify({ keys: [publicJwk] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        );
      }
      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  async function createSignedToken(
    headerOverrides = {},
    payloadOverrides = {},
    corruptSig = false
  ) {
    const nowSec = Math.floor(Date.now() / 1000);
    const header = {
      alg: 'RS256',
      kid: 'test_key_1',
      ...headerOverrides
    };

    const payload = {
      iss: 'https://securetoken.google.com/foggy-air',
      aud: 'foggy-air',
      sub: 'user_live_882',
      email: 'test@foggy.app',
      name: 'Rishav Nandi',
      iat: nowSec - 10,
      exp: nowSec + 3600,
      ...payloadOverrides
    };

    const encodedHeader = toBase64Url(header);
    const encodedPayload = toBase64Url(payload);
    const dataToSign = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);

    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', keyPair.privateKey, dataToSign);
    let sigBytes = new Uint8Array(signature);
    if (corruptSig) {
      sigBytes = new Uint8Array(sigBytes);
      sigBytes[0] ^= 0xff;
    }

    return `${encodedHeader}.${encodedPayload}.${bytesToBase64Url(sigBytes)}`;
  }

  it('successfully verifies a valid cryptographic token with Google JWKS signature', async () => {
    const validToken = await createSignedToken();
    const result = await verifyFirebaseIdToken(validToken, 'foggy-air');

    expect(result.valid).toBe(true);
    expect(result.uid).toBe('user_live_882');
    expect(result.email).toBe('test@foggy.app');
    expect(result.name).toBe('Rishav Nandi');
  });

  it('rejects token with corrupted signature bytes', async () => {
    const badSigToken = await createSignedToken({}, {}, true);
    const result = await verifyFirebaseIdToken(badSigToken, 'foggy-air');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Token signature verification failed');
  });

  it('rejects unsupported token algorithms such as alg: none or HS256', async () => {
    const noneHeaderToken = `${toBase64Url({ alg: 'none' })}.${toBase64Url({ sub: 'user_1' })}.fakesig`;
    const resNone = await verifyFirebaseIdToken(noneHeaderToken, 'foggy-air');
    expect(resNone.valid).toBe(false);
    expect(resNone.error).toContain('Unsupported token algorithm');

    const hsToken = `${toBase64Url({ alg: 'HS256', kid: 'test_key_1' })}.${toBase64Url({ sub: 'user_1' })}.fakesig`;
    const resHs = await verifyFirebaseIdToken(hsToken, 'foggy-air');
    expect(resHs.valid).toBe(false);
    expect(resHs.error).toContain('Unsupported token algorithm');
  });

  it('returns invalid on missing or non-string token', async () => {
    expect((await verifyFirebaseIdToken(null)).valid).toBe(false);
    expect((await verifyFirebaseIdToken('')).valid).toBe(false);
    expect((await verifyFirebaseIdToken(12345)).valid).toBe(false);
    expect((await verifyFirebaseIdToken(undefined)).valid).toBe(false);
  });

  it('returns invalid on malformed token structure (not 3 dot-separated parts)', async () => {
    expect((await verifyFirebaseIdToken('onlyonepart')).valid).toBe(false);
    expect((await verifyFirebaseIdToken('part1.part2')).valid).toBe(false);
    expect((await verifyFirebaseIdToken('part1.part2.part3.part4')).valid).toBe(false);
  });

  it('returns invalid on unparseable base64 or malformed JSON payload', async () => {
    const res = await verifyFirebaseIdToken('notjson.notjson.fakesig');
    expect(res.valid).toBe(false);
    expect(res.error).toBe('Malformed token payload');
  });

  it('returns invalid if token is expired', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const expiredToken = await createSignedToken(
      {},
      {
        exp: nowSec - 3600,
        iat: nowSec - 7200
      }
    );

    const res = await verifyFirebaseIdToken(expiredToken, 'foggy-air');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Token expired');
  });

  it('returns invalid if token was issued in future beyond 300s clock drift', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const futureToken = await createSignedToken(
      {},
      {
        iat: nowSec + 400
      }
    );

    const res = await verifyFirebaseIdToken(futureToken, 'foggy-air');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Token issued in the future');
  });

  it('accepts token issued in future within 300s clock drift tolerance', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const clockDriftToken = await createSignedToken(
      {},
      {
        iat: nowSec + 60
      }
    );

    const res = await verifyFirebaseIdToken(clockDriftToken, 'foggy-air');
    expect(res.valid).toBe(true);
    expect(res.uid).toBe('user_live_882');
  });

  it('returns invalid if issuer does not match project', async () => {
    const wrongIssuerToken = await createSignedToken(
      {},
      {
        iss: 'https://securetoken.google.com/wrong-project'
      }
    );

    const res = await verifyFirebaseIdToken(wrongIssuerToken, 'foggy-air');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Issuer mismatch');
  });

  it('returns invalid if audience does not match project', async () => {
    const wrongAudToken = await createSignedToken(
      {},
      {
        aud: 'wrong-audience'
      }
    );

    const res = await verifyFirebaseIdToken(wrongAudToken, 'foggy-air');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Audience mismatch');
  });

  it('returns invalid if sub claim is missing or empty', async () => {
    const missingSubToken = await createSignedToken({}, { sub: '   ' });
    const res = await verifyFirebaseIdToken(missingSubToken, 'foggy-air');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Invalid user ID');
  });

  it('returns invalid if kid in token header is unknown in Google JWKS', async () => {
    const unknownKidToken = await createSignedToken({ kid: 'unknown_unregistered_kid' });
    const res = await verifyFirebaseIdToken(unknownKidToken, 'foggy-air');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Unknown key ID in token header');
  });

  it('handles Google JWKS upstream failure gracefully', async () => {
    globalThis.fetch = vi
      .fn()
      .mockImplementation(() => Promise.resolve(new Response('Internal Error', { status: 500 })));

    const token = await createSignedToken({ kid: 'new_fresh_kid' });
    const res = await verifyFirebaseIdToken(token, 'foggy-air');
    expect(res.valid).toBe(false);
    expect(res.error).toBeDefined();
  });
});
