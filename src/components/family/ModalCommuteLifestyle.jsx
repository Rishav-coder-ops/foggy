// src/components/family/ModalCommuteLifestyle.jsx
import { COMMUTE_STYLES, LIFESTYLE_ACTIVITIES } from '../../data/onboardingData';

export default function ModalCommuteLifestyle({ formData, onChange }) {
  return (
    <>
      {/* Commute */}
      <div>
        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Daily Commute Styles
        </label>
        <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          {COMMUTE_STYLES.map((cm) => {
            const isChecked = formData.commute.includes(cm);
            return (
              <label
                key={cm}
                className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-800 dark:text-slate-200"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...formData.commute, cm]
                      : formData.commute.filter((c) => c !== cm);
                    onChange((prev) => ({ ...prev, commute: next }));
                  }}
                  className="rounded text-sky-500 focus:ring-sky-400"
                />
                <span>{cm}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Lifestyle Habits */}
      <div>
        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Outdoor Activities &amp; Habits
        </label>
        <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          {LIFESTYLE_ACTIVITIES.map((ls) => {
            const isChecked = formData.lifestyle.includes(ls);
            return (
              <label
                key={ls}
                className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-800 dark:text-slate-200"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...formData.lifestyle, ls]
                      : formData.lifestyle.filter((l) => l !== ls);
                    onChange((prev) => ({ ...prev, lifestyle: next }));
                  }}
                  className="rounded text-sky-500 focus:ring-sky-400"
                />
                <span>{ls}</span>
              </label>
            );
          })}
        </div>
      </div>
    </>
  );
}
