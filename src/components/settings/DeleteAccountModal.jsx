/**
 * @fileoverview Modal dialog for confirming permanent account deletion.
 */

import { ShieldAlert } from 'lucide-react';

/**
 * Account deletion confirmation modal dialog.
 */
export default function DeleteAccountModal({
  isOpen,
  onClose,
  onSubmit,
  confirmationText,
  setConfirmationText,
  loading = false,
  error = '',
  familyCount = 0,
  memoryCount = 0
}) {
  if (!isOpen) return null;

  const isConfirmed = confirmationText.trim().toLowerCase() === 'delete';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
    >
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-2.5 text-rose-600">
          <ShieldAlert className="w-6 h-6 shrink-0" />
          <h3 id="delete-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
            Delete Account & Erase All Data?
          </h3>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          This action is <strong>irreversible</strong>. We will permanently delete your Firestore
          records (profile, {familyCount} family members, {memoryCount} learned memories), your
          authentication identity, and local storage caches.
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div>
            <label
              htmlFor="deleteConfirmation"
              className="block font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Type <strong>delete</strong> to confirm:
            </label>
            <input
              id="deleteConfirmation"
              type="text"
              required
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="delete"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-center tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || loading}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all ${
                isConfirmed && !loading
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-md cursor-pointer'
                  : 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50'
              }`}
            >
              {loading ? 'Erasing Everything...' : 'Permanently Delete Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
