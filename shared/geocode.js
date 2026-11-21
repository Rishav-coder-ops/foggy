// shared/geocode.js
/**
 * @fileoverview Shared location matching, Indian state/city alias resolution,
 * and resilient fallback cities.
 */

export const STATE_ALIASES = Object.freeze({
  orissa: 'odisha',
  odisha: 'odisha',
  pondicherry: 'puducherry',
  puducherry: 'puducherry',
  delhi: 'delhi',
  'nct of delhi': 'delhi',
  'national capital territory of delhi': 'delhi',
  'new delhi': 'delhi',
  uttaranchal: 'uttarakhand',
  uttarakhand: 'uttarakhand',
  'jammu & kashmir': 'jammu and kashmir',
  'jammu and kashmir': 'jammu and kashmir',
  'andaman & nicobar': 'andaman and nicobar islands',
  'andaman and nicobar': 'andaman and nicobar islands',
  'andaman and nicobar islands': 'andaman and nicobar islands',
  telengana: 'telangana',
  telangana: 'telangana',
  chhattisgarh: 'chhattisgarh',
  chattisgarh: 'chhattisgarh',
  ladakh: 'ladakh',
  'dadra and nagar haveli and daman and diu': 'dadra and nagar haveli and daman and diu',
  'daman and diu': 'dadra and nagar haveli and daman and diu',
  'dadra and nagar haveli': 'dadra and nagar haveli and daman and diu',
  wb: 'west bengal',
  'west bengal': 'west bengal',
  up: 'uttar pradesh',
  'uttar pradesh': 'uttar pradesh',
  mp: 'madhya pradesh',
  'madhya pradesh': 'madhya pradesh',
  ap: 'andhra pradesh',
  'andhra pradesh': 'andhra pradesh',
  tn: 'tamil nadu',
  'tamil nadu': 'tamil nadu',
  mh: 'maharashtra',
  maharashtra: 'maharashtra',
  ka: 'karnataka',
  karnataka: 'karnataka',
  gj: 'gujarat',
  gujarat: 'gujarat',
  rj: 'rajasthan',
  rajasthan: 'rajasthan',
  pb: 'punjab',
  punjab: 'punjab',
  hr: 'haryana',
  haryana: 'haryana',
  br: 'bihar',
  bihar: 'bihar',
  kl: 'kerala',
  kerala: 'kerala'
});

export const CITY_ALIASES = Object.freeze({
  delhi: 'Delhi',
  'new delhi': 'Delhi',
  dilli: 'Delhi',
  ncr: 'Delhi',
  kolkata: 'Kolkata',
  calcutta: 'Kolkata',
  mumbai: 'Mumbai',
  bombay: 'Mumbai',
  bengaluru: 'Bengaluru',
  bangalore: 'Bengaluru',
  chennai: 'Chennai',
  madras: 'Chennai',
  hyderabad: 'Hyderabad',
  ahmedabad: 'Ahmedabad',
  pune: 'Pune',
  jaipur: 'Jaipur',
  lucknow: 'Lucknow',
  patna: 'Patna',
  varanasi: 'Varanasi',
  banaras: 'Varanasi',
  kashi: 'Varanasi',
  noida: 'Noida',
  gurgaon: 'Gurugram',
  gurugram: 'Gurugram',
  chandigarh: 'Chandigarh',
  bhopal: 'Bhopal',
  kochi: 'Kochi',
  cochin: 'Kochi',
  bhubaneswar: 'Bhubaneswar',
  guwahati: 'Guwahati'
});

export const INDIAN_FALLBACK_CITIES = Object.freeze([
  {
    id: 1275004,
    name: 'Kolkata',
    latitude: 22.5726,
    longitude: 88.3639,
    country: 'India',
    country_code: 'IN',
    admin1: 'West Bengal',
    timezone: 'Asia/Kolkata'
  },
  {
    id: 1273294,
    name: 'Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    country: 'India',
    country_code: 'IN',
    admin1: 'Delhi',
    timezone: 'Asia/Kolkata'
  },
  {
    id: 1275339,
    name: 'Mumbai',
    latitude: 19.076,
    longitude: 72.8777,
    country: 'India',
    country_code: 'IN',
    admin1: 'Maharashtra',
    timezone: 'Asia/Kolkata'
  },
  {
    id: 1264527,
    name: 'Chennai',
    latitude: 13.0827,
    longitude: 80.2707,
    country: 'India',
    country_code: 'IN',
    admin1: 'Tamil Nadu',
    timezone: 'Asia/Kolkata'
  },
  {
    id: 1277333,
    name: 'Bengaluru',
    latitude: 12.9716,
    longitude: 77.5946,
    country: 'India',
    country_code: 'IN',
    admin1: 'Karnataka',
    timezone: 'Asia/Kolkata'
  },
  {
    id: 1269843,
    name: 'Hyderabad',
    latitude: 17.385,
    longitude: 78.4867,
    country: 'India',
    country_code: 'IN',
    admin1: 'Telangana',
    timezone: 'Asia/Kolkata'
  },
  {
    id: 1279233,
    name: 'Ahmedabad',
    latitude: 23.0225,
    longitude: 72.5714,
    country: 'India',
    country_code: 'IN',
    admin1: 'Gujarat',
    timezone: 'Asia/Kolkata'
  },
  {
    id: 1259229,
    name: 'Pune',
    latitude: 18.5204,
    longitude: 73.8567,
    country: 'India',
    country_code: 'IN',
    admin1: 'Maharashtra',
    timezone: 'Asia/Kolkata'
  },
  {
    id: 1271476,
    name: 'Jaipur',
    latitude: 26.9124,
    longitude: 75.7873,
    country: 'India',
    country_code: 'IN',
    admin1: 'Rajasthan',
    timezone: 'Asia/Kolkata'
  },
  {
    id: 1264733,
    name: 'Lucknow',
    latitude: 26.8467,
    longitude: 80.9462,
    country: 'India',
    country_code: 'IN',
    admin1: 'Uttar Pradesh',
    timezone: 'Asia/Kolkata'
  },
  {
    id: 1260086,
    name: 'Patna',
    latitude: 25.5941,
    longitude: 85.1376,
    country: 'India',
    country_code: 'IN',
    admin1: 'Bihar',
    timezone: 'Asia/Kolkata'
  },
  {
    id: 1270583,
    name: 'Guwahati',
    latitude: 26.1445,
    longitude: 91.7362,
    country: 'India',
    country_code: 'IN',
    admin1: 'Assam',
    timezone: 'Asia/Kolkata'
  },
  {
    id: 1273874,
    name: 'Chandigarh',
    latitude: 30.7333,
    longitude: 76.7794,
    country: 'India',
    country_code: 'IN',
    admin1: 'Chandigarh',
    timezone: 'Asia/Kolkata'
  },
  {
    id: 1275817,
    name: 'Bhopal',
    latitude: 23.2599,
    longitude: 77.4126,
    country: 'India',
    country_code: 'IN',
    admin1: 'Madhya Pradesh',
    timezone: 'Asia/Kolkata'
  },
  {
    id: 1267995,
    name: 'Kochi',
    latitude: 9.9312,
    longitude: 76.2673,
    country: 'India',
    country_code: 'IN',
    admin1: 'Kerala',
    timezone: 'Asia/Kolkata'
  },
  {
    id: 1253405,
    name: 'Varanasi',
    latitude: 25.3176,
    longitude: 82.9739,
    country: 'India',
    country_code: 'IN',
    admin1: 'Uttar Pradesh',
    timezone: 'Asia/Kolkata'
  },
  {
    id: 7279746,
    name: 'Noida',
    latitude: 28.5355,
    longitude: 77.391,
    country: 'India',
    country_code: 'IN',
    admin1: 'Uttar Pradesh',
    timezone: 'Asia/Kolkata'
  }
]);

/**
 * Normalizes an Indian state name.
 * @param {string} state - Raw state name.
 * @returns {string}
 */
export function normalizeStateName(state) {
  if (!state || typeof state !== 'string') return '';
  const clean = state
    .toLowerCase()
    .replace(/[^a-z0-9& ]/g, '')
    .trim();
  return STATE_ALIASES[clean] || clean;
}

/**
 * Checks if two state names refer to the same Indian state.
 * @param {string} state1 - First state name.
 * @param {string} state2 - Second state name.
 * @returns {boolean}
 */
export function statesMatch(state1, state2) {
  if (!state1 || !state2) return false;
  const n1 = normalizeStateName(state1);
  const n2 = normalizeStateName(state2);
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
}

/**
 * Resolves standard city name from alias.
 * @param {string} query - Raw city query.
 * @returns {string}
 */
export function resolveCityAlias(query) {
  if (!query || typeof query !== 'string') return '';
  const clean = query.toLowerCase().trim();
  return CITY_ALIASES[clean] || query.trim();
}
