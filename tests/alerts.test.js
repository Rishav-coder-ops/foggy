// tests/alerts.test.js
import { describe, it, expect } from 'vitest';
import { onRequest } from '../functions/api/alerts.js';

describe('tests/alerts.test.js - Official Statutory Portals Directory Endpoint', () => {
  it('returns verified portals including CPCB, CAQM, IMD, and NDMA SACHET', async () => {
    const res = await onRequest();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data.portals)).toBe(true);
    expect(data.portals.length).toBe(4);

    const portalIds = data.portals.map((p) => p.id);
    expect(portalIds).toContain('cpcb');
    expect(portalIds).toContain('caqm');
    expect(portalIds).toContain('imd');
    expect(portalIds).toContain('ndma-sachet');
  });

  it('sets long cache headers for static statutory directory', async () => {
    const res = await onRequest();
    expect(res.headers.get('Cache-Control')).toContain('max-age=86400');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
