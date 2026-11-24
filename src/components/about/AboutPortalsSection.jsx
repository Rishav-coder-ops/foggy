// src/components/about/AboutPortalsSection.jsx
import { Bell, ExternalLink } from 'lucide-react';
import { OFFICIAL_PORTALS } from '../../constants/about/aboutData';

export default function AboutPortalsSection() {
  return (
    <section className="interactive-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-6">
      <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
        <Bell className="w-4 h-4" />
        <span>Section 3: Government of India Official Portals &amp; Alerts</span>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
          Official Regulatory Authorities &amp; Portals
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
          Direct links to statutory regulatory bodies, Graded Response Action Plan (GRAP)
          authorities, and national weather bureaus. Never rely on unofficial summaries for
          regulatory directives — always verify live statutory orders directly on official
          government portals.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {OFFICIAL_PORTALS.map((portal) => (
          <div
            key={portal.id}
            className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                  {portal.badge}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Statutory Portal
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {portal.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {portal.description}
              </p>
            </div>

            <div className="pt-3 border-t border-amber-200/60 dark:border-amber-800/60 flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                {portal.status}
              </span>
              <a
                href={portal.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${portal.source} official portal (opens in a new tab)`}
                className="font-bold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 rounded"
              >
                <span>Official Page</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
