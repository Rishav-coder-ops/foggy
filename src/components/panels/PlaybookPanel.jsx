// src/components/panels/PlaybookPanel.jsx
// Clean Air Playbook: Free to Premium Feature Box & Expanded Modal
// 6-8 cards per tab with realistic Indian market estimates in ₹ (en-IN formatted)
import { useState, useRef } from 'react';
import { ShieldCheck, Sparkles, MessageSquare } from 'lucide-react';
import ExpandablePanelModal from '../ExpandablePanelModal';
import PanelCitySearch from '../PanelCitySearch';
import { useChat } from '../../context/ChatContext';

const PLAYBOOK_DATA = {
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
};

export default function PlaybookPanel({
  currentAqi = 165,
  location,
  onCitySelect,
  onUseMyLocation,
  geoLoading = false,
  geoError = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('free');
  const cardRef = useRef(null);
  const { openChat, setInputMessage } = useChat();

  const handleAskFoggy = (item) => {
    const promptText = `Can you guide me through implementing the "${item.action}" from the Clean Air Playbook? Approximate cost is ${item.cost}, effort is ${item.effort}. How does it help my family in ${location?.name || 'Kolkata'} during today's Estimated NAQI of ${currentAqi}?`;
    if (setInputMessage) setInputMessage(promptText);
    if (openChat) openChat();
    setIsOpen(false);
  };

  const getAQIAdviceBanner = (aqi) => {
    if (aqi <= 50) {
      return {
        level: 'Good (0-50)',
        message:
          'Air is clean today! Focus on natural ventilation (1-3 PM) and enjoy outdoor exercise.',
        badgeClass:
          'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
      };
    }
    if (aqi <= 100) {
      return {
        level: 'Satisfactory (51-100)',
        message:
          'Satisfactory air quality: prioritize daily damp-mopping (pocha) and keep kitchen exhaust fans active.',
        badgeClass:
          'bg-green-100 text-green-950 dark:bg-green-950/50 dark:text-green-200 border-green-300 dark:border-green-800'
      };
    }
    if (aqi <= 200) {
      return {
        level: 'Moderate (101-200)',
        message:
          'Moderate smog alert: deploy door threshold draft sealing, plan outdoor walks for midday (1-3:30 PM), and consider a DIY box fan.',
        badgeClass:
          'bg-yellow-100 text-yellow-950 dark:bg-yellow-950/50 dark:text-yellow-200 border-yellow-300 dark:border-yellow-800'
      };
    }
    if (aqi <= 300) {
      return {
        level: 'Poor (201-300)',
        message:
          'Poor air alert: wear certified N95 masks outdoors, seal window drafts, and run Corsi-Rosenthal DIY box fans or HEPA purifiers.',
        badgeClass:
          'bg-orange-100 text-orange-950 dark:bg-orange-950/50 dark:text-orange-200 border-orange-300 dark:border-orange-800'
      };
    }
    if (aqi <= 400) {
      return {
        level: 'Very Poor (301-400)',
        message:
          'Very Poor air quality: avoid all outdoor exercise, seal door thresholds with damp towels, and keep mechanical air filtration running continuously.',
        badgeClass:
          'bg-red-100 text-red-950 dark:bg-red-950/60 dark:text-red-200 border-red-300 dark:border-red-800'
      };
    }
    return {
      level: 'Severe (401-500)',
      message:
        'Severe smog emergency: stay strictly indoors, run HEPA / DIY box fans 24/7, seal all perimeter gaps, and use N95 masks if transit is unavoidable.',
      badgeClass:
        'bg-rose-100 text-rose-950 dark:bg-rose-950/60 dark:text-rose-200 border-rose-300 dark:border-rose-800'
    };
  };

  const aqiBanner = getAQIAdviceBanner(currentAqi);
  const currentItems = PLAYBOOK_DATA[activeTab] || PLAYBOOK_DATA.free;

  return (
    <>
      {/* Landing Page Feature Box (Right Box) - Alive with hover, lift, glow, nudge & press feedback */}
      <div
        ref={cardRef}
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Open Clean Air Playbook panel"
        className="interactive-card rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-soft dark:shadow-soft-dark space-y-3 cursor-pointer group hover:border-emerald-400 dark:hover:border-emerald-500/60 hover:shadow-glow-ozone focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 motion-safe:hover:-translate-y-1.5 motion-safe:active:scale-[0.98] flex flex-col justify-between"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:rotate-3 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Tiered Intervention Strategies
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            Clean Air Playbook: Free to Premium
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Practical particulate reduction strategies for every budget. From zero-rupee draft
            sealing and damp-mopping to DIY Corsi-Rosenthal boxes and induction cooking.
          </p>

          {/* Compact Tier Labels Preview */}
          <div className="flex items-center gap-2 pt-2">
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[#E2E8F0] dark:bg-[#1E293B] text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Free (₹0)
            </span>
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[#E2E8F0] dark:bg-[#1E293B] text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              Budget (&lt;₹1k)
            </span>
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[#E2E8F0] dark:bg-[#1E293B] text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
              Premium (₹1k+)
            </span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <span>Click to explore playbook</span>
          <span className="text-slate-400 group-hover:text-emerald-500 transition-all duration-300 motion-safe:group-hover:translate-x-1.5">
            →
          </span>
        </div>
      </div>

      {/* Expanded Modal Sheet */}
      <ExpandablePanelModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Clean Air Playbook: Tiered Smog Defense"
        subtitle={`Actionable particulate reduction interventions for ${location?.name || 'Kolkata'} (Estimated NAQI: ${currentAqi})`}
        icon={ShieldCheck}
        triggerRef={cardRef}
        badge={
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            Field-Tested Strategies (₹)
          </span>
        }
      >
        {/* City Search & Geolocation */}
        <PanelCitySearch
          currentLocation={location}
          onCitySelect={onCitySelect}
          onUseMyLocation={onUseMyLocation}
          geoLoading={geoLoading}
          geoError={geoError}
        />

        {/* Match to Today's AQI Banner */}
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 shadow-xs ${aqiBanner.badgeClass}`}
        >
          <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-wider block">
              Match to Today’s NAQI: {currentAqi} ({aqiBanner.level})
            </span>
            <p className="text-xs leading-relaxed font-medium">{aqiBanner.message}</p>
          </div>
        </div>

        {/* Tier Tabs */}
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-[#CBD5E1]/60 dark:bg-[#1E293B] text-xs font-bold border border-[#CBD5E1] dark:border-[#334155]">
          <button
            type="button"
            onClick={() => setActiveTab('free')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'free'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-sm border border-slate-200 dark:border-slate-800'
                : 'text-[#334155] dark:text-[#CBD5E1] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Free (₹0)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('budget')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'budget'
                ? 'bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 shadow-sm border border-slate-200 dark:border-slate-800'
                : 'text-[#334155] dark:text-[#CBD5E1] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Budget (&lt; ₹1,000)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('premium')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'premium'
                ? 'bg-white dark:bg-slate-900 text-purple-800 dark:text-purple-300 shadow-sm border border-slate-200 dark:border-slate-800'
                : 'text-[#334155] dark:text-[#CBD5E1] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Premium (₹1,000+)
          </button>
        </div>

        {/* Playbook Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentItems.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-[#E2E8F0] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] shadow-xs space-y-3 flex flex-col justify-between transition-all duration-200 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-md"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-extrabold text-[#334155] dark:text-[#F8FAFC]">
                    {item.action}
                  </h4>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 text-[#334155] dark:text-[#F8FAFC] border border-[#CBD5E1] dark:border-[#334155] shrink-0">
                    {item.cost}
                  </span>
                </div>

                {/* Tags row */}
                <div className="flex items-center gap-2 flex-wrap text-[10px]">
                  <span className="px-2 py-0.5 rounded-full font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-200 border border-sky-300 dark:border-sky-800">
                    Effort: {item.effort}
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-bold bg-white dark:bg-slate-900 text-[#334155] dark:text-[#CBD5E1] border border-[#CBD5E1] dark:border-[#334155]">
                    Benefits: {item.target}
                  </span>
                </div>

                {/* Estimated Impact */}
                <div className="p-2.5 rounded-xl bg-emerald-100/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-100">
                  <span className="font-bold block text-[10px] uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                    Estimated Particulate Impact
                  </span>
                  <span className="font-black text-xs">{item.impact}*</span>
                </div>

                {/* How to do it */}
                <p className="text-xs text-[#334155] dark:text-[#CBD5E1] leading-relaxed pt-1 font-medium">
                  {item.howTo}
                </p>
              </div>

              {/* Card Footer: AQI relevance & Ask Foggy */}
              <div className="pt-3 border-t border-[#CBD5E1] dark:border-[#334155] flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 italic">
                  {item.aqiRelevance}
                </span>

                <button
                  type="button"
                  onClick={() => handleAskFoggy(item)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-sky-600 hover:text-white dark:hover:bg-sky-500 dark:hover:text-slate-950 text-[#334155] dark:text-[#F8FAFC] border border-[#CBD5E1] dark:border-[#334155] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask Foggy</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer Note */}
        <div className="p-3.5 rounded-2xl bg-[#E2E8F0] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] text-[11px] text-[#334155] dark:text-[#CBD5E1] space-y-1">
          <p>
            *<strong className="text-slate-900 dark:text-white">Note on Pricing & Impacts:</strong>{' '}
            All costs and PM2.5 mitigation percentages are approximate estimates based on
            peer-reviewed environmental engineering research (CPCB, WHO, and Corsi-Rosenthal data)
            and are not guaranteed results. Prices in INR (₹) are estimated for Indian retail
            markets and may vary by city and brand.
          </p>
        </div>

        {/* Attribution & Disclaimer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
          <p>
            <strong className="text-slate-800 dark:text-slate-200">Attribution:</strong> Air quality
            data: Open-Meteo.com, based on Copernicus Atmosphere Monitoring Service (CAMS) model
            data.
          </p>
          <p className="italic">
            <strong>Disclaimer:</strong> Estimated from modelled data; official CPCB station
            readings may differ. Check the official CPCB bulletin or the SAMEER app for
            authoritative values.
          </p>
        </div>
      </ExpandablePanelModal>
    </>
  );
}
