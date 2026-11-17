// src/pages/AboutPage.jsx
import React from 'react';
import { Wind, ShieldAlert, Heart, BookOpen, Layers, Terminal, Sparkles, ExternalLink } from 'lucide-react';
import MascotAvatar from '../components/MascotAvatar';

export default function AboutPage() {
  const aqiTable = [
    { range: '0 – 50', status: 'Good', color: 'bg-emerald-500', text: 'Air quality is satisfactory; little to no risk.' },
    { range: '51 – 100', status: 'Moderate', color: 'bg-amber-400', text: 'Acceptable; unusually sensitive individuals may experience mild symptoms.' },
    { range: '101 – 150', status: 'Unhealthy for Sensitive Groups', color: 'bg-orange-500', text: 'Children, seniors, and people with asthma/heart disease are at risk.' },
    { range: '151 – 200', status: 'Unhealthy', color: 'bg-red-500', text: 'Everyone may begin to experience adverse effects; sensitive groups affected more seriously.' },
    { range: '201 – 300', status: 'Very Unhealthy', color: 'bg-purple-600', text: 'Health alert: significant increase in risk across the entire population.' },
    { range: '301+', status: 'Hazardous', color: 'bg-rose-900', text: 'Health emergency: serious risk of respiratory and vascular complications for all.' }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <MascotAvatar size="lg" className="mx-auto mb-2" />
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          About Foggy & Winter Smog Science
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Understanding the physics of winter thermal inversions, PM2.5 particulate hazards, and how individual actions protect our communities.
        </p>
      </div>

      {/* Science Breakdown Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-6">
        <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
          <Wind className="w-4 h-4" />
          <span>The Science of Winter Air Pollution</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Why Is Winter Smog So Severe? (Thermal Inversions)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Normally, air temperature decreases with altitude, allowing warm surface air to rise and disperse pollutants. In winter, especially in valleys or basins, cold dense air settles near the ground beneath a layer of warm air. This creates an <strong>atmospheric lid</strong> that traps vehicle emissions, domestic wood smoke, and industrial particulates near ground level for days or weeks.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              What Is PM2.5 and Why Is It Dangerous?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              PM2.5 consists of particulate matter less than <strong>2.5 micrometers</strong> in diameter—about 3% the width of a human hair. Because of their microscopic size, PM2.5 particles bypass the nose and throat filters, penetrating deep into lung alveoli and passing directly into the bloodstream, triggering systemic vascular inflammation, asthma attacks, and cardiovascular stress.
            </p>
          </div>
        </div>
      </div>

      {/* AQI Standards Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
          US EPA Air Quality Index (AQI) Scale Reference
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3 font-bold">AQI Level</th>
                <th className="py-2.5 px-3 font-bold">Category</th>
                <th className="py-2.5 px-3 font-bold">Health Meaning & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {aqiTable.map((row, i) => (
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
      </div>

      {/* Architecture & Open Source */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
          <Terminal className="w-4 h-4" />
          <span>System Architecture & APIs</span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Foggy is built with modern web technologies and a decoupled backend proxy to guarantee API key security:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <h4 className="font-bold text-slate-800 dark:text-white mb-1">Frontend Client</h4>
            <p className="text-slate-600 dark:text-slate-400">
              React + Vite + Tailwind CSS. High-contrast theme palette (Crisp Fog & Midnight Smog) meeting WCAG AA standards.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <h4 className="font-bold text-slate-800 dark:text-white mb-1">Secure Backend Proxy</h4>
            <p className="text-slate-600 dark:text-slate-400">
              Node.js + Express proxy on port 3001 with IP rate limiting to protect free-tier quotas and shield API secrets.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <h4 className="font-bold text-slate-800 dark:text-white mb-1">Dual AI & Sensor Pipeline</h4>
            <p className="text-slate-600 dark:text-slate-400">
              Direct connection to Google Gemini & WAQI with intelligent fallback engines when API keys are omitted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
