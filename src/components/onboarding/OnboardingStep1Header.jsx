// src/components/onboarding/OnboardingStep1Header.jsx
import MascotAvatar from '../MascotAvatar';
import OnboardingProgressBar from './OnboardingProgressBar';
import { AlertCircle } from 'lucide-react';

export default function OnboardingStep1Header({ formError, errorList = [] }) {
  return (
    <>
      <OnboardingProgressBar step={1} totalSteps={2} />

      <div className="flex items-center gap-3 mb-6">
        <MascotAvatar size="md" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Tell Foggy about yourself
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            We use your specific location, commute, and respiratory sensitivities to build your
            daily air pollution defense plan.
          </p>
        </div>
      </div>

      <div aria-live="polite" className="sr-only">
        {errorList.filter(Boolean).join('. ')}
      </div>

      {formError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}
    </>
  );
}
