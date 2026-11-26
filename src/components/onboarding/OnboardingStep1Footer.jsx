// src/components/onboarding/OnboardingStep1Footer.jsx
import { Loader2, ChevronRight } from 'lucide-react';

export default function OnboardingStep1Footer({ isValid, submitting }) {
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-[11px] text-slate-400">
        All 10 fields are required to unlock your personalized advice.
      </p>
      <button
        type="submit"
        disabled={!isValid || submitting}
        className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer ${
          isValid && !submitting
            ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/20 hover:scale-[1.02]'
            : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed opacity-60'
        }`}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Saving details...</span>
          </>
        ) : (
          <>
            <span>Next: Family & Household</span>
            <ChevronRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
