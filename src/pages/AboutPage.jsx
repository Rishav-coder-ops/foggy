// src/pages/AboutPage.jsx
// About Foggy & Winter Smog Science with Indian CPCB National AQI Scale
import React from 'react';
import { Wind, ShieldAlert, Heart, BookOpen, Layers, Terminal, Sparkles, ExternalLink, Shield } from 'lucide-react';
import MascotAvatar from '../components/MascotAvatar';

export default function AboutPage() {
  const cpcbTable = [
    { range: '0 – 50', status: 'Good', color: 'bg-emerald-500', text: 'Minimal impact. Air quality is safe for all outdoor activities.' },
    { range: '51 – 100', status: 'Satisfactory', color: 'bg-green-500', text: 'Minor breathing discomfort to sensitive people.' },
    { range: '101 – 200', status: 'Moderate', color: 'bg-yellow-500', text: 'Breathing discomfort to the people with lungs, asthma and heart diseases.' },
    { range: '201 – 300', status: 'Poor', color: 'bg-orange-500', text: 'Breathing discomfort to most people on prolonged exposure.' },
    { range: '301 – 400', status: 'Very Poor', color: 'bg-red-500', text: 'Respiratory illness on prolonged exposure.' },
    { range: '401 – 500', status: 'Severe', color: 'bg-rose-950', text: 'Affects healthy people and seriously impacts those with existing diseases.' }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <MascotAvatar size="lg" className="mx-auto mb-2" />
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          About Foggy & Indian Air Quality Science
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Understanding the physics of winter thermal inversions across the Indo-Gangetic plains, CPCB National AQI (NAQI) standards, and practical household protection.
        </p>
      </div>

      {/* Science Breakdown Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-6">
        <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
          <Wind className="w-4 h-4" />
          <span>The Science of Winter Air Pollution in India</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Why Is Winter Smog So Severe? (Indo-Gangetic Inversions)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Normally, warm ground air rises, dispersing pollutants into the upper atmosphere. In winter, cooler stagnant air gets trapped beneath a warm air blanket across the river valleys of North and East India. Combined with low wind speeds, this <strong>thermal inversion lid</strong> traps post-harvest crop-residue burning (parali), Diwali fireworks, road dust, biomass chulha smoke, and vehicular tailpipe emissions right at breathing level.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              What Is PM2.5 and Why Is It Dangerous?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              PM2.5 consists of microscopic particulate matter smaller than <strong>2.5 micrometers</strong>—roughly 3% the thickness of a human hair. Because nasal passages cannot filter them, PM2.5 penetrates into the deepest pulmonary alveoli and enters the bloodstream. This triggers asthma attacks, acute bronchitis, reduced lung capacity in children, and elevated cardiovascular stress.
            </p>
          </div>
        </div>
      </div>

      {/* CPCB National AQI Standards Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              CPCB National Air Quality Index (NAQI) Scale Reference
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Official Central Pollution Control Board (CPCB) categories and health statements (0–500 scale).
            </p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 shrink-0 self-start sm:self-auto">
            Official Indian Standard
          </span>
        </div>

        <div className="overflow-x-auto">
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
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {row.text}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-2">
          *Note: Foggy displays Estimated NAQI computed from Open-Meteo CAMS atmospheric model data. Official station readings may differ; check the official CPCB bulletin or the SAMEER app for authoritative local measurements.
        </p>
      </div>

      {/* Graded Response Action Plan (GRAP) Context */}
      <div className="rounded-3xl bg-slate-50 dark:bg-slate-850 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          <ShieldAlert className="w-4 h-4" />
          <span>Delhi-NCR Graded Response Action Plan (GRAP) Guidelines</span>
        </div>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          The Commission for Air Quality Management (CAQM) enforces staged emergency restrictions (Stage I Poor through Stage IV Severe+) across Delhi-NCR. Restrictions may include bans on non-essential construction, diesel generator limits, and school shifts. For official active orders, please consult the{' '}
          <a
            href="https://caqm.nic.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 dark:text-sky-400 underline font-semibold inline-flex items-center gap-1"
          >
            CAQM official portal <ExternalLink className="w-3 h-3" />
          </a>{' '}
          and the Central Pollution Control Board.
        </p>
      </div>

      {/* Architecture & Open Source */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            <Terminal className="w-4 h-4" />
            <span>Architecture & Developer Attribution</span>
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Created by Rishav Nandi
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Foggy is an open-access air companion designed for Indian cities, utilizing Web-standard APIs and decoupled proxies:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <h4 className="font-bold text-slate-800 dark:text-white mb-1">Frontend Client</h4>
            <p className="text-slate-600 dark:text-slate-400">
              React + Vite + Tailwind CSS with high-contrast theme variables (#E2E8F0 / #1E293B) strictly meeting WCAG AA contrast.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <h4 className="font-bold text-slate-800 dark:text-white mb-1">CAMS Atmospheric Model</h4>
            <p className="text-slate-600 dark:text-slate-400">
              Hourly PM2.5 and PM10 feeds from Open-Meteo based on Copernicus Atmosphere Monitoring Service (CAMS) data.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <h4 className="font-bold text-slate-800 dark:text-white mb-1">Intelligent GenAI Guide</h4>
            <p className="text-slate-600 dark:text-slate-400">
              Google Gemini GenAI proxy supporting English, Hindi (हिन्दी), and Hinglish with automatic privacy-preserving local memory extraction.
            </p>
          </div>
        </div>

        {/* Medical Emergency Disclaimer */}
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2.5">
          <Shield className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <p>
            <strong>Medical Disclaimer:</strong> Foggy is an AI assistant, not a doctor. Advice is intended for exposure reduction and educational guidance only. In any medical emergency or acute respiratory distress, please call <strong>112</strong> or visit the nearest hospital immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
