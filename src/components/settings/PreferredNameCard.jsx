/**
 * @fileoverview Card allowing users to set their preferred greeting name for Foggy.
 */

import { User, Check } from 'lucide-react';

/**
 * Settings card for updating preferred greeting name.
 */
export default function PreferredNameCard({
  callName,
  setCallName,
  callNameError,
  setCallNameError,
  callNameSaved,
  onSave
}) {
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-soft dark:shadow-soft-dark space-y-4">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-5 h-5 text-sky-500" />
          <span>What should Foggy call you?</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Your preferred name or nickname used in dashboard greetings and conversational AI
          responses.
        </p>
      </div>

      <form
        onSubmit={onSave}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
      >
        <div className="w-full sm:max-w-xs">
          <input
            type="text"
            required
            maxLength={30}
            value={callName}
            onChange={(e) => {
              setCallName(e.target.value);
              setCallNameError('');
            }}
            placeholder="e.g. Rajesh, Dr. Sharma, Priya"
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {callNameError && <p className="text-[11px] text-rose-600 mt-1">{callNameError}</p>}
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          {callNameSaved ? (
            <>
              <Check className="w-4 h-4 text-emerald-200" />
              <span>Saved!</span>
            </>
          ) : (
            <span>Save Name</span>
          )}
        </button>
      </form>
    </div>
  );
}
