// src/components/family/CarePlanDosDonts.jsx
export default function CarePlanDosDonts({ doList = [], avoidList = [] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
      <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
        <span className="font-bold text-emerald-900 dark:text-emerald-200 block mb-2">
          ✓ Recommended Actions (Do&apos;s)
        </span>
        <ul className="space-y-1.5 text-emerald-900/90 dark:text-emerald-300/90">
          {doList.map((item, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <span className="text-emerald-600 font-bold shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
        <span className="font-bold text-rose-900 dark:text-rose-200 block mb-2">
          ✕ Activities to Avoid (Don&apos;ts)
        </span>
        <ul className="space-y-1.5 text-rose-900/90 dark:text-rose-300/90">
          {avoidList.map((item, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <span className="text-rose-600 font-bold shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
