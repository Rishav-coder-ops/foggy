import { Lock, AlertCircle } from 'lucide-react';
import {
  HEALTH_CONDITIONS,
  SENSITIVITY_LEVELS,
  LIFESTYLE_ACTIVITIES
} from '../../data/onboardingData';
import { COMMUTE_OPTIONS } from '../../context/ProfileContext';

/**
 * Reusable Form Sections for Health Conditions, Sensitivity, Commute, and Lifestyle.
 * Shared between OnboardingProfilePage and OnboardingFamilyPage.
 */
export default function PersonDetailsForm({
  conditions,
  onToggleCondition,
  otherCondition,
  onOtherConditionChange,
  sensitivity,
  onSensitivityChange,
  commute,
  onToggleCommute,
  lifestyle,
  onToggleLifestyle,
  otherLifestyle,
  onOtherLifestyleChange,
  isPet = false,
  errors = {},
  touched = {},
  fieldRefs = {}
}) {
  const isNoneExclusive = conditions.length === 1 && conditions[0] === 'None';

  return (
    <div className="space-y-6">
      {/* Health Conditions */}
      <div ref={fieldRefs.conditions} tabIndex={-1}>
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
          Health Conditions <span className="text-rose-500">*</span>
        </label>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
          Select all that apply. Choose &quot;None&quot; if there are no chronic conditions.
        </p>
        <div className="flex flex-wrap gap-2">
          {HEALTH_CONDITIONS.map((cond) => {
            const isSelected = conditions.includes(cond);
            return (
              <button
                key={cond}
                type="button"
                onClick={() => onToggleCondition(cond)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                }`}
              >
                {cond}
              </button>
            );
          })}
        </div>

        {conditions.includes('Other') && (
          <div className="mt-3">
            <label
              htmlFor="otherCondition"
              className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Please specify other condition: <span className="text-rose-500">*</span>
            </label>
            <input
              id="otherCondition"
              ref={fieldRefs.otherCondition}
              type="text"
              required
              value={otherCondition}
              onChange={(e) => onOtherConditionChange(e.target.value)}
              placeholder="e.g. Bronchiectasis, interstitial lung disease"
              maxLength={100}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        )}

        {touched.conditions && errors.conditions && (
          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.conditions}
          </p>
        )}
      </div>

      {/* Sensitivity Level */}
      <div ref={fieldRefs.sensitivity} tabIndex={-1}>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            Sensitivity Level <span className="text-rose-500">*</span>
          </label>
          {isNoneExclusive && (
            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Auto-set to Low (No conditions)
            </span>
          )}
        </div>

        <div className="space-y-2">
          {SENSITIVITY_LEVELS.map((s) => {
            const isSelected = sensitivity === s.level;
            const isLocked = isNoneExclusive && s.level !== 'Low';

            return (
              <label
                key={s.level}
                className={`block p-3 rounded-2xl border transition-all cursor-pointer ${
                  isLocked
                    ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                    : isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-800 ring-1 ring-sky-400'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="sensitivity"
                    value={s.level}
                    disabled={isLocked}
                    checked={isSelected}
                    onChange={() => onSensitivityChange(s.level)}
                    className="mt-0.5 text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {s.level}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {s.desc}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Primary Commute Methods (Omitted for pets) */}
      {!isPet && (
        <div ref={fieldRefs.commute} tabIndex={-1}>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Primary Commute Mode <span className="text-rose-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMUTE_OPTIONS.map((c) => {
              const isSelected = commute.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => onToggleCommute(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
          {touched.commute && errors.commute && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.commute}
            </p>
          )}
        </div>
      )}

      {/* Lifestyle & Habits */}
      <div>
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
          Outdoor Habits & Activities (Optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {LIFESTYLE_ACTIVITIES.map((act) => {
            const isSelected = lifestyle.includes(act);
            return (
              <button
                key={act}
                type="button"
                onClick={() => onToggleLifestyle(act)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                }`}
              >
                {act}
              </button>
            );
          })}
        </div>
        {lifestyle.includes('Other') && (
          <div className="mt-3">
            <input
              type="text"
              value={otherLifestyle}
              onChange={(e) => onOtherLifestyleChange(e.target.value)}
              placeholder="Specify other routine"
              maxLength={100}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}
