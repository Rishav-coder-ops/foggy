// src/components/onboarding/OnboardingStep2Footer.jsx
import { Check, Loader2 } from 'lucide-react';

export default function OnboardingStep2Footer({ onBack, isValid, submitting, onSubmit }) {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
      <button
        type="button"
        onClick={onBack}
        className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
      >
        ← Back to Profile
      </button>

      <button
        type="button"
        disabled={!isValid || submitting}
        onClick={onSubmit}
        className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer ${
          isValid && !submitting
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:scale-[1.02]'
            : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed opacity-60'
        }`}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Personalising Dashboard...</span>
          </>
        ) : (
          <>
            <Check className="w-4 h-4" />
            <span>Complete Setup & Open Dashboard</span>
          </>
        )}
      </button>
    </div>
  );
}
