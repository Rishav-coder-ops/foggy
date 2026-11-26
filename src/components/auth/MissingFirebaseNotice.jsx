/**
 * @fileoverview Banner warning user when Firebase environment variables are not configured.
 */

import { AlertCircle } from 'lucide-react';

/**
 * Notice banner for unconfigured Firebase environment.
 */
export default function MissingFirebaseNotice({ missingVars = [] }) {
  if (!missingVars || missingVars.length === 0) return null;

  return (
    <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
      <div className="flex items-center gap-2 font-bold mb-1">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Firebase Configuration Notice</span>
      </div>
      <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
        Firebase environment variables are missing or unconfigured. Real Firebase Authentication
        requires the following variables in your{' '}
        <code className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-mono text-[10px]">
          .env
        </code>{' '}
        or Cloudflare Pages settings:
      </p>
      <ul className="mt-2 list-disc list-inside font-mono text-[10px] text-amber-700 dark:text-amber-400 space-y-0.5">
        {missingVars.map((v) => (
          <li key={v}>{v}</li>
        ))}
      </ul>
    </div>
  );
}
