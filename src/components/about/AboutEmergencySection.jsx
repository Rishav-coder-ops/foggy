// src/components/about/AboutEmergencySection.jsx
import { Phone } from 'lucide-react';
import { EMERGENCY_NUMBERS } from '../../constants/about/aboutData';

export default function AboutEmergencySection() {
  return (
    <section
      id="emergency"
      className="interactive-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-6"
    >
      <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
        <Phone className="w-4 h-4" />
        <span>Section 4: Verified Emergency Helplines (Pan-India)</span>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
          Direct Tap-to-Call Emergency Services
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
          During hazardous air episodes, severe asthma attacks, cardiac distress, or household
          emergencies, dial these official 24x7 Government of India emergency lines immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EMERGENCY_NUMBERS.map((em) => (
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
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{em.title}</h3>
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
  );
}
