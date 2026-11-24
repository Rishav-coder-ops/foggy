// src/components/about/AboutScienceSection.jsx
import { Wind } from 'lucide-react';
import { INDIAN_SMOG_CAUSES } from '../../constants/about/aboutData';
import InversionDiagram from './InversionDiagram';
import SmogComparisonDiagram from './SmogComparisonDiagram';

export default function AboutScienceSection() {
  return (
    <section className="interactive-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-8">
      <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
        <Wind className="w-4 h-4" />
        <span>Section 2: Fog, Smog &amp; Atmospheric Inversions</span>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
          Natural Fog vs Classical Winter Smog vs Photochemical Smog
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
          While natural fog is simply condensed liquid water droplets suspended in cold air,{' '}
          <strong>smog (smoke + fog)</strong> is a hazardous toxic cocktail formed when
          anthropogenic combustion pollutants interact with atmospheric dynamics.
        </p>
      </div>

      {/* Major Indian Causes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {INDIAN_SMOG_CAUSES.map((cause) => (
          <div
            key={cause.title}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-1.5"
          >
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{cause.icon}</span>
              <span>{cause.title}</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
              {cause.description}
            </p>
          </div>
        ))}
      </div>

      <InversionDiagram />
      <SmogComparisonDiagram />
    </section>
  );
}
