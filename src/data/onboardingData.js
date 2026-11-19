// src/data/onboardingData.js
// Standardized options and geographical datasets for onboarding and profile settings

export const COUNTRIES = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'NP', name: 'Nepal' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'BR', name: 'Brazil' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'AF', name: 'Afghanistan' },
  { code: 'BT', name: 'Bhutan' },
  { code: 'MM', name: 'Myanmar' },
  { code: 'MV', name: 'Maldives' },
  { code: 'QA', name: 'Qatar' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'OM', name: 'Oman' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'OTHER', name: 'Other Country' }
];

export const INDIAN_STATES_AND_UTS = [
  // 28 States
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  // 8 Union Territories
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

export const HEALTH_CONDITIONS = [
  'None',
  'Asthma',
  'COPD',
  'Chronic bronchitis',
  'Allergic rhinitis',
  'Sinusitis',
  'Heart disease',
  'Hypertension',
  'Diabetes',
  'Pregnancy',
  'Eye or skin allergies',
  'Other'
];

export const SENSITIVITY_LEVELS = [
  {
    level: 'Low',
    title: 'Low Sensitivity',
    description: 'Rarely impacted by typical seasonal air variations; standard outdoor precautions sufficient.'
  },
  {
    level: 'Moderate',
    title: 'Moderate Sensitivity',
    description: 'Noticeable respiratory or throat irritation during Moderate to Poor air quality episodes.'
  },
  {
    level: 'High',
    title: 'High Sensitivity',
    description: 'High risk of acute symptoms, asthma attacks, or distress during smog spikes; requires strict mitigation.'
  }
];

export const COMMUTE_STYLES = [
  'Walk',
  'Cycle',
  'Two-wheeler',
  'Car',
  'Auto-rickshaw',
  'E-rickshaw',
  'Bus',
  'Metro',
  'Train',
  'Work or study from home'
];

export const LIFESTYLE_ACTIVITIES = [
  'Morning walk',
  'Jogging or running',
  'Cycling for fitness',
  'Yoga or exercise outdoors',
  'Outdoor sports such as cricket or football',
  'Gym or indoor exercise',
  'Mostly indoors',
  'Outdoor work such as vending, delivery, traffic or construction',
  'Gardening',
  'Other'
];

export const PET_LIFESTYLE_ACTIVITIES = [
  'Daily outdoor walks',
  'Garden playtime',
  'Mostly indoor resting',
  'Outdoor agility / training',
  'Other'
];

export const RELATIONSHIP_SUGGESTIONS = [
  'Mother',
  'Father',
  'Grandmother',
  'Grandfather',
  'Spouse',
  'Son',
  'Daughter',
  'Brother',
  'Sister',
  'Friend',
  'Pet',
  'Other'
];
