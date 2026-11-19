// src/pages/AboutPage.jsx
// Comprehensive Educational & Scientific Reference for Indian Air Quality & Foggy Architecture

import React, { useState, useEffect } from 'react';
import {
  Wind, ShieldAlert, Heart, BookOpen, Layers, Terminal, Sparkles,
  ExternalLink, Shield, AlertTriangle, Phone, Newspaper, Bell,
  RefreshCw, CheckCircle2, ArrowRight, Github, Linkedin, Info
} from 'lucide-react';
import MascotAvatar from '../components/MascotAvatar';

export default function AboutPage() {
  // News state
  const [newsList, setNewsList] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [newsUpdated, setNewsUpdated] = useState('');

  // Alerts state
  const [alertsList, setAlertsList] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  // Fetch News
  const loadNews = async () => {
    setLoadingNews(true);
    try {
      const res = await fetch('/api/news');
      if (res.ok) {
        const data = await res.json();
        setNewsList(data.articles || data.news || []);
        setNewsUpdated(data.cachedAt ? new Date(data.cachedAt).toLocaleTimeString() : new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn('Failed to load news:', err);
    } finally {
      setLoadingNews(false);
    }
  };

  // Fetch Alerts
  const loadAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlertsList(data.alerts || []);
      }
    } catch (err) {
      console.warn('Failed to load alerts:', err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    loadNews();
    loadAlerts();
  }, []);

  const cpcbTable = [
    { range: '0 – 50', status: 'Good', color: 'bg-emerald-500', text: 'Minimal impact. Clean, pristine air safe for all activities.' },
    { range: '51 – 100', status: 'Satisfactory', color: 'bg-green-500', text: 'Minor breathing discomfort to sensitive people.' },
    { range: '101 – 200', status: 'Moderate', color: 'bg-yellow-500', text: 'Breathing discomfort to people with asthma, heart disease, or children/seniors.' },
    { range: '201 – 300', status: 'Poor', color: 'bg-orange-500', text: 'Breathing discomfort to most people on prolonged exposure.' },
    { range: '301 – 400', status: 'Very Poor', color: 'bg-red-500', text: 'Respiratory illness on prolonged exposure; triggers severe airway irritation.' },
    { range: '401 – 500', status: 'Severe', color: 'bg-rose-950', text: 'Affects healthy people and seriously impacts those with existing respiratory conditions.' }
  ];

  const cpcbPollutants = [
    { code: 'PM2.5', name: 'Fine Particulate Matter (≤ 2.5 µm)', limit24h: '60 µg/m³', source: 'Vehicles, biomass chulha, stubble burning, coal plants', impact: 'Penetrates deep pulmonary alveoli and enters bloodstream' },
    { code: 'PM10', name: 'Coarse Particulates (≤ 10 µm)', limit24h: '100 µg/m³', source: 'Road dust, construction, unpaved surfaces, fly ash', impact: 'Irritates nasal passages, eyes, and upper respiratory tract' },
    { code: 'NO2', name: 'Nitrogen Dioxide', limit24h: '80 µg/m³', source: 'Diesel vehicles, industrial combustion, high-temp boilers', impact: 'Triggers bronchoconstriction and increases asthma susceptibility' },
    { code: 'SO2', name: 'Sulphur Dioxide', limit24h: '80 µg/m³', source: 'Thermal power plants, coal combustion, oil refineries', impact: 'Constricts airways, aggravates chronic bronchitis' },
    { code: 'CO', name: 'Carbon Monoxide', limit24h: '2.0 mg/m³ (8h avg)', source: 'Incomplete combustion in traffic jams, smoky fires', impact: 'Binds with hemoglobin forming carboxyhemoglobin, starving organs of O2' },
    { code: 'O3', name: 'Ground-Level Ozone', limit24h: '100 µg/m³ (8h avg)', source: 'Photochemical reaction of NOx and VOCs under intense sun', impact: 'Powerful oxidant damaging lung tissue during daytime peak' }
  ];

  const emergencyNumbers = [
    {
      number: '112',
      title: 'National All-in-One Emergency Helpline',
      subtitle: 'Police, Fire, Medical, Disaster (Pan-India)',
      description: 'Single unified emergency number across all Indian states and Union Territories. Operates 24/7 with GPS vehicle dispatch.',
      badge: 'Unified National Helpline'
    },
    {
      number: '108',
      title: 'Emergency Medical & Disaster Ambulance',
      subtitle: 'State-run Emergency Response Service',
      description: 'Dedicated government ambulance response for critical trauma, cardiac arrests, acute respiratory failure, and oxygen emergencies.',
      badge: 'Free Ambulance'
    },
    {
      number: '102',
      title: 'Janani Shishu Suraksha Ambulance',
      subtitle: 'Free Mother & Infant Emergency Transport',
      description: 'Government of India national ambulance transport for pregnant mothers and newborns requiring immediate hospitalization.',
      badge: 'Maternal & Neonatal'
    },
    {
      number: '101',
      title: 'Fire & Rescue Services',
      subtitle: 'Municipal Fire Brigades',
      description: 'Immediate response for industrial fires, electrical fires, toxic smoke incidents, or building collapses.',
      badge: 'Fire Department'
    },
    {
      number: '100',
      title: 'Police Emergency Assistance',
      subtitle: 'State Police Helpline',
      description: 'Direct citizen emergency police assistance and roadside traffic hazard reporting.',
      badge: 'Police'
    },
    {
      number: '1098',
      title: 'Childline Emergency Care',
      subtitle: 'Ministry of Women & Child Development',
      description: '24-hour free nationwide emergency phone outreach service for children in need of care, protection, and medical aid.',
      badge: 'Child Welfare'
    },
    {
      number: '14567',
      title: 'Elderline National Senior Helpline',
      subtitle: 'Ministry of Social Justice & Empowerment',
      description: 'Toll-free national helpline for senior citizens offering guidance, rescue, health support, and legal assistance.',
      badge: 'Senior Citizens'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <MascotAvatar size="lg" className="mx-auto mb-2" />
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          About Foggy & Indian Air Quality Science
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          The physics of winter thermal inversions across the Indo-Gangetic plains, official CPCB National AQI (NAQI) standards, live government bulletins, verified emergency helplines, and system architecture.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: WHAT IS AQI                                                    */}
      {/* ========================================================================= */}
      <section className="interactive-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-6">
        <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
          <BookOpen className="w-4 h-4" />
          <span>Section 1: What is National AQI (CPCB NAQI)?</span>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
            How the Central Pollution Control Board Calculates Air Quality
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            The <strong>National Air Quality Index (NAQI)</strong> is a standardized "One Number-One Colour-One Description" index introduced by the Ministry of Environment, Forest and Climate Change (MoEFCC) and the Central Pollution Control Board (CPCB) in 2014. It transforms complex atmospheric concentration data of multiple pollutants into a simple <strong>0 to 500</strong> integer scale.
          </p>

          {/* Sub-index computation formula explanation */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-xs space-y-2">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-sky-500" />
              <span>CPCB Linear Interpolation Sub-Index Formula</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              For each pollutant, an individual sub-index <em>I<sub>p</sub></em> is calculated using segmented linear interpolation between official breakpoint ranges:
            </p>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-sky-700 dark:text-sky-300 text-center font-bold">
              I<sub>p</sub> = I<sub>low</sub> + [ (I<sub>high</sub> - I<sub>low</sub>) / (B<sub>high</sub> - B<sub>low</sub>) ] × (C<sub>p</sub> - B<sub>low</sub>)
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Where <em>C<sub>p</sub></em> is the 24-hour rolling average concentration, [<em>B<sub>low</sub></em>, <em>B<sub>high</sub></em>] are the concentration breakpoints, and [<em>I<sub>low</sub></em>, <em>I<sub>high</sub></em>] are the index breakpoints. The overall <strong>National AQI</strong> is determined by the <strong>maximum sub-index</strong> among all monitored pollutants (the "dominant pollutant"), provided at least three pollutants are recorded including either PM2.5 or PM10.
            </p>
          </div>

          {/* CPCB Categories Table */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-3 font-bold">NAQI Range</th>
                  <th className="py-2.5 px-3 font-bold">Category</th>
                  <th className="py-2.5 px-3 font-bold">Official CPCB Health Impact Statement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cpcbTable.map((row, i) => (
                  <tr key={i}>
                    <td className="py-3 px-3 font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${row.color}`}></span>
                      <span>{row.range}</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-200">
                      {row.status}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                      {row.text}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CPCB 6 Key Pollutants Grid */}
          <div className="pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
              Monitored Pollutants & National Ambient Air Quality Standards (NAAQS)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {cpcbPollutants.map((pol) => (
                <div
                  key={pol.code}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sky-600 dark:text-sky-400">{pol.code}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      Standard: {pol.limit24h}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">{pol.name}</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    <strong>Primary Sources:</strong> {pol.source}
                  </p>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                    <strong>Health Impact:</strong> {pol.impact}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: FOG, SMOG & AIR POLLUTION (WITH INLINE SVG DIAGRAMS)            */}
      {/* ========================================================================= */}
      <section className="interactive-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-8">
        <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
          <Wind className="w-4 h-4" />
          <span>Section 2: Fog, Smog & Atmospheric Inversions</span>
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
            Natural Fog vs Classical Winter Smog vs Photochemical Smog
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
            While natural fog is simply condensed liquid water droplets suspended in cold air, <strong>smog (smoke + fog)</strong> is a hazardous toxic cocktail formed when anthropogenic combustion pollutants interact with atmospheric dynamics.
          </p>
        </div>

        {/* Major Indian Causes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🌾</span>
              <span>Stubble Burning (Parali)</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Post-monsoon mechanized combine harvesters leave 6-inch stalks. Late October to November burning releases millions of tons of black carbon, PM2.5, CO, and volatile aromatics into northwesterly upper-level winds across the Indo-Gangetic basin.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🚗</span>
              <span>Vehicular & Road Dust</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Over 15 million two-wheelers, heavy diesel trucks, and idling vehicles emit tailpipe nanoparticles and unburnt hydrocarbons directly into ground-level breathing air, which resuspends dry silt and road dust.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🪵</span>
              <span>Biomass & Festive Smog</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              Domestic open chulha cooking with cow dung and firewood, combined with seasonal firecracker smoke and nighttime municipal garbage fires, produces severe local toxic plumes.
            </p>
          </div>
        </div>

        {/* SVG DIAGRAM 1: Thermal Inversion Layer */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-500" />
            <span>Diagram 1: Normal Atmospheric Dispersion vs Winter Thermal Inversion Lid</span>
          </h3>

          <div className="rounded-2xl p-4 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <svg
              viewBox="0 0 800 320"
              className="w-full min-w-[600px] h-auto select-none"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              {/* Left Panel: Normal Day */}
              <rect x="10" y="10" width="380" height="300" rx="16" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" className="dark:fill-slate-900 dark:stroke-slate-800" />
              <text x="30" y="38" fontSize="14" fontWeight="bold" fill="#0284c7">NORMAL CONDITIONS (Unrestricted Dispersion)</text>

              {/* Normal Altitude temperature gradient */}
              <rect x="25" y="55" width="350" height="60" rx="8" fill="#e0f2fe" opacity="0.6" />
              <text x="35" y="80" fontSize="11" fontWeight="bold" fill="#0369a1">Cooler Upper Atmosphere (-10°C to 0°C)</text>
              <text x="35" y="100" fontSize="10" fill="#0284c7">Pollutants dilute and drift harmlessly away into the troposphere</text>

              <rect x="25" y="125" width="350" height="60" rx="8" fill="#fef3c7" opacity="0.6" />
              <text x="35" y="150" fontSize="11" fontWeight="bold" fill="#b45309">Mild Mixing Boundary Layer (15°C)</text>

              <rect x="25" y="195" width="350" height="90" rx="8" fill="#fed7aa" opacity="0.6" />
              <text x="35" y="220" fontSize="11" fontWeight="bold" fill="#c2410c">Warm Ground Surface Heated by Sun (25°C)</text>

              {/* Normal rising air arrows */}
              <path d="M 120 270 Q 120 180 150 80" stroke="#0284c7" strokeWidth="3" strokeDasharray="5,5" fill="none" />
              <polygon points="150,75 144,88 156,88" fill="#0284c7" />
              <text x="165" y="170" fontSize="11" fontWeight="bold" fill="#0284c7">↑ Warm air rises freely</text>

              <path d="M 270 270 Q 270 180 300 80" stroke="#0284c7" strokeWidth="3" strokeDasharray="5,5" fill="none" />
              <polygon points="300,75 294,88 306,88" fill="#0284c7" />
              <text x="280" y="250" fontSize="10" fill="#64748b">Chimneys & exhaust vent upward</text>

              {/* Right Panel: Thermal Inversion */}
              <rect x="410" y="10" width="380" height="300" rx="16" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" className="dark:fill-slate-900 dark:stroke-slate-800" />
              <text x="430" y="38" fontSize="14" fontWeight="bold" fill="#e11d48">WINTER INVERSION (Smoke Trapped at Surface)</text>

              {/* Inversion layers */}
              <rect x="425" y="55" width="350" height="50" rx="8" fill="#e2e8f0" opacity="0.7" />
              <text x="435" y="80" fontSize="11" fontWeight="bold" fill="#475569">Cold Air Aloft (-5°C)</text>

              {/* Warm Inversion Lid */}
              <rect x="425" y="115" width="350" height="70" rx="8" fill="#fecdd3" stroke="#f43f5e" strokeWidth="1.5" />
              <text x="435" y="140" fontSize="12" fontWeight="bold" fill="#be123c">WARM INVERSION LID (20°C)</text>
              <text x="435" y="160" fontSize="10" fontWeight="semibold" fill="#9f1239">Acts as an atmospheric ceiling: Prevents any vertical airflow</text>

              {/* Stagnant Cold Smog Pool */}
              <rect x="425" y="195" width="350" height="90" rx="8" fill="#713f12" opacity="0.3" stroke="#854d0e" strokeWidth="1" />
              <text x="435" y="220" fontSize="11" fontWeight="bold" fill="#854d0e">Cold Trapped Ground Air (8°C – 12°C)</text>
              <text x="435" y="240" fontSize="10" fill="#78350f">PM2.5, PM10, NOx, CO, and soot trapped at breathing height</text>

              {/* Blocked arrows */}
              <path d="M 520 270 L 520 188" stroke="#e11d48" strokeWidth="3" fill="none" />
              <line x1="510" y1="188" x2="530" y2="188" stroke="#e11d48" strokeWidth="4" />
              <text x="535" y="260" fontSize="10" fontWeight="bold" fill="#e11d48">✕ Cannot escape upward</text>

              <path d="M 670 270 L 670 188" stroke="#e11d48" strokeWidth="3" fill="none" />
              <line x1="660" y1="188" x2="680" y2="188" stroke="#e11d48" strokeWidth="4" />
              <text x="590" y="208" fontSize="10" fill="#be123c">Hazardous Smog Pool</text>
            </svg>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            In North & East India (Punjab, Delhi, Haryana, UP, Bihar, West Bengal), night radiation rapidly cools the ground. Stagnant cold air sits trapped below a warmer descending lid, concentrating vehicular soot and parali smoke to Severe levels (AQI 400+).
          </p>
        </div>

        {/* SVG DIAGRAM 2: Classical Smog vs Photochemical Smog */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Diagram 2: Classical London-Type Winter Smog vs Photochemical Summer Smog</span>
          </h3>

          <div className="rounded-2xl p-4 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <svg
              viewBox="0 0 800 240"
              className="w-full min-w-[600px] h-auto select-none"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              {/* Left Box: Classical Winter Smog */}
              <rect x="15" y="15" width="370" height="210" rx="14" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" className="dark:fill-slate-900 dark:stroke-slate-800" />
              <text x="35" y="45" fontSize="13" fontWeight="bold" fill="#0f172a" className="dark:fill-slate-100">Classical (Reducing / Winter) Smog</text>
              <rect x="35" y="60" width="80" height="20" rx="4" fill="#64748b" />
              <text x="42" y="74" fontSize="10" fontWeight="bold" fill="#ffffff">SO2 + PM2.5</text>

              <text x="35" y="105" fontSize="11" fill="#334155" className="dark:fill-slate-300">
                • <strong>Conditions:</strong> Cold, humid riverine winters, thermal inversion
              </text>
              <text x="35" y="130" fontSize="11" fill="#334155" className="dark:fill-slate-300">
                • <strong>Chemistry:</strong> High humidity + SO2 + soot creates acidic aerosol
              </text>
              <text x="35" y="155" fontSize="11" fill="#334155" className="dark:fill-slate-300">
                • <strong>Timing:</strong> Severe at dawn (6:00 AM – 9:00 AM) and evening
              </text>
              <text x="35" y="180" fontSize="11" fill="#334155" className="dark:fill-slate-300">
                • <strong>Examples:</strong> Delhi, Kolkata, Kanpur, Patna winter smog
              </text>
              <text x="35" y="205" fontSize="11" fontWeight="bold" fill="#b91c1c">
                Primary Danger: Bronchial inflammation, coughing, COPD spikes
              </text>

              {/* Right Box: Photochemical Summer Smog */}
              <rect x="415" y="15" width="370" height="210" rx="14" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" className="dark:fill-slate-900 dark:stroke-slate-800" />
              <text x="435" y="45" fontSize="13" fontWeight="bold" fill="#0f172a" className="dark:fill-slate-100">Photochemical (Oxidizing / Summer) Smog</text>
              <rect x="435" y="60" width="80" height="20" rx="4" fill="#d97706" />
              <text x="442" y="74" fontSize="10" fontWeight="bold" fill="#ffffff">O3 + PAN + NOx</text>

              <text x="435" y="105" fontSize="11" fill="#334155" className="dark:fill-slate-300">
                • <strong>Conditions:</strong> Warm, sunny, dry, high UV solar radiation
              </text>
              <text x="435" y="130" fontSize="11" fill="#334155" className="dark:fill-slate-300">
                • <strong>Chemistry:</strong> Sunlight splits NOx + VOCs → Ground-level Ozone (O3)
              </text>
              <text x="435" y="155" fontSize="11" fill="#334155" className="dark:fill-slate-300">
                • <strong>Timing:</strong> Peaks in the afternoon (1:00 PM – 4:00 PM)
              </text>
              <text x="435" y="180" fontSize="11" fill="#334155" className="dark:fill-slate-300">
                • <strong>Examples:</strong> Mumbai, Chennai, Bengaluru, Delhi pre-monsoon
              </text>
              <text x="435" y="205" fontSize="11" fontWeight="bold" fill="#c2410c">
                Primary Danger: Deep alveolar oxidation, chest pain, eye burning
              </text>
            </svg>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: LATEST AQI NEWS FROM INDIA                                      */}
      {/* ========================================================================= */}
      <section className="interactive-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            <Newspaper className="w-4 h-4" />
            <span>Section 3: Latest AQI & Smog News Across India</span>
          </div>

          <div className="flex items-center gap-3">
            {newsUpdated && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Updated: {newsUpdated}
              </span>
            )}
            <button
              type="button"
              onClick={loadNews}
              disabled={loadingNews}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh News"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingNews ? 'animate-spin text-sky-500' : ''}`} />
            </button>
          </div>
        </div>

        {loadingNews ? (
          <div className="py-12 flex justify-center text-slate-500 text-xs gap-2 items-center">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-500" />
            <span>Fetching latest verified air quality dispatches...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {newsList.slice(0, 10).map((article, idx) => (
              <a
                key={idx}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 hover:border-sky-300 dark:hover:border-sky-600 transition-all flex flex-col justify-between group space-y-2 cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1.5">
                    <span className="font-semibold text-sky-700 dark:text-sky-400">{article.source || 'India Air News'}</span>
                    <span>{article.date ? new Date(article.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'}</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 leading-snug">
                    {article.title}
                  </h3>
                </div>
                <div className="pt-2 flex items-center justify-between text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                  <span>Read full dispatch</span>
                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: GOVERNMENT OF INDIA OFFICIAL ALERTS                             */}
      {/* ========================================================================= */}
      <section className="interactive-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-6">
        <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          <Bell className="w-4 h-4" />
          <span>Section 4: Government of India Official Portals & Alerts</span>
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
            Official Regulatory Advisories & Emergency Directives
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
            Official links to statutory regulatory bodies, Graded Response Action Plan (GRAP) orders, and national weather bulletins. Information is strictly non-promotional and directly sourced from GoI authorities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {alertsList.map((alert) => (
            <div
              key={alert.id}
              className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                    {alert.badge}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {alert.category}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {alert.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {alert.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-amber-200/60 dark:border-amber-800/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-semibold">{alert.source}</span>
                <a
                  href={alert.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Official Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: VERIFIED EMERGENCY NUMBERS                                     */}
      {/* ========================================================================= */}
      <section className="interactive-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-6">
        <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
          <Phone className="w-4 h-4" />
          <span>Section 5: Verified Emergency Helplines (Pan-India)</span>
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
            Direct Tap-to-Call Emergency Services
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
            During hazardous air episodes, severe asthma attacks, cardiac distress, or household emergencies, dial these official 24x7 Government of India emergency lines immediately.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emergencyNumbers.map((em) => (
            <div
              key={em.number}
              className="p-5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/60 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xl font-black text-rose-700 dark:text-rose-400">
                    {em.number}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300">
                    {em.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {em.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
                  {em.subtitle}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {em.description}
                </p>
              </div>

              <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/60">
                <a
                  href={`tel:${em.number}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Tap to Dial {em.number}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: ARCHITECTURE DIAGRAM & DEVELOPER CREDITS                       */}
      {/* ========================================================================= */}
      <section className="interactive-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            <Terminal className="w-4 h-4" />
            <span>Section 6: System Architecture & Credits</span>
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Engineered by Rishav Nandi
          </span>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            End-to-End System Architecture
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            Foggy is built on modern decoupled web standards with end-to-end client privacy, local persistent caching, and high-performance serverless endpoints.
          </p>
        </div>

        {/* Architecture Inline SVG Diagram */}
        <div className="rounded-2xl p-4 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <svg
            viewBox="0 0 860 360"
            className="w-full min-w-[700px] h-auto select-none"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {/* Layer 1: Client Application */}
            <rect x="20" y="20" width="220" height="320" rx="16" fill="#f8fafc" stroke="#38bdf8" strokeWidth="2" className="dark:fill-slate-900 dark:stroke-sky-600" />
            <text x="40" y="48" fontSize="13" fontWeight="bold" fill="#0284c7">1. CLIENT LAYER</text>
            <rect x="35" y="65" width="190" height="45" rx="8" fill="#e0f2fe" className="dark:fill-slate-800" />
            <text x="45" y="86" fontSize="11" fontWeight="bold" fill="#0369a1" className="dark:fill-sky-300">React 19 + Vite 6</text>
            <text x="45" y="100" fontSize="9" fill="#0284c7">Tailwind CSS (WCAG AA Contrast)</text>

            <rect x="35" y="120" width="190" height="45" rx="8" fill="#e0f2fe" className="dark:fill-slate-800" />
            <text x="45" y="141" fontSize="11" fontWeight="bold" fill="#0369a1" className="dark:fill-sky-300">Care Plan Rule Engine</text>
            <text x="45" y="155" fontSize="9" fill="#0284c7">Deterministic CPCB Diurnal Rules</text>

            <rect x="35" y="175" width="190" height="55" rx="8" fill="#e0f2fe" className="dark:fill-slate-800" />
            <text x="45" y="196" fontSize="11" fontWeight="bold" fill="#0369a1" className="dark:fill-sky-300">Firestore Web SDK Cache</text>
            <text x="45" y="210" fontSize="9" fill="#0284c7">persistentMultipleTabManager</text>
            <text x="45" y="222" fontSize="9" fill="#64748b">Offline-capable indexedDB persistence</text>

            <rect x="35" y="240" width="190" height="45" rx="8" fill="#e0f2fe" className="dark:fill-slate-800" />
            <text x="45" y="261" fontSize="11" fontWeight="bold" fill="#0369a1" className="dark:fill-sky-300">2-Step Onboarding</text>
            <text x="45" y="275" fontSize="9" fill="#0284c7">Route guards & text sanitization</text>

            {/* Arrows Layer 1 -> Layer 2 */}
            <path d="M 240 180 L 310 180" stroke="#0284c7" strokeWidth="2.5" fill="none" markerEnd="url(#arrow)" />
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#0284c7" />
              </marker>
            </defs>

            {/* Layer 2: API Gateway / Cloudflare Pages Functions */}
            <rect x="310" y="20" width="240" height="320" rx="16" fill="#f8fafc" stroke="#10b981" strokeWidth="2" className="dark:fill-slate-900 dark:stroke-emerald-600" />
            <text x="330" y="48" fontSize="13" fontWeight="bold" fill="#059669">2. SERVERLESS BACKEND</text>

            <rect x="325" y="65" width="210" height="42" rx="8" fill="#ecfdf5" className="dark:fill-slate-800" />
            <text x="335" y="85" fontSize="11" fontWeight="bold" fill="#047857" className="dark:fill-emerald-300">/api/aqi (CPCB NAQI)</text>
            <text x="335" y="98" fontSize="9" fill="#059669">Open-Meteo CAMS linear sub-index</text>

            <rect x="325" y="115" width="210" height="42" rx="8" fill="#ecfdf5" className="dark:fill-slate-800" />
            <text x="335" y="135" fontSize="11" fontWeight="bold" fill="#047857" className="dark:fill-emerald-300">/api/geocode</text>
            <text x="335" y="148" fontSize="9" fill="#059669">State alias matching & 10m cache</text>

            <rect x="325" y="165" width="210" height="42" rx="8" fill="#ecfdf5" className="dark:fill-slate-800" />
            <text x="335" y="185" fontSize="11" fontWeight="bold" fill="#047857" className="dark:fill-emerald-300">/api/chat (Foggy AI)</text>
            <text x="335" y="198" fontSize="9" fill="#059669">Gemini prompt-injection defense</text>

            <rect x="325" y="215" width="210" height="42" rx="8" fill="#ecfdf5" className="dark:fill-slate-800" />
            <text x="335" y="235" fontSize="11" fontWeight="bold" fill="#047857" className="dark:fill-emerald-300">/api/news & /api/alerts</text>
            <text x="335" y="248" fontSize="9" fill="#059669">RSS aggregator & 30m cache</text>

            <rect x="325" y="265" width="210" height="45" rx="8" fill="#ecfdf5" className="dark:fill-slate-800" />
            <text x="335" y="285" fontSize="11" fontWeight="bold" fill="#047857" className="dark:fill-emerald-300">Rate Limiter & Security</text>
            <text x="335" y="299" fontSize="9" fill="#059669">Strict CSP, IP rate-limits, Token Auth</text>

            {/* Arrows Layer 2 -> Layer 3 */}
            <path d="M 550 180 L 610 180" stroke="#059669" strokeWidth="2.5" fill="none" markerEnd="url(#arrow-green)" />
            <defs>
              <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#059669" />
              </marker>
            </defs>

            {/* Layer 3: External Data & Cloud Providers */}
            <rect x="610" y="20" width="230" height="320" rx="16" fill="#f8fafc" stroke="#f59e0b" strokeWidth="2" className="dark:fill-slate-900 dark:stroke-amber-600" />
            <text x="630" y="48" fontSize="13" fontWeight="bold" fill="#d97706">3. CLOUD & AI APIS</text>

            <rect x="625" y="65" width="200" height="52" rx="8" fill="#fffbeb" className="dark:fill-slate-800" />
            <text x="635" y="86" fontSize="11" fontWeight="bold" fill="#b45309" className="dark:fill-amber-300">Firebase Firestore & Auth</text>
            <text x="635" y="100" fontSize="9" fill="#78350f">Region: asia-south1 (Mumbai)</text>
            <text x="635" y="110" fontSize="9" fill="#64748b">Strict isOwner(uid) Security Rules</text>

            <rect x="625" y="125" width="200" height="52" rx="8" fill="#fffbeb" className="dark:fill-slate-800" />
            <text x="635" y="146" fontSize="11" fontWeight="bold" fill="#b45309" className="dark:fill-amber-300">Copernicus CAMS & Open-Meteo</text>
            <text x="635" y="160" fontSize="9" fill="#78350f">Hourly atmospheric PM2.5 & PM10</text>
            <text x="635" y="170" fontSize="9" fill="#64748b">Meteorological boundary layer wind</text>

            <rect x="625" y="185" width="200" height="52" rx="8" fill="#fffbeb" className="dark:fill-slate-800" />
            <text x="635" y="206" fontSize="11" fontWeight="bold" fill="#b45309" className="dark:fill-amber-300">Google Gemini GenAI</text>
            <text x="635" y="220" fontSize="9" fill="#78350f">Multilingual contextual assistance</text>
            <text x="635" y="230" fontSize="9" fill="#64748b">English, Hindi & Hinglish</text>

            <rect x="625" y="245" width="200" height="45" rx="8" fill="#fffbeb" className="dark:fill-slate-800" />
            <text x="635" y="266" fontSize="11" fontWeight="bold" fill="#b45309" className="dark:fill-amber-300">Government RSS Feeds</text>
            <text x="635" y="280" fontSize="9" fill="#78350f">CPCB, CAQM, IMD, NDMA SACHET</text>
          </svg>
        </div>

        {/* Developer Attribution Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-500/10 via-amber-500/10 to-teal-500/10 dark:from-sky-950/40 dark:via-slate-900 dark:to-teal-950/40 border border-sky-300/60 dark:border-sky-800/60 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
              RN
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Author & Creator
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Designed and developed by Rishav Nandi
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Full-stack engineer dedicated to open environmental data transparency and preventative public health in India.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5" />
              <span>LinkedIn</span>
            </a>
          </div>
        </div>

        {/* Medical Emergency Disclaimer */}
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-3">
          <Shield className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Medical Disclaimer:</strong> Foggy is an AI-powered atmospheric health companion and educational resource, not a certified healthcare professional. Advice is intended for exposure reduction, schedule optimization, and low-emission guidance. In any medical emergency or acute respiratory difficulty, dial <strong>112</strong> or <strong>108</strong>, or proceed to the nearest emergency hospital immediately.
          </p>
        </div>
      </section>
    </div>
  );
}
