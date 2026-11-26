// src/components/onboarding/FamilyLivesAloneOption.jsx
export default function FamilyLivesAloneOption({ livesAlone, onChange }) {
  return (
    <div className="mb-6 p-4 rounded-2xl bg-slate-100 dark:bg-slate-850/70 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
      <input
        id="livesAlone"
        type="checkbox"
        checked={livesAlone}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
      />
      <label
        htmlFor="livesAlone"
        className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer leading-relaxed"
      >
        <strong className="font-bold text-slate-900 dark:text-white">
          I live alone / I have no family members to add.
        </strong>
        <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          Check this box if you are managing air pollution protection solely for yourself. You can
          add household members anytime later.
        </span>
      </label>
    </div>
  );
}
