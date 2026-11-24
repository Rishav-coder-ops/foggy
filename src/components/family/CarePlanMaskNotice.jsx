// src/components/family/CarePlanMaskNotice.jsx
import { Shield, AlertTriangle, Phone } from 'lucide-react';

export default function CarePlanMaskNotice({ carePlan }) {
  return (
    <>
      {/* Mask Guidance & Commute Advice */}
      <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs space-y-1.5">
        <div className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-2">
          <Shield className="w-4 h-4 text-sky-500" />
          <span>Certified Mask Guidance (N95 / FFP2)</span>
        </div>
        <p className="text-sky-800 dark:text-sky-300 leading-relaxed text-[11px]">
          {carePlan.maskAdvice}
        </p>
        {carePlan.commuteTips && carePlan.commuteTips.length > 0 && (
          <div className="pt-2 border-t border-sky-200/60 dark:border-sky-800/60 text-[11px] text-sky-800 dark:text-sky-300 space-y-1">
            <strong>Commute Safeties:</strong>
            {carePlan.commuteTips.map((tip, idx) => (
              <p key={idx}>• {tip}</p>
            ))}
          </div>
        )}
      </div>

      {/* Condition Reminders (Asthma with salbutamol rescue inhaler, senior, child) */}
      {carePlan.conditionReminders && carePlan.conditionReminders.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs space-y-1.5">
          <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Condition-Specific Health Reminders</span>
          </div>
          {carePlan.conditionReminders.map((rem, idx) => (
            <p
              key={idx}
              className="text-amber-900/90 dark:text-amber-200/90 text-[11px] leading-relaxed"
            >
              {rem}
            </p>
          ))}
        </div>
      )}

      {/* Hydration & Medical Trigger Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] pt-3 border-t border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400">
        <div>
          <strong>Hydration:</strong> {carePlan.hydrationAdvice}
        </div>
        <div className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold shrink-0">
          <Phone className="w-3.5 h-3.5" />
          <span>Medical emergency? Call 112 immediately.</span>
        </div>
      </div>
    </>
  );
}
