// src/context/profile/profileConstants.js
/**
 * @fileoverview Profile constants, options, and default demo household state.
 */

export const CURRENT_PROFILE_SEED_VERSION = 4;

export const COOKING_OPTIONS = [
  'LPG Cylinder',
  'PNG (Piped Natural Gas)',
  'Induction Cooktop',
  'Electric Hotplate',
  'Wood or dung-cake chulha',
  'Coal or charcoal angithi'
];

export const HEATING_OPTIONS = [
  'Electric geyser or heater',
  'Electric room heater',
  'LPG or gas heater',
  'Wood or dung-cake chulha',
  'Coal or charcoal angithi',
  'Open fire for warmth',
  'None (Mild climate)'
];

export const COMMUTE_OPTIONS = [
  'Walk',
  'Cycle',
  'Two-wheeler',
  'Car',
  'Auto-rickshaw',
  'E-rickshaw',
  'Bus',
  'Metro',
  'Train'
];

export const DEFAULT_DEMO_HOUSEHOLD = {
  _seedVersion: CURRENT_PROFILE_SEED_VERSION,
  profile: {
    fullName: 'Demo Parent',
    age: 38,
    country: 'India',
    state: 'West Bengal',
    city: 'Kolkata',
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: 'Asia/Kolkata',
    placeId: 1275004,
    conditions: ['None'],
    otherCondition: '',
    sensitivity: 'Low',
    commute: ['Metro'],
    lifestyle: ['Morning walk', 'Yoga or exercise outdoors'],
    otherLifestyle: '',
    consentAcceptedAt: '2026-11-19T00:00:00.000Z'
  },
  preferredName: 'Demo Parent',
  onboarding: {
    step: 'done',
    completedAt: '2026-11-19T00:00:00.000Z'
  },
  familyMembers: [
    {
      id: 'fam_demo_1',
      name: 'Beta (Son)',
      relationship: 'Son',
      age: 7,
      country: 'India',
      state: 'West Bengal',
      city: 'Kolkata',
      latitude: 22.5726,
      longitude: 88.3639,
      timezone: 'Asia/Kolkata',
      placeId: 1275004,
      conditions: ['Asthma'],
      otherCondition: '',
      condition: 'Asthma (uses a salbutamol inhaler)',
      sensitivity: 'High',
      commute: ['Walk'],
      lifestyle: ['Outdoor sports such as cricket or football'],
      otherLifestyle: '',
      notes:
        'Loves playing cricket outdoors; needs an indoor activity alternative during high smog days.'
    },
    {
      id: 'fam_demo_2',
      name: 'Dadi',
      relationship: 'Grandmother',
      age: 74,
      country: 'India',
      state: 'West Bengal',
      city: 'Kolkata',
      latitude: 22.5726,
      longitude: 88.3639,
      timezone: 'Asia/Kolkata',
      placeId: 1275004,
      conditions: ['Hypertension'],
      otherCondition: '',
      condition: 'Hypertension',
      sensitivity: 'High',
      commute: ['Walk'],
      lifestyle: ['Morning walk'],
      otherLifestyle: '',
      notes: 'Morning walk routine shifted to afternoon solar window (1:00 PM).'
    },
    {
      id: 'fam_demo_3',
      name: 'Rusty (Golden Retriever)',
      relationship: 'Pet',
      age: 4,
      country: 'India',
      state: 'West Bengal',
      city: 'Kolkata',
      latitude: 22.5726,
      longitude: 88.3639,
      timezone: 'Asia/Kolkata',
      placeId: 1275004,
      conditions: ['None'],
      otherCondition: '',
      condition: 'None',
      sensitivity: 'Moderate',
      commute: [],
      lifestyle: ['Daily outdoor walks'],
      otherLifestyle: '',
      notes: 'Sensitive to eye irritation on haze days.'
    }
  ],
  savedMemories: [
    {
      id: 'mem_demo_1',
      category: 'Health Vulnerability',
      detail:
        'Son Beta experiences wheezing when Estimated NAQI reaches the Poor category (above 200).',
      dateSaved: '2026-11-10',
      source: 'User shared in chat'
    },
    {
      id: 'mem_demo_2',
      category: 'Home Filtration',
      detail:
        'Built a Corsi-Rosenthal DIY box fan filter with MERV-13 filters for the living room (~₹3,000).',
      dateSaved: '2026-11-12',
      source: 'User confirmed hack'
    },
    {
      id: 'mem_demo_3',
      category: 'Transit Swap',
      detail:
        'Swapped 4 days of petrol two-wheeler commuting for the Metro line (~₹180 fuel saved).',
      dateSaved: '2026-11-14',
      source: 'Routine check'
    }
  ],
  chatSummary:
    'Indian household in Kolkata with asthmatic child Beta (uses a salbutamol inhaler), Dadi (hypertension), and pet Rusty. Uses LPG cylinder and metro commute, prioritizes budget DIY filtration (~₹3,000), and shifts outdoor activities to the afternoon solar dispersal window.'
};
