/**
 * @fileoverview Modal dialog explaining Foggy's health data privacy guarantee.
 */

import { ShieldCheck } from 'lucide-react';

/**
 * Privacy notice modal dialog for onboarding and profile settings.
 */
export default function PrivacyConsentModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-2.5 text-sky-600 dark:text-sky-400">
          <ShieldCheck className="w-5 h-5" />
          <h3
            id="privacy-modal-title"
            className="text-base font-bold text-slate-900 dark:text-white"
          >
            Privacy & Data Guarantee
          </h3>
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
          <p>
            <strong>Zero Public Training:</strong> Your health conditions and family details are
            never sold, published, or used to train public foundation models.
          </p>
          <p>
            <strong>Secure Storage:</strong> Stored securely in your isolated user database on
            Firebase Firestore (region <code>asia-south1</code>), protected by security rules
            permitting access solely to your verified user ID.
          </p>
          <p>
            <strong>Complete Control:</strong> You can edit or permanently erase all your data and
            account records at any time from the <strong>Settings</strong> page.
          </p>
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
