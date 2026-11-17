// src/pages/IndoorHacksPage.jsx
import React, { useState } from 'react';
import { ShieldCheck, Wind, DollarSign, Leaf, Sparkles, AlertTriangle, Check, Layers, Wrench, Heart } from 'lucide-react';
import ImpactBadge from '../components/ImpactBadge';
import MascotAvatar from '../components/MascotAvatar';

const HACKS_DATA = [
  {
    id: 'cr_box',
    category: 'DIY Filters',
    title: 'The Corsi-Rosenthal Box (DIY High-CADR Air Purifier)',
    summary: 'A 20-inch box fan paired with 4 MERV-13 furnace filters taped into a cube. Delivers the Clean Air Delivery Rate (CADR) of $400 commercial HEPA units for a fraction of the cost.',
    budgetOption: 'Single-filter build: Tape 1 MERV-13 20x20 filter directly onto the back of a standard box fan with cardboard shrouds.',
    standardOption: '4-filter cube with cardboard bottom and top shroud for maximum airflow and low noise.',
    cost: '$35 – $65 total vs. $300-$500 commercial HEPA',
    co2Impact: 'Saves embodied carbon of complex plastic purifiers',
    pmImpact: 'Removes 85-90% of PM2.5 in a 400 sq.ft room within 30 min',
    healthBenefit: 'Cuts overnight asthma attacks and airway inflammation',
    steps: [
      'Assemble 4 MERV-13 pleated filters (20"x20"x1" or 2") in a square, arrows pointing inward toward the center.',
      'Cut a 20"x20" cardboard base for the bottom and tape the corners tightly with duct tape.',
      'Place the 20" box fan on top, blowing air UPWARD into the room.',
      'Tape a round cardboard shroud with a 15" hole on the fan face to eliminate corner air back-draft.'
    ]
  },
  {
    id: 'gap_sealing',
    category: 'Draft Sealing',
    title: 'Door & Window Micro-Gap Draft Sealing',
    summary: 'Outdoor winter smog infiltrates through micro-gaps beneath exterior doors and window sashes under thermal pressure.',
    budgetOption: 'FREE: Roll a damp bath towel tightly and place it along the bottom threshold of exterior doors. Masking tape along drafty sash seams.',
    standardOption: 'Self-adhesive silicone V-strip weatherstripping ($8) + double-sided under-door draft stopper ($12).',
    cost: '$0 (damp towel) to $15',
    co2Impact: 'Cuts winter heating energy loss by up to 12%',
    pmImpact: 'Reduces passive PM2.5 infiltration by 40-50%',
    healthBenefit: 'Maintains clean indoor bubble when outdoor AQI exceeds 200',
    steps: [
      'Locate drafts on a windy day using the flame of an unlit match smoke or the back of your hand.',
      'Place rolled towel along the bottom gap.',
      'Wipe window sash frames dry and press silicone weatherstrip along the closing junction.'
    ]
  },
  {
    id: 'ventilation_timing',
    category: 'Ventilation',
    title: 'Inversion-Aware Smart Ventilation Timing',
    summary: 'Never open windows during morning (6-10 AM) or evening (6-10 PM) temperature inversions when heavy smog is concentrated at street level.',
    budgetOption: 'Zero cost: Open windows strictly for 10-15 minutes between 1:30 PM and 3:30 PM only if outdoor AQI is below 100, then re-seal.',
    standardOption: 'Install window-mounted MERV-8/11 pre-filter screens ($20) for filtered fresh air intake.',
    cost: '$0',
    co2Impact: 'Optimizes natural thermal regulation without wasting heat',
    pmImpact: 'Prevents 75% of morning outdoor smog spikes from entering the living room',
    healthBenefit: 'Avoids sudden bronchial constriction during early waking hours',
    steps: [
      'Check the Foggy Dashboard 24-hour curve before opening any window.',
      'If indoor CO2 feels stuffy, air out briefly during the solar peak (midday).',
      'Run indoor filters on high for 20 minutes immediately after closing windows.'
    ]
  },
  {
    id: 'cooktop_fumes',
    category: 'Clean Cooking & Heat',
    title: 'Cooktop Safety & Induction Swap',
    summary: 'Gas stoves and high-heat frying emit nitrogen dioxide (NO2), benzene, and ultra-fine particles equivalent to living with a cigarette smoker.',
    budgetOption: 'Cook with lids on back burners only, turn on range hood on high, or use an electric kettle / microwave.',
    standardOption: 'Portable plug-in single-burner induction cooktop ($45) for daily boiling and stir-frying.',
    cost: '$0 habit swap or $45 portable induction burner',
    co2Impact: 'Saves ~0.6 kg CO2 per day vs fossil methane gas combustion',
    pmImpact: 'Eliminates 90% of indoor kitchen-generated ultra-fine particles',
    healthBenefit: 'Prevents childhood asthma exacerbations triggered by NO2',
    steps: [
      'Always switch on the range hood exhaust 1 minute before turning on any burner.',
      'Use the back burners where exhaust capture efficiency is 2x higher than front burners.',
      'Switch to induction cooking for boiling water, soups, and daily grain preparation.'
    ]
  },
  {
    id: 'plants_humidity',
    category: 'Plants & Humidity',
    title: 'Air-Friendly Botanical Companions & Humidity',
    summary: 'While plants do not replace active HEPA filters for heavy PM2.5 smog, they boost humidity to 40-50% (settling airborne dust) and metabolize formaldehyde.',
    budgetOption: 'Spider Plant & Snake Plant propagated from friend cuttings in tap water. Wet bowl near heater for passive humidity.',
    standardOption: 'Areca Palm, Boston Fern, and Snake Plant trio ($30) + cool mist ultrasonic humidifier ($25).',
    cost: '$0 (cuttings) to $40',
    co2Impact: 'Absorbs indoor VOCs and releases nighttime oxygen',
    pmImpact: 'Settles suspended aerosol particles faster by maintaining 45% relative humidity',
    healthBenefit: 'Prevents dry nasal mucosa cracking, keeping your natural airway defense intact',
    steps: [
      'Place Snake Plants in the bedroom (they release oxygen at night).',
      'Keep soil moist but avoid stagnant water to prevent mold spore formation.',
      'Wipe plant leaves monthly with a damp cloth to keep their stomatic pores open.'
    ]
  },
  {
    id: 'mask_protocol',
    category: 'Masks',
    title: 'N95 / FFP2 Rotation & Decontamination Protocol',
    summary: 'Cloth and surgical masks leak >70% of fine PM2.5 around the perimeter. High-filtration respirators are essential whenever stepping outdoors.',
    budgetOption: 'Safe 4-Day Rotation: Buy 4 N95 masks ($5 total). Label paper bags Mon/Tue/Wed/Thu. Rotate each mask, letting it air-dry 72 hours between uses for up to 40 hours of use.',
    standardOption: 'Valved or unvalved N95 with adjustable silicone headbands and foam nose bridge ($15/box).',
    cost: '$5 for a month of safe rotated protection',
    co2Impact: 'Dramatically reduces disposable single-use mask waste',
    pmImpact: 'Filters >95% of fine toxic particulates from entering deep alveoli',
    healthBenefit: 'Guards against acute vascular stress and bronchial spasm',
    steps: [
      'Pinch the metal nose strip firmly over the bridge of your nose with two hands.',
      'Perform a seal check: inhale sharply; the respirator should cup inward slightly.',
      'Store in a dry, breathable paper bag after each trip—never in a sealed plastic bag.'
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
          Clean indoor air shouldn't cost a fortune. Every strategy below features a <strong>budget-friendly or zero-cost alternative</strong> alongside calculated emission and particulate reductions.
        </p>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
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
              className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-soft dark:shadow-soft-dark flex flex-col justify-between space-y-4 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                    {hack.category}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{hack.cost}</span>
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
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-between transition-colors"
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
