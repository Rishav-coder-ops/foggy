// src/components/onboarding/OnboardingProgressBar.jsx
export default function OnboardingProgressBar({ step = 1, _totalSteps = 2 }) {
  const isStep1 = step === 1;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
        {isStep1 ? (
          <>
            <span className="text-sky-600 dark:text-sky-400 font-extrabold flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px]">
                1
              </span>
              About you (Step 1 of 2)
            </span>
            <span className="text-slate-400">Step 2: Family & Household</span>
          </>
        ) : (
          <>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                ✓
              </span>
              Step 1: About you
            </span>
            <span className="text-sky-600 dark:text-sky-400 font-extrabold flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px]">
                2
              </span>
              Your family and household (Step 2 of 2)
            </span>
          </>
        )}
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className={`bg-sky-500 h-full transition-all duration-300 ${isStep1 ? 'w-1/2' : 'w-full'}`}
        ></div>
      </div>
    </div>
  );
}
