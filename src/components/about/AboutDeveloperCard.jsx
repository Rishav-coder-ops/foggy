// src/components/about/AboutDeveloperCard.jsx
import { Github, Linkedin } from 'lucide-react';
import { DEVELOPER_CREDITS } from '../../constants/about/aboutData';

export default function AboutDeveloperCard() {
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-500/10 via-amber-500/10 to-teal-500/10 dark:from-sky-950/40 dark:via-slate-900 dark:to-teal-950/40 border border-sky-300/60 dark:border-sky-800/60 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
          RN
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Author &amp; Creator
          </span>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Designed and developed by {DEVELOPER_CREDITS.author}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {DEVELOPER_CREDITS.bio}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <a
          href={DEVELOPER_CREDITS.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={DEVELOPER_CREDITS.githubAria}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 text-white transition-colors"
        >
          <Github className="w-3.5 h-3.5" />
          <span>GitHub</span>
        </a>
        <a
          href={DEVELOPER_CREDITS.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={DEVELOPER_CREDITS.linkedinAria}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 text-white transition-colors"
        >
          <Linkedin className="w-3.5 h-3.5" />
          <span>LinkedIn</span>
        </a>
      </div>
    </div>
  );
}
