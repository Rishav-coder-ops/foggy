// src/components/panels/PlaybookCardGrid.jsx
import { MessageSquare } from 'lucide-react';

/**
 * Grid of actionable intervention cards in the Clean Air Playbook.
 */
export default function PlaybookCardGrid({ items = [], onAskFoggy }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="p-5 rounded-2xl bg-[#E2E8F0] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] shadow-xs space-y-3 flex flex-col justify-between transition-all duration-200 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-md"
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-extrabold text-[#334155] dark:text-[#F8FAFC]">
                {item.action}
              </h4>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 text-[#334155] dark:text-[#F8FAFC] border border-[#CBD5E1] dark:border-[#334155] shrink-0">
                {item.cost}
              </span>
            </div>

            {/* Tags row */}
            <div className="flex items-center gap-2 flex-wrap text-[10px]">
              <span className="px-2 py-0.5 rounded-full font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-200 border border-sky-300 dark:border-sky-800">
                Effort: {item.effort}
              </span>
              <span className="px-2 py-0.5 rounded-full font-bold bg-white dark:bg-slate-900 text-[#334155] dark:text-[#CBD5E1] border border-[#CBD5E1] dark:border-[#334155]">
                Benefits: {item.target}
              </span>
            </div>

            {/* Estimated Impact */}
            <div className="p-2.5 rounded-xl bg-emerald-100/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-100">
              <span className="font-bold block text-[10px] uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                Estimated Particulate Impact
              </span>
              <span className="font-black text-xs">{item.impact}*</span>
            </div>

            {/* How to do it */}
            <p className="text-xs text-[#334155] dark:text-[#CBD5E1] leading-relaxed pt-1 font-medium">
              {item.howTo}
            </p>
          </div>

          {/* Card Footer: AQI relevance & Ask Foggy */}
          <div className="pt-3 border-t border-[#CBD5E1] dark:border-[#334155] flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 italic">
              {item.aqiRelevance}
            </span>

            <button
              type="button"
              onClick={() => onAskFoggy(item)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-sky-600 hover:text-white dark:hover:bg-sky-500 dark:hover:text-slate-950 text-[#334155] dark:text-[#F8FAFC] border border-[#CBD5E1] dark:border-[#334155] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask Foggy</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
