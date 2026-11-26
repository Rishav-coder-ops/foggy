// src/constants/playbookData.js
/**
 * @fileoverview Field-tested particulate reduction strategies for the Clean Air Playbook,
 * categorized across Free (₹0), Budget (< ₹1,000), and Premium (₹1,000+) tiers.
 */

export const PLAYBOOK_DATA = Object.freeze({
  free: [
    {
      id: 'free_1',
      action: 'Inversion Window Airing Schedule',
      cost: '₹0 (Free)',
      effort: 'Easy',
      target: 'Whole household & Asthmatics',
      impact: 'Est. ~35–45% particulate draft reduction',
      howTo:
        'Keep all windows tightly closed during early morning (6–10 AM) and evening (7–10 PM) smog inversions. Open windows strictly during the 1:00 PM – 3:30 PM solar dispersal window.',
      aqiRelevance: 'Critical when NAQI > 100'
    },
    {
      id: 'free_2',
      action: 'Damp-Mop Daily (Pocha) & Zero Dry Sweeping',
      cost: '₹0 (Free)',
      effort: 'Easy',
      target: 'Children & Crawling infants',
      impact: 'Est. ~40–55% reduction in resuspended floor PM2.5',
      howTo:
        'Never use dry brooms (jhadu) or feather dusters during high smog days; they launch settled heavy metals back into breathing zones. Use a wet mop (pocha) with water.',
      aqiRelevance: 'Daily necessity when NAQI > 100'
    },
    {
      id: 'free_3',
      action: 'Zero Agarbatti, Dhoop, Waste & Candle Burning',
      cost: '₹0 (Free)',
      effort: 'Easy',
      target: 'Seniors, COPD & Asthmatics',
      impact: 'Est. ~50–80% indoor combustion soot reduction',
      howTo:
        'Burning agarbatti (incense sticks), mosquito coils, or candles in closed rooms generates particulate densities exceeding 500+ µg/m³. Switch to electric vaporizers or non-smoke alternatives.',
      aqiRelevance: 'Essential when NAQI > 150'
    },
    {
      id: 'free_4',
      action: 'Kitchen Exhaust Fan Continuous Run',
      cost: '₹0 (Free)',
      effort: 'Easy',
      target: 'Family cooks & Respiratory patients',
      impact: 'Est. ~30–50% cooking aerosol & NO2 reduction',
      howTo:
        'Turn on exhaust vents 2 minutes before igniting burners and keep running for 5 minutes after cooking. Put lids on frying pans to minimize lipid aerosolization.',
      aqiRelevance: 'Recommended for all indoor cooking'
    },
    {
      id: 'free_5',
      action: 'Damp Towel Door Threshold Draft Sealing',
      cost: '₹0 (Free)',
      effort: 'Easy',
      target: 'Apartment dwellers & Ground floor homes',
      impact: 'Est. ~25–40% passive doorway infiltration reduction',
      howTo:
        'Roll an old damp bath towel and press firmly against the bottom crack of your main entry door and balcony doors to block ambient street smog drafts.',
      aqiRelevance: 'High impact when outdoor NAQI > 150'
    },
    {
      id: 'free_6',
      action: 'Post-Transit Wardrobe Swap & Face Wash',
      cost: '₹0 (Free)',
      effort: 'Easy',
      target: 'Commuters & Outdoor workers',
      impact: 'Est. ~20–30% indoor cross-contamination reduction',
      howTo:
        'Smog particulates adhere to fabric fibers and hair. Remove outer jackets at the doorway, wash your face, rinse nasal passages with clean water, and change into indoor clothes.',
      aqiRelevance: 'Crucial after outdoor transit'
    },
    {
      id: 'free_7',
      action: 'Metro / City Bus Transit Commute Swap',
      cost: '₹0 (Free / Net Savings)',
      effort: 'Medium',
      target: 'Daily commuters & Tailpipe reduction',
      impact: 'Est. ~65% personal PM2.5 inhalation cut vs street driving',
      howTo:
        'Swap solo two-wheeler or car commuting for the underground Metro or electric city bus. AC cabins filter up to 65% of street-level smoke and save ₹150–₹220 in petrol daily.',
      aqiRelevance: 'High priority during severe inversions'
    }
  ],

  budget: [
    {
      id: 'budget_1',
      action: 'Certified N95 / FFP2 Respirators (4-Day Paper Bag Rotation)',
      cost: 'Approx. ₹250 – ₹450 (multi-pack)',
      effort: 'Easy',
      target: 'Everyone traveling outdoors',
      impact: 'Est. >95% hazardous particulate filtration efficiency',
      howTo:
        'Label 4 breathable brown paper bags Monday through Thursday. Rotate your N95 respirator each day so trapped moisture dehydrates safely, safely extending mask lifespan up to 40 hours.',
      aqiRelevance: 'Mandatory outdoors when NAQI > 200'
    },
    {
      id: 'budget_2',
      action: 'Self-Adhesive EPDM Rubber Door & Window Weatherstripping',
      cost: 'Approx. ₹220 – ₹380 per roll',
      effort: 'Easy',
      target: 'Older apartments & Drafty window frames',
      impact: 'Est. ~40–60% reduction in passive window draft leaks',
      howTo:
        'Wipe window and door perimeters with rubbing alcohol and stick self-adhesive V-profile or D-profile rubber tape along all gaps to seal drafts permanently.',
      aqiRelevance: 'Pre-winter insulation priority'
    },
    {
      id: 'budget_3',
      action: 'Window-Mounted Fine Mesh Anti-Smog Pre-Filter Screen',
      cost: 'Approx. ₹350 – ₹650',
      effort: 'Medium',
      target: 'Living rooms & Natural ventilation',
      impact: 'Est. ~35–50% coarse dust and particulate barrier',
      howTo:
        'Affix electrostatic pre-filter mesh over your existing sliding mosquito net frame, enabling filtered fresh air intake during the midday solar window.',
      aqiRelevance: 'Ideal for homes needing ventilation'
    },
    {
      id: 'budget_4',
      action: 'Laser Particle PM2.5 Pocket Sensor',
      cost: 'Approx. ₹850 – ₹990',
      effort: 'Easy',
      target: 'Indoor air monitoring & Filter check',
      impact: 'Real-time visibility: verifies whether filters are working',
      howTo:
        'Place in the central room away from drafts. Lets you verify whether DIY filters or closed doors are maintaining healthy indoor levels below 30 µg/m³.',
      aqiRelevance: 'Recommended for empirical validation'
    },
    {
      id: 'budget_5',
      action: 'Nursery Botanical Companions (Areca Palm & Snake Plant)',
      cost: 'Approx. ₹350 – ₹550 pair',
      effort: 'Easy',
      target: 'Bedrooms & Desks',
      impact: 'Nighttime oxygenation & humidity stabilization',
      howTo:
        'Snake plants (Sansevieria) release oxygen at night via CAM metabolism. Note: plants cannot filter PM2.5 at room scale, so pair with mechanical filtration.',
      aqiRelevance: 'Complementary ambient indoor habit'
    },
    {
      id: 'budget_6',
      action: 'Split A/C Pre-Filter Electrostatic Sheet Upgrade',
      cost: 'Approx. ₹380 – ₹580',
      effort: 'Medium',
      target: 'Split A/C owners',
      impact: 'Est. ~30–45% additional filtration through existing A/C',
      howTo:
        'Attach a thin electrostatically-charged pre-filter sheet over your split AC nylon mesh filter. Run the AC in "Fan Only" mode during smog peaks for room circulation.',
      aqiRelevance: 'Low-cost whole-room circulation'
    },
    {
      id: 'budget_7',
      action: 'Nasal Saline Mist Rinse Kit',
      cost: 'Approx. ₹180 – ₹320',
      effort: 'Easy',
      target: 'Commuters & Outdoor workers',
      impact: 'Flushes trapped heavy metal particulates from nasal lining',
      howTo:
        'Use a sterile isotonic saline spray or neti squeeze bottle after transit to clear cilia passages, reducing sinus headaches and nighttime irritation.',
      aqiRelevance: 'Personal hygiene essential'
    }
  ],

  premium: [
    {
      id: 'premium_1',
      action: 'Corsi-Rosenthal High-CADR DIY Box Fan Purifier',
      cost: 'Approx. ₹2,800 – ₹3,500',
      effort: 'Medium',
      target: 'Living rooms, Classrooms & Bedrooms',
      impact: 'Est. ~75–85% indoor PM2.5 drop (Matches ₹15,000+ CADR)',
      howTo:
        'Tape 2 to 4 MERV-13 / F7 pleated furnace filters to a standard 20-inch box fan with heavy-duty duct tape. Cardboard shroud on the front face boosts airflow efficiency by 20%.',
      aqiRelevance: 'Cost-effective champion when NAQI is 200–400+'
    },
    {
      id: 'premium_2',
      action: 'Single-Burner Portable Induction Cooktop (Zero NO2/Biomass)',
      cost: 'Approx. ₹2,200 – ₹3,800',
      effort: 'Medium',
      target: 'All households (Eliminates indoor cooking emissions)',
      impact: 'Est. 100% elimination of indoor NO2 & unburned soot',
      howTo:
        'Plug in a 2000W magnetic induction cooktop for daily boiling and frying. Eliminates nitrogen dioxide (NO2) spikes that exacerbate child asthma by 42%.',
      aqiRelevance: 'Permanent indoor air quality upgrade'
    },
    {
      id: 'premium_3',
      action: 'True HEPA (H13) Smart Air Purifier with Laser Auto-Mode',
      cost: 'Approx. ₹8,500 – ₹16,500',
      effort: 'Easy',
      target: 'Severe asthmatics, Newborns & Elderly',
      impact: 'Est. 99.97% particle removal down to 0.3 microns',
      howTo:
        'Select a unit with Clean Air Delivery Rate (CADR) rated for 1.5× your room area. Keep running on low 24/7 during winter inversion months.',
      aqiRelevance: 'High priority when NAQI > 250'
    },
    {
      id: 'premium_4',
      action: 'Positive-Pressure Balanced Fresh Air HEPA Ventilator (ERV)',
      cost: 'Approx. ₹14,000 – ₹26,000',
      effort: 'Hard',
      target: 'Sealed modern apartments with high CO2',
      impact: 'Supplies filtered outdoor oxygen while keeping CO2 < 800 ppm',
      howTo:
        'A wall-mounted ERV/HRV unit pulls outside air through a pre-filter and H13 HEPA core, creating slight positive indoor pressure so polluted air cannot leak in.',
      aqiRelevance: 'Advanced multi-room solution'
    },
    {
      id: 'premium_5',
      action: 'High-Precision Laser AQI Station with Cloud Logging',
      cost: 'Approx. ₹4,500 – ₹7,500',
      effort: 'Easy',
      target: 'Data-conscious families & Community hubs',
      impact: 'Dual laser sensor reads PM1.0, PM2.5, PM10, TVOC & CO2',
      howTo:
        'Connect to Wi-Fi to receive automatic smartphone notifications when indoor particulate density breaches safety thresholds.',
      aqiRelevance: 'Smart home automation'
    },
    {
      id: 'premium_6',
      action: 'Commuter Electric Vehicle (E-Scooter / E-Bike Conversion)',
      cost: 'Approx. ₹65,000 – ₹95,000',
      effort: 'Medium',
      target: 'Daily commuters & Urban tailpipe cut',
      impact: 'Zero tailpipe emissions: saves ~3.5 kg CO2 per 15 km commute',
      howTo:
        'Replace petrol 2-wheelers with a swappable battery e-scooter. Cuts direct breathing exposure to hot vehicle exhaust in standstill traffic jams.',
      aqiRelevance: 'Community-scale impact'
    },
    {
      id: 'premium_7',
      action: 'Custom Whole-Home Magnetic Double Glazing Acrylic Seals',
      cost: 'Approx. ₹6,000 – ₹16,000',
      effort: 'Hard',
      target: 'Homes facing highway or arterial traffic',
      impact: 'Est. ~75% acoustic noise drop + ~60% passive particulate sealing',
      howTo:
        'Install magnetic secondary acrylic glazing panels over existing drafty window frames, creating an insulating thermal air buffer against street smog.',
      aqiRelevance: 'Long-term urban residence protection'
    }
  ]
});
