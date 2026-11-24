// src/constants/about/aboutData.js
// Static data for educational and scientific references on AboutPage

export const OFFICIAL_PORTALS = [
  {
    id: 'cpcb',
    source: 'Central Pollution Control Board (CPCB)',
    title: 'National Air Quality Index (NAQI) Bulletins',
    description:
      'Statutory authority under the Ministry of Environment, Forest and Climate Change (MoEFCC) governing National Ambient Air Quality Standards and publishing daily 4:00 PM NAQI bulletins across Indian cities.',
    link: 'https://cpcb.nic.in',
    badge: 'Official CPCB',
    status: 'Check the official page for live alerts'
  },
  {
    id: 'caqm',
    source: 'Commission for Air Quality Management (CAQM)',
    title: 'Graded Response Action Plan (GRAP) Enforcement Orders',
    description:
      'Statutory body constituted for air quality management in National Capital Region and adjoining areas, issuing binding emergency GRAP Stage I–IV enforcement directives.',
    link: 'https://caqm.nic.in',
    badge: 'Official CAQM',
    status: 'Check the official page for live alerts'
  },
  {
    id: 'imd',
    source: 'India Meteorological Department (IMD)',
    title: 'National Weather & Seasonal Dense Fog Advisories',
    description:
      'National meteorological agency providing official winter dense fog warnings, nocturnal temperature inversion forecasts, and atmospheric boundary layer ventilation indices.',
    link: 'https://mausam.imd.gov.in',
    badge: 'Official IMD',
    status: 'Check the official page for live alerts'
  },
  {
    id: 'ndma-sachet',
    source: 'National Disaster Management Authority (NDMA)',
    title: 'SACHET Real-Time Multi-Hazard Warning Portal',
    description:
      'Apex statutory disaster agency hosting the nationwide Common Alerting Protocol (CAP) platform for real-time geographic hazard bulletins and public health advisories.',
    link: 'https://sachet.ndma.gov.in',
    badge: 'Official NDMA',
    status: 'Check the official page for live alerts'
  }
];

export const CPCB_TABLE = [
  {
    range: '0 – 50',
    status: 'Good',
    color: 'bg-emerald-500',
    text: 'Minimal impact. Clean, pristine air safe for all activities.'
  },
  {
    range: '51 – 100',
    status: 'Satisfactory',
    color: 'bg-green-500',
    text: 'Minor breathing discomfort to sensitive people.'
  },
  {
    range: '101 – 200',
    status: 'Moderate',
    color: 'bg-yellow-500',
    text: 'Breathing discomfort to people with asthma, heart disease, or children/seniors.'
  },
  {
    range: '201 – 300',
    status: 'Poor',
    color: 'bg-orange-500',
    text: 'Breathing discomfort to most people on prolonged exposure.'
  },
  {
    range: '301 – 400',
    status: 'Very Poor',
    color: 'bg-red-500',
    text: 'Respiratory illness on prolonged exposure; triggers severe airway irritation.'
  },
  {
    range: '401 – 500',
    status: 'Severe',
    color: 'bg-rose-950',
    text: 'Affects healthy people and seriously impacts those with existing respiratory conditions.'
  }
];

export const CPCB_POLLUTANTS = [
  {
    code: 'PM2.5',
    name: 'Fine Particulate Matter (≤ 2.5 µm)',
    limit24h: '60 µg/m³',
    source: 'Vehicles, biomass chulha, stubble burning, coal plants',
    impact: 'Penetrates deep pulmonary alveoli and enters bloodstream'
  },
  {
    code: 'PM10',
    name: 'Coarse Particulates (≤ 10 µm)',
    limit24h: '100 µg/m³',
    source: 'Road dust, construction, unpaved surfaces, fly ash',
    impact: 'Irritates nasal passages, eyes, and upper respiratory tract'
  },
  {
    code: 'NO2',
    name: 'Nitrogen Dioxide',
    limit24h: '80 µg/m³',
    source: 'Diesel vehicles, industrial combustion, high-temp boilers',
    impact: 'Triggers bronchoconstriction and increases asthma susceptibility'
  },
  {
    code: 'SO2',
    name: 'Sulphur Dioxide',
    limit24h: '80 µg/m³',
    source: 'Thermal power plants, coal combustion, oil refineries',
    impact: 'Constricts airways, aggravates chronic bronchitis'
  },
  {
    code: 'CO',
    name: 'Carbon Monoxide',
    limit24h: '2.0 mg/m³ (8h avg)',
    source: 'Incomplete combustion in traffic jams, smoky fires',
    impact: 'Binds with hemoglobin forming carboxyhemoglobin, starving organs of O2'
  },
  {
    code: 'O3',
    name: 'Ground-Level Ozone',
    limit24h: '100 µg/m³ (8h avg)',
    source: 'Photochemical reaction of NOx and VOCs under intense sun',
    impact: 'Powerful oxidant damaging lung tissue during daytime peak'
  }
];

export const EMERGENCY_NUMBERS = [
  {
    number: '112',
    title: 'National All-in-One Emergency Helpline',
    subtitle: 'Police, Fire, Medical, Disaster (Pan-India)',
    description:
      'Single unified emergency number across all Indian states and Union Territories. Operates 24/7 with GPS vehicle dispatch.',
    badge: 'Unified National Helpline'
  },
  {
    number: '108',
    title: 'Emergency Medical & Disaster Ambulance',
    subtitle: 'State-run Emergency Response Service',
    description:
      'Dedicated government ambulance response for critical trauma, cardiac arrests, acute respiratory failure, and oxygen emergencies.',
    badge: 'Free Ambulance'
  },
  {
    number: '102',
    title: 'Janani Shishu Suraksha Ambulance',
    subtitle: 'Free Mother & Infant Emergency Transport',
    description:
      'Government of India national ambulance transport for pregnant mothers and newborns requiring immediate hospitalization.',
    badge: 'Maternal & Neonatal'
  },
  {
    number: '101',
    title: 'Fire & Rescue Services',
    subtitle: 'Municipal Fire Brigades',
    description:
      'Immediate response for industrial fires, electrical fires, toxic smoke incidents, or building collapses.',
    badge: 'Fire Department'
  },
  {
    number: '100',
    title: 'Police Emergency Assistance',
    subtitle: 'State Police Helpline',
    description:
      'Direct citizen emergency police assistance and roadside traffic hazard reporting.',
    badge: 'Police'
  },
  {
    number: '1098',
    title: 'Childline Emergency Care',
    subtitle: 'Ministry of Women & Child Development',
    description:
      '24-hour free nationwide emergency phone outreach service for children in need of care, protection, and medical aid.',
    badge: 'Child Welfare'
  },
  {
    number: '14567',
    title: 'Elderline National Senior Helpline',
    subtitle: 'Ministry of Social Justice & Empowerment',
    description:
      'Toll-free national helpline for senior citizens offering guidance, rescue, health support, and legal assistance.',
    badge: 'Senior Citizens'
  }
];

export const INDIAN_SMOG_CAUSES = [
  {
    icon: '🌾',
    title: 'Stubble Burning (Parali)',
    description:
      'Post-monsoon mechanized combine harvesters leave 6-inch stalks. Late October to November burning releases millions of tons of black carbon, PM2.5, CO, and volatile aromatics into northwesterly upper-level winds across the Indo-Gangetic basin.'
  },
  {
    icon: '🚗',
    title: 'Vehicular & Road Dust',
    description:
      'Over 15 million two-wheelers, heavy diesel trucks, and idling vehicles emit tailpipe nanoparticles and unburnt hydrocarbons directly into ground-level breathing air, which resuspends dry silt and road dust.'
  },
  {
    icon: '🪵',
    title: 'Biomass & Festive Smog',
    description:
      'Domestic open chulha cooking with cow dung and firewood, combined with seasonal firecracker smoke and nighttime municipal garbage fires, produces severe local toxic plumes.'
  }
];

export const DEVELOPER_CREDITS = {
  author: 'Rishav Nandi',
  githubUrl: 'https://github.com/Rishav-coder-ops',
  linkedinUrl: 'https://www.linkedin.com/in/rishav-nandi-2k7/',
  githubAria: 'Rishav Nandi on GitHub (opens in a new tab)',
  linkedinAria: 'Rishav Nandi on LinkedIn (opens in a new tab)',
  bio: 'Full-stack engineer dedicated to open environmental data transparency and preventative public health in India.'
};
