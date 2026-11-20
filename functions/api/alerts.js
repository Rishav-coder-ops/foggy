// functions/api/alerts.js
// Official Government of India Statutory Portals Directory
// Direct links to statutory bodies (CPCB, CAQM, IMD, NDMA SACHET) for live alerts.

const OFFICIAL_PORTALS = [
  {
    id: 'cpcb',
    source: 'Central Pollution Control Board (CPCB)',
    title: 'National Air Quality Index (NAQI) Bulletins',
    description: 'Statutory authority under MoEFCC governing National Ambient Air Quality Standards and daily 4:00 PM NAQI bulletins across Indian cities.',
    link: 'https://cpcb.nic.in',
    badge: 'Official CPCB',
    status: 'Check the official page for live alerts'
  },
  {
    id: 'caqm',
    source: 'Commission for Air Quality Management (CAQM)',
    title: 'Graded Response Action Plan (GRAP) Enforcement Orders',
    description: 'Statutory body coordinating air quality measures and emergency GRAP Stage I–IV enforcement directives across NCR and adjoining areas.',
    link: 'https://caqm.nic.in',
    badge: 'Official CAQM',
    status: 'Check the official page for live alerts'
  },
  {
    id: 'imd',
    source: 'India Meteorological Department (IMD)',
    title: 'National Weather & Seasonal Dense Fog Advisories',
    description: 'National meteorological agency publishing nocturnal radiation fog forecasts and atmospheric inversion warnings.',
    link: 'https://mausam.imd.gov.in',
    badge: 'Official IMD',
    status: 'Check the official page for live alerts'
  },
  {
    id: 'ndma-sachet',
    source: 'National Disaster Management Authority (NDMA)',
    title: 'SACHET Real-Time Multi-Hazard Warning Portal',
    description: 'Apex statutory disaster agency hosting the nationwide CAP platform for real-time geographic hazard bulletins and public health advisories.',
    link: 'https://sachet.ndma.gov.in',
    badge: 'Official NDMA',
    status: 'Check the official page for live alerts'
  }
];

export async function onRequest() {
  return new Response(JSON.stringify({
    portals: OFFICIAL_PORTALS,
    status: 'Check the official page for live alerts',
    disclaimer: 'Live statutory warnings must be verified directly on official department portals.'
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
