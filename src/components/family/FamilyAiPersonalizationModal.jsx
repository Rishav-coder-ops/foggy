// src/components/family/FamilyAiPersonalizationModal.jsx
import { X, Loader2, AlertCircle, RefreshCw, Shield } from 'lucide-react';
import MascotAvatar from '../MascotAvatar';
import { generateMemberCarePlan } from '../../utils/carePlanEngine';

function ModalCarePlanPreview({ carePlan, memberName }) {
  if (!carePlan) return null;
  return (
    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            CPCB Deterministic Protocol
          </span>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Today&apos;s Care Plan for {memberName}
          </h4>
        </div>
        <span className="text-xs text-slate-500">
          CPCB AQI:{' '}
          <strong className="text-slate-700 dark:text-slate-300">
            {carePlan.aqi} ({carePlan.category})
          </strong>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {carePlan.timeSlots.map((ts, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 text-xs flex flex-col justify-between space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200">{ts.slot}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300">
                {ts.forecastBadge}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              {ts.guidance}
            </p>
            <div className="pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px] font-medium text-amber-700 dark:text-amber-300">
              ⚡ {ts.lifestyleAdjustment}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
          <span className="font-bold text-emerald-900 dark:text-emerald-200 block mb-1.5">
            ✓ Recommended Actions
          </span>
          <ul className="space-y-1 text-emerald-900/90 dark:text-emerald-300/90 text-[11px]">
            {carePlan.doList.slice(0, 3).map((item, idx) => (
              <li key={idx} className="flex items-start gap-1">
                <span className="text-emerald-600 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
          <span className="font-bold text-rose-900 dark:text-rose-200 block mb-1.5">
            ✕ Activities to Avoid
          </span>
          <ul className="space-y-1 text-rose-900/90 dark:text-rose-300/90 text-[11px]">
            {carePlan.avoidList.slice(0, 3).map((item, idx) => (
              <li key={idx} className="flex items-start gap-1">
                <span className="text-rose-600 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs space-y-1">
        <div className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-sky-500" />
          <span>Certified Mask Guidance (N95 / FFP2)</span>
        </div>
        <p className="text-sky-800 dark:text-sky-300 text-[11px] leading-relaxed">
          {carePlan.maskAdvice}
        </p>
      </div>
    </div>
  );
}

export default function FamilyAiPersonalizationModal({
  member,
  aiMemo,
  loadingAi,
  aiError,
  aqiData,
  onClose,
  onRetry
}) {
  if (!member) return null;
  const modalCarePlan = generateMemberCarePlan(
    member,
    aqiData || { aqi: 165, category: 'Moderate' }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <MascotAvatar
              size="sm"
              mood={loadingAi ? 'thinking' : aiError ? 'concerned' : 'happy'}
            />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Foggy&apos;s Air Memo for {member.name}
              </h3>
              <span className="text-[11px] text-slate-500">
                Live AI analysis based on profile &amp; today&apos;s CPCB AQI
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loadingAi ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Foggy is tailoring precautions for {member.name}...
            </p>
            <span className="text-[11px] text-slate-400">
              Evaluating diurnal inversion and specific respiratory sensitivities
            </span>
          </div>
        ) : aiError ? (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{aiError}</span>
              </div>
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shrink-0 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try again</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700/60 leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
              {aiMemo}
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Medical Disclaimer:</strong> Foggy is an educational AI assistant, not a
                doctor. Never change prescribed medications without consulting your doctor. In case
                of severe breathlessness or emergency, call <strong>112</strong> immediately.
              </div>
            </div>
          </div>
        )}

        <ModalCarePlanPreview carePlan={modalCarePlan} memberName={member.name} />

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            Close Memo
          </button>
        </div>
      </div>
    </div>
  );
}
