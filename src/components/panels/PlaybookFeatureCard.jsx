// src/components/panels/PlaybookFeatureCard.jsx
import { ShieldCheck } from 'lucide-react';

/**
 * Feature card preview for the Clean Air Playbook on the Landing Page.
 */
export default function PlaybookFeatureCard({ cardRef, isOpen, onOpen }) {
  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
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
          Practical particulate reduction strategies for every budget. From zero-rupee draft sealing
          and damp-mopping to DIY Corsi-Rosenthal boxes and induction cooking.
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
  );
}
