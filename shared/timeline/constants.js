// shared/timeline/constants.js
/**
 * @fileoverview Indian Metros, city aliases, and caching/rate-limiting constants for AQI timeline.
 */

import { getCorsHeaders } from '../cors.js';

export { getCorsHeaders };

export const RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const MAX_REQUESTS_PER_WINDOW = 60;
export const TIMELINE_CACHE_TTL_MS = 15 * 60 * 1000;

export const timelineCache = new Map();
const ipRateLimitMap = new Map();

export function getTimelineCacheKey(lat, lon) {
  return `timeline_${Number(lat).toFixed(2)}_${Number(lon).toFixed(2)}`;
}

export function checkRateLimit(clientIp) {
  const now = Date.now();
  const entry = ipRateLimitMap.get(clientIp);
  if (!entry || now - entry.startTime > RATE_LIMIT_WINDOW_MS) {
    ipRateLimitMap.set(clientIp, { count: 1, startTime: now });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }
  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - entry.count };
}

export const INDIAN_METROS = [
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639, country: 'India', admin1: 'West Bengal' },
  { name: 'Delhi', lat: 28.6139, lon: 77.209, country: 'India', admin1: 'Delhi' },
  { name: 'Mumbai', lat: 19.076, lon: 72.8777, country: 'India', admin1: 'Maharashtra' },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707, country: 'India', admin1: 'Tamil Nadu' },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, country: 'India', admin1: 'Karnataka' },
  { name: 'Hyderabad', lat: 17.385, lon: 78.4867, country: 'India', admin1: 'Telangana' },
  { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714, country: 'India', admin1: 'Gujarat' },
  { name: 'Pune', lat: 18.5204, lon: 73.8567, country: 'India', admin1: 'Maharashtra' }
];

export const INDIAN_CITY_ALIASES = {
  delhi: 'Delhi',
  'new delhi': 'Delhi',
  dehli: 'Delhi',
  dilli: 'Delhi',
  ncr: 'Delhi',
  'delhi-ncr': 'Delhi',
  'delhi ncr': 'Delhi',
  'connaught place': 'Delhi',
  rohini: 'Delhi',
  dwarka: 'Delhi',
  saket: 'Delhi',
  'karol bagh': 'Delhi',
  'hauz khas': 'Delhi',
  'chandni chowk': 'Delhi',
  'anand vihar': 'Delhi',
  ito: 'Delhi',
  'punjabi bagh': 'Delhi',
  'rk puram': 'Delhi',
  'lodhi road': 'Delhi',
  'nehru place': 'Delhi',
  noida: 'Noida',
  'greater noida': 'Noida',
  gurgaon: 'Gurugram',
  gurugram: 'Gurugram',
  faridabad: 'Faridabad',
  ghaziabad: 'Ghaziabad',
  mumbai: 'Mumbai',
  bombay: 'Mumbai',
  bambai: 'Mumbai',
  bandra: 'Mumbai',
  andheri: 'Mumbai',
  juhu: 'Mumbai',
  colaba: 'Mumbai',
  borivali: 'Mumbai',
  dadar: 'Mumbai',
  thane: 'Thane',
  'navi mumbai': 'Navi Mumbai',
  pune: 'Pune',
  poona: 'Pune',
  nagpur: 'Nagpur',
  nashik: 'Nashik',
  kolkata: 'Kolkata',
  calcutta: 'Kolkata',
  kolkatta: 'Kolkata',
  howrah: 'Howrah',
  'salt lake': 'Kolkata',
  'salt lake city': 'Kolkata',
  newtown: 'Kolkata',
  'new town': 'Kolkata',
  jadavpur: 'Kolkata',
  'park street': 'Kolkata',
  durgapur: 'Durgapur',
  asansol: 'Asansol',
  siliguri: 'Siliguri',
  bengaluru: 'Bengaluru',
  bangalore: 'Bengaluru',
  blr: 'Bengaluru',
  whitefield: 'Bengaluru',
  indiranagar: 'Bengaluru',
  koramangala: 'Bengaluru',
  'electronic city': 'Bengaluru',
  'hsr layout': 'Bengaluru',
  jayanagar: 'Bengaluru',
  mysore: 'Mysuru',
  mysuru: 'Mysuru',
  hyderabad: 'Hyderabad',
  secunderabad: 'Hyderabad',
  cyberabad: 'Hyderabad',
  gachibowli: 'Hyderabad',
  hitech: 'Hyderabad',
  madhapur: 'Hyderabad',
  warangal: 'Warangal',
  chennai: 'Chennai',
  madras: 'Chennai',
  coimbatore: 'Coimbatore',
  madurai: 'Madurai',
  ahmedabad: 'Ahmedabad',
  amdavad: 'Ahmedabad',
  surat: 'Surat',
  vadodara: 'Vadodara',
  baroda: 'Vadodara',
  rajkot: 'Rajkot',
  lucknow: 'Lucknow',
  kanpur: 'Kanpur',
  varanasi: 'Varanasi',
  banaras: 'Varanasi',
  kashi: 'Varanasi',
  agra: 'Agra',
  prayagraj: 'Prayagraj',
  allahabad: 'Prayagraj',
  patna: 'Patna',
  gaya: 'Gaya',
  jaipur: 'Jaipur',
  jodhpur: 'Jodhpur',
  kota: 'Kota',
  bhopal: 'Bhopal',
  indore: 'Indore',
  chandigarh: 'Chandigarh',
  ludhiana: 'Ludhiana',
  amritsar: 'Amritsar',
  dehradun: 'Dehradun',
  ranchi: 'Ranchi',
  jamshedpur: 'Jamshedpur',
  bhubaneswar: 'Bhubaneswar',
  cuttack: 'Cuttack',
  raipur: 'Raipur',
  guwahati: 'Guwahati',
  thiruvananthapuram: 'Thiruvananthapuram',
  trivandrum: 'Thiruvananthapuram',
  kochi: 'Kochi',
  cochin: 'Kochi',
  kozhikode: 'Kozhikode',
  calicut: 'Kozhikode',
  visakhapatnam: 'Visakhapatnam',
  vizag: 'Visakhapatnam',
  vijayawada: 'Vijayawada'
};
