// functions/api/verifyFirebaseToken.js
// Cryptographic verification of Firebase ID tokens using standard Web Crypto API.
// Validates signature (RS256) against Google's public JWKs, audience, issuer, and expiration.
// Compatible with both Cloudflare Workers / Pages Functions and Node.js 18+.

let jwksCache = { keys: null, expiresAt: 0 };

async function getGoogleJwks() {
  const now = Date.now();
  if (jwksCache.keys && jwksCache.expiresAt > now) {
    return jwksCache.keys;
  }

  try {
    const res = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) throw new Error(`Google JWKS responded with HTTP ${res.status}`);
    const data = await res.json();
    jwksCache = {
      keys: Array.isArray(data.keys) ? data.keys : [],
      expiresAt: now + 3600 * 1000 // Cache for 1 hour
    };
    return jwksCache.keys;
  } catch (err) {
    console.warn('Failed to refresh Google JWKS for Firebase verification:', err.message);
    if (jwksCache.keys) return jwksCache.keys;
    throw err;
  }
}

function base64UrlToBytes(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function verifyFirebaseIdToken(token, projectId = 'foggy-air') {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token missing or invalid' };
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Malformed token structure' };
  }

  let header, payload;
  try {
    header = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[0])));
    payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[1])));
  } catch {
    return { valid: false, error: 'Malformed token payload' };
  }

  if (header.alg !== 'RS256' || !header.kid) {
    return { valid: false, error: 'Unsupported token algorithm' };
  }

  const nowSec = Math.floor(Date.now() / 1000);

  // Check expiration
  if (typeof payload.exp !== 'number' || payload.exp < nowSec) {
    return { valid: false, error: 'Token expired' };
  }

  // Check issued at (allow 5-minute clock drift)
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) {
    return { valid: false, error: 'Token issued in the future' };
  }

  // Check audience and issuer
  if (payload.aud !== projectId) {
    return { valid: false, error: 'Audience mismatch' };
  }
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    return { valid: false, error: 'Issuer mismatch' };
  }

  // Check subject (UID)
  if (typeof payload.sub !== 'string' || !payload.sub.trim()) {
    return { valid: false, error: 'Invalid user ID' };
  }

  // Verify cryptographic signature against Google's public JWK
  try {
    const keys = await getGoogleJwks();
    const matchingKey = keys.find((k) => k.kid === header.kid);
    if (!matchingKey) {
      return { valid: false, error: 'Unknown key ID in token header' };
    }

    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      matchingKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const dataBytes = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signatureBytes = base64UrlToBytes(parts[2]);

    const isSigValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      signatureBytes,
      dataBytes
    );

    if (!isSigValid) {
      return { valid: false, error: 'Token signature verification failed' };
    }

    return {
      valid: true,
      uid: payload.sub,
      email: payload.email || '',
      name: payload.name || ''
    };
  } catch (err) {
    return { valid: false, error: 'Cryptographic verification error' };
  }
}
