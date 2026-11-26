// src/components/onboarding/ProfileConsentField.jsx
import { AlertCircle } from 'lucide-react';

export default function ProfileConsentField({
  consent,
  setConsent,
  onOpenPrivacyModal,
  error,
  touched,
  handleBlur,
  fieldRef
}) {
  return (
    <div
      ref={fieldRef}
      tabIndex={-1}
      className="pt-2 border-t border-slate-100 dark:border-slate-800"
    >
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (touched) handleBlur('consent');
          }}
          className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
        />
        <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          I agree to store these details to personalise my advice. I can edit or delete them
          anytime. View our{' '}
          <button
            type="button"
            onClick={onOpenPrivacyModal}
            className="text-sky-600 dark:text-sky-400 underline font-semibold hover:text-sky-500 cursor-pointer"
          >
            Privacy Notice
          </button>
          . <span className="text-rose-500">*</span>
        </span>
      </label>
      {touched && error && (
        <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}
