// src/pages/IndoorHacksPage.jsx
// Indoor Air Quality Hacks & Sustainable Alternatives with Indian context & Rupee pricing
import React, { useState } from 'react';
import { ShieldCheck, Wind, Leaf, Sparkles, AlertTriangle, Check, Layers, Wrench, Heart } from 'lucide-react';
import ImpactBadge from '../components/ImpactBadge';
import MascotAvatar from '../components/MascotAvatar';

const HACKS_DATA = [
  {
    id: 'cr_box',
    category: 'DIY Filters',
    title: 'The Corsi-Rosenthal Box (DIY High-CADR Air Purifier)',
    summary: 'A standard 20-inch box fan paired with 2 to 4 MERV-13 furnace filters taped into a cube. Delivers the Clean Air Delivery Rate (CADR) of ₹15,000+ commercial HEPA units for a fraction of the cost.',
    budgetOption: 'Single-filter build (~₹1,800 – ₹2,200): Tape 1 MERV-13 20x20 pleated filter directly onto the back of a standard Indian table/box fan with cardboard shrouds.',
    standardOption: '4-filter cube (~₹3,000 – ₹3,500) with cardboard bottom and top shroud for maximum airflow and low noise.',
    cost: '~₹2,500 – ₹3,500 vs. ₹12,000–₹25,000 commercial HEPA',
    co2Impact: 'Saves embodied carbon of complex imported plastic purifiers',
    pmImpact: 'Removes 85-90% of PM2.5 in a 400 sq.ft room within 30 min',
    healthBenefit: 'Cuts overnight asthma attacks, wheezing, and airway inflammation',
    steps: [
      'Assemble 4 MERV-13 pleated filters (20"x20"x1" or 2") in a square, airflow arrows pointing inward toward the center.',
      'Cut a 20"x20" cardboard base for the bottom and tape the corners tightly with heavy-duty duct tape.',
      'Place the 20" box fan on top, blowing air UPWARD into the room.',
      'Tape a round cardboard shroud with a 15" hole on the fan face to eliminate corner air back-draft.'
    ]
  },
  {
    id: 'gap_sealing',
    category: 'Draft Sealing',
    title: 'Door & Window Micro-Gap Draft Sealing',
    summary: 'Outdoor winter smog and crop-burning haze infiltrate through micro-gaps beneath exterior doors and window sashes under thermal pressure.',
    budgetOption: 'FREE (₹0): Roll a damp bath towel tightly and place it along the bottom threshold of exterior doors. Masking tape along drafty sash seams.',
    standardOption: 'Self-adhesive EPDM silicone V-strip weatherstripping (~₹220 – ₹350) + double-sided under-door draft stopper (~₹300).',
    cost: '₹0 (damp towel) to ~₹350',
    co2Impact: 'Cuts winter space heating energy loss by up to 12%',
    pmImpact: 'Reduces passive PM2.5 infiltration by 40-50%',
    healthBenefit: 'Maintains clean indoor air when outdoor NAQI exceeds 250',
    steps: [
      'Locate drafts on a windy day using an incense smoke stick or the back of your hand.',
      'Place rolled damp towel firmly along the bottom gap.',
      'Wipe window sash frames dry with rubbing alcohol and press silicone weatherstrip along the closing junction.'
    ]
  },
  {
    id: 'ventilation_timing',
    category: 'Ventilation',
    title: 'Inversion-Aware Smart Ventilation Timing',
    summary: 'Never open windows during morning (6-10 AM) or evening (6-10 PM) atmospheric inversions when heavy smog and vehicular exhaust are trapped at ground level.',
    budgetOption: 'Zero cost (₹0): Open windows strictly for 10-15 minutes between 1:30 PM and 3:30 PM when the afternoon sun breaks the thermal inversion, then re-seal.',
    standardOption: 'Install window-mounted MERV-8/11 pre-filter screens (~₹450 – ₹750) for filtered fresh air intake.',
    cost: '₹0 (Habit swap)',
    co2Impact: 'Optimizes natural thermal regulation without wasting energy',
    pmImpact: 'Prevents 75% of morning outdoor smog spikes from entering the living room',
    healthBenefit: 'Avoids sudden bronchial constriction during early waking hours',
    steps: [
      'Check the Foggy Dashboard 24-hour curve before opening any window.',
      'If indoor air feels stuffy, air out briefly during the solar peak (midday 1:30 PM – 3:30 PM).',
      'Run indoor filters on high for 20 minutes immediately after closing windows.'
    ]
  },
  {
    id: 'cooktop_fumes',
    category: 'Clean Cooking & Heat',
    title: 'Cooktop Safety: Induction & LPG Swap',
    summary: 'Cooking on traditional biomass/dung chulhas or unvented gas burners releases hazardous nitrogen dioxide (NO2), carbon monoxide, and dense PM2.5 soot indoors.',
    budgetOption: 'Zero cost (₹0): Turn on the kitchen exhaust fan 2 minutes before cooking, cook with lids on back burners, and open kitchen windows facing away from streets.',
    standardOption: 'Portable plug-in single-burner induction cooktop (~₹2,200 – ₹3,500) for daily boiling, dal, and rice preparation.',
    cost: '₹0 habit swap or ~₹2,200 induction cooktop',
    co2Impact: 'Saves ~0.6 kg CO2 per day vs fossil fuel combustion',
    pmImpact: 'Eliminates 90% of indoor kitchen-generated ultra-fine particles',
    healthBenefit: 'Prevents childhood asthma exacerbations and chronic bronchitis',
    steps: [
      'Always switch on the kitchen exhaust fan 1 minute before turning on any stove.',
      'Use back burners where exhaust capture efficiency is twice as high.',
      'Switch to an electric induction cooktop for daily boiling and frying.'
    ]
  },
  {
    id: 'plants_humidity',
    category: 'Plants & Humidity',
    title: 'Indoor Plants & Damp-Mopping (Scientific Reality)',
    summary: 'Scientific studies confirm that houseplants cannot filter heavy PM2.5 smog at room scale. However, daily damp-mopping (pocha) prevents toxic floor dust resuspension, and plants like Snake Plant boost nighttime oxygen.',
    budgetOption: 'FREE (₹0): Wet damp-mopping (pocha) with water daily (no dry brooms/jhadu during smog). Spider Plant & Snake Plant propagated from cuttings.',
    standardOption: 'Areca Palm and Snake Plant nursery pair (~₹350 – ₹550) + cool mist ultrasonic humidifier (~₹1,200 – ₹1,800).',
    cost: '₹0 (mopping & cuttings) to ~₹550',
    co2Impact: 'Absorbs indoor VOCs and releases nighttime oxygen',
    pmImpact: 'Stops 50%+ resuspension of toxic heavy metal dust from floors',
    healthBenefit: 'Prevents dry nasal mucosa cracking, keeping natural respiratory barriers intact',
    steps: [
      'Never use dry brooms during severe smog; use a wet microfiber mop instead.',
      'Place Snake Plants in the bedroom for CAM nighttime oxygen release.',
      'Wipe plant leaves monthly with a damp cloth to keep their pores open.'
    ]
  },
  {
    id: 'mask_protocol',
    category: 'Masks',
    title: 'Certified N95 / FFP2 4-Day Rotation Protocol',
    summary: 'Cloth and surgical masks leak >70% of fine PM2.5 around the perimeter. Certified N95 or FFP2 respirators are mandatory whenever stepping outdoors during Poor to Severe smog.',
    budgetOption: 'Safe 4-Day Rotation (~₹250 – ₹350): Buy 4 certified N95 masks. Label breathable paper bags Mon/Tue/Wed/Thu. Rotate each mask daily, letting moisture dissipate 72 hours between uses for up to 40 hours of use.',
    standardOption: 'Box of 10 certified N95/FFP2 masks with adjustable headbands and nose bridge foam (~₹450 – ₹650/box).',
    cost: '~₹250 – ₹350 for a month of safe rotated protection',
    co2Impact: 'Dramatically reduces disposable single-use mask waste',
    pmImpact: 'Filters >95% of fine toxic particulates from entering deep alveoli',
    healthBenefit: 'Guards against acute vascular stress, chest tightness, and bronchial spasm',
    steps: [
      'Pinch the metal nose clip firmly over the bridge of your nose with both hands.',
      'Perform a seal check: inhale sharply; the respirator should cup inward slightly.',
      'Store in a dry, breathable paper bag after each trip—never in an airtight plastic bag.'
    ]
  }
];

export default function IndoorHacksPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedId, setExpandedId] = useState('cr_box');

  const categories = ['All', 'DIY Filters', 'Draft Sealing', 'Ventilation', 'Clean Cooking & Heat', 'Plants & Humidity', 'Masks'];

  const filteredHacks = selectedCategory === 'All'
    ? HACKS_DATA
    : HACKS_DATA.filter(h => h.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Indoor Sanctuary Defense</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Indoor Air Quality Hacks & Sustainable Alternatives
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Clean indoor air shouldn't cost a fortune. Every strategy below features a <strong>budget-friendly or zero-cost alternative in Indian Rupees (₹)</strong> alongside calculated emission and particulate reductions.
        </p>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Hacks Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredHacks.map(hack => {
          const isExpanded = expandedId === hack.id;
          return (
            <div
              key={hack.id}
              className="interactive-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-soft dark:shadow-soft-dark flex flex-col justify-between space-y-4 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                    {hack.category}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {hack.cost}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                  {hack.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {hack.summary}
                </p>

                {/* Budget vs Standard Options */}
                <div className="mt-4 space-y-2.5">
                  <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                    <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 mb-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Budget / Zero-Cost Hack:</span>
                    </div>
                    <p className="text-emerald-800 dark:text-emerald-300/90 font-medium">
                      {hack.budgetOption}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-xs">
                    <div className="font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      Standard Setup:
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      {hack.standardOption}
                    </p>
                  </div>
                </div>

                {/* Direct Impact Explainer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                    Direct Impact Breakdown
                  </span>
                  <ImpactBadge
                    co2Saved={hack.co2Impact}
                    pmReduced={hack.pmImpact}
                    healthBenefit={hack.healthBenefit}
                  />
                </div>
              </div>

              {/* Step-by-Step Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : hack.id)}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-sky-500" />
                    <span>{isExpanded ? 'Hide Implementation Steps' : 'View Step-by-Step Instructions'}</span>
                  </span>
                  <span>{isExpanded ? '▲' : '▼'}</span>
                </button>

                {isExpanded && (
                  <div className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-2 animate-fade-in text-xs">
                    {hack.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                          {idx + 1}
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 mt-0.5">{step}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
