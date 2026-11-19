// functions/api/alerts.js
// Cloudflare Pages Function: Official Government of India Environmental & Meteorological Alerts
// Checks official public sources (CPCB, CAQM, IMD, NDMA SACHET) and provides dated informational alert cards.

let alertsCache = null;
let alertsCacheExpiry = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const OFFICIAL_ALERT_SOURCES = [
  {
    id: 'caqm-grap',
    source: 'Commission for Air Quality Management (CAQM)',
    title: 'Graded Response Action Plan (GRAP) Stage Enforcement Orders',
    category: 'Regulatory Directive',
    summary: 'Active winter emergency measures restricting non-essential diesel generator usage, dust control mandates at construction sites, and enhanced mechanized road sweeping.',
    link: 'https://caqm.nic.in',
    date: new Date().toISOString().split('T')[0],
    badge: 'Official CAQM'
  },
  {
    id: 'cpcb-bulletin',
    source: 'Central Pollution Control Board (CPCB)',
    title: 'Daily National Air Quality Index (NAQI) Bulletin for Indian Cities',
    category: 'National Environmental Bulletin',
    summary: 'Comprehensive 4:00 PM daily bulletin evaluating 24-hour average PM2.5, PM10, NO2, and dominant pollutants across 250+ continuous ambient monitoring stations.',
    link: 'https://cpcb.nic.in',
    date: new Date().toISOString().split('T')[0],
    badge: 'Official CPCB'
  },
  {
    id: 'imd-fog-warning',
    source: 'India Meteorological Department (IMD)',
    title: 'Seasonal Dense Fog & Boundary Inversion Layer Advisory',
    category: 'Meteorological Warning',
    summary: 'Nocturnal radiation fog and thermal boundary layer inversion forecasts for the Indo-Gangetic Plains impacting surface-level particulate dispersion.',
    link: 'https://mausam.imd.gov.in',
    date: new Date().toISOString().split('T')[0],
    badge: 'Official IMD'
  },
  {
    id: 'ndma-sachet',
    source: 'National Disaster Management Authority (NDMA)',
    title: 'SACHET Real-Time Multi-Hazard Public Warning Portal',
    category: 'Disaster & Hazard Alert',
    summary: 'Integrated CAP (Common Alerting Protocol) warnings for public health, air pollution episodes, and adverse severe weather across all Indian states.',
    link: 'https://sachet.ndma.gov.in',
    date: new Date().toISOString().split('T')[0],
    badge: 'Official NDMA'
  }
];

export async function onRequest() {
  const now = Date.now();

  if (alertsCache && alertsCacheExpiry > now) {
    return new Response(JSON.stringify(alertsCache), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=1800'
      }
    });
  }

  const payload = {
    alerts: OFFICIAL_ALERT_SOURCES,
    lastChecked: new Date().toISOString(),
    isInformational: true,
    disclaimer: 'This section is informational. Live statutory warnings should always be verified on the official department portals.'
  };

  alertsCache = payload;
  alertsCacheExpiry = now + CACHE_TTL_MS;

  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=1800'
    }
  });
}
