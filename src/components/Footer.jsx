// src/components/Footer.jsx
import React from 'react';
import { ShieldAlert, Heart, Wind, Github } from 'lucide-react';
import MascotAvatar from './MascotAvatar';

export default function Footer() {
  return (
    <footer className="mt-16 mb-20 lg:mb-0 border-t border-slate-200/90 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <MascotAvatar size="sm" />
              <span className="text-lg font-extrabold text-slate-800 dark:text-white">
                Foggy
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              A friendly, GenAI-powered assistant built to protect families and urban communities during severe winter smog and air pollution episodes.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1">
              <span className="inline-flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-sky-500" /> CPCB NAQI & Open-Meteo
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" /> Family Health Protection
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3">
              Explore Foggy
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li><a href="/dashboard" className="hover:text-sky-500 transition-colors">Air Quality Dashboard</a></li>
              <li><a href="/chat" className="hover:text-sky-500 transition-colors">Chat with Foggy (GenAI)</a></li>
              <li><a href="/indoor-hacks" className="hover:text-sky-500 transition-colors">Budget Indoor Air Hacks</a></li>
              <li><a href="/family" className="hover:text-sky-500 transition-colors">Family Health Profiles</a></li>
              <li><a href="/memory" className="hover:text-sky-500 transition-colors">What Foggy Knows (Privacy)</a></li>
            </ul>
          </div>

          {/* Data & Tech */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3">
              Data & APIs
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li><a href="https://cpcb.nic.in" target="_blank" rel="noreferrer" className="hover:text-sky-500 transition-colors">CPCB National AQI Standards</a></li>
              <li><a href="https://open-meteo.com" target="_blank" rel="noreferrer" className="hover:text-sky-500 transition-colors">Open-Meteo Air Quality (CAMS)</a></li>
              <li><a href="/about" className="hover:text-sky-500 transition-colors">Documentation & Roadmap</a></li>
            </ul>
          </div>
        </div>

        {/* Safety & Medical Disclaimer Banner */}
        <div className="rounded-2xl p-4 bg-slate-200/70 dark:bg-slate-800/80 border border-slate-300/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-800 dark:text-slate-200">Important Health & Safety Disclaimer:</strong> Foggy provides practical exposure mitigation guidance and air quality information based on public health research and sensor feeds. Foggy is an educational AI assistant, <strong>not a doctor or healthcare professional</strong>. In an emergency or severe respiratory distress, immediately call <strong>112 (India National Emergency)</strong> or consult a qualified physician. Never disregard medical advice based on AI recommendations.
          </p>
        </div>

        {/* Air Quality Data Attribution & Model Disclaimer */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-200/50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
          <p>
            <strong>Air Quality Attribution:</strong> Air quality data: Open-Meteo.com, based on Copernicus Atmosphere Monitoring Service (CAMS) model data.
          </p>
          <p className="italic">
            <strong>Model Disclaimer:</strong> Modelled estimates, not a sensor reading at your exact location; use official local AQI stations for health decisions.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-3">
          <p>© {new Date().getFullYear()} Foggy Air Quality Assistant. Developed by <strong>Rishav Nandi</strong>. Open Source under MIT License.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> India-First • CPCB NAQI Standard
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
