/**
 * @fileoverview Modal dialog for requesting Firebase password reset emails.
 */

import { KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Forgot password modal dialog component.
 */
export default function ForgotPasswordModal({
  isOpen,
  onClose,
  email,
  setEmail,
  onSubmit,
  loading = false,
  error = '',
  sent = false
}) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="max-w-sm w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
        <div className="flex items-center gap-2 text-slate-800 dark:text-white mb-1">
          <KeyRound className="w-5 h-5 text-sky-500" />
          <h3 id="forgot-password-title" className="text-base font-bold">
            Reset Your Password
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Enter your registered email address and Firebase will send a secure password reset link.
        </p>

        {error && (
          <div className="my-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-1.5 border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {sent ? (
          <div className="my-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Reset email sent! Please check your inbox and spam folder.</span>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1.5 text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white rounded-lg cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
