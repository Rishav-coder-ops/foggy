// src/components/about/AboutDisclaimerSection.jsx
import { Terminal, Shield } from 'lucide-react';
import ArchitectureDiagram from './ArchitectureDiagram';
import AboutDeveloperCard from './AboutDeveloperCard';
import { DEVELOPER_CREDITS } from '../../constants/about/aboutData';

export default function AboutDisclaimerSection() {
  return (
    <section className="interactive-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
          <Terminal className="w-4 h-4" />
          <span>Section 5: System Architecture &amp; Credits</span>
        </div>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Engineered with{' '}
          <span role="img" aria-label="love">
            ❤️
          </span>{' '}
          by{' '}
          <a
            href={DEVELOPER_CREDITS.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={DEVELOPER_CREDITS.githubAria}
            className="hover:text-sky-500 transition-colors underline-offset-2 hover:underline"
          >
            {DEVELOPER_CREDITS.author}
          </a>
        </span>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          End-to-End System Architecture
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
          Foggy is built on modern decoupled web standards with end-to-end client privacy, local
          persistent caching, and high-performance serverless endpoints.
        </p>
      </div>

      <ArchitectureDiagram />
      <AboutDeveloperCard />

      {/* Medical Emergency Disclaimer */}
      <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-3">
        <Shield className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Medical Disclaimer:</strong> Foggy is an AI-powered atmospheric health companion
          and educational resource, not a certified healthcare professional. Advice is intended
          for exposure reduction, schedule optimization, and low-emission guidance. In any medical
          emergency or acute respiratory difficulty, dial <strong>112</strong> or{' '}
          <strong>108</strong>, or proceed to the nearest emergency hospital immediately.
        </p>
      </div>
    </section>
  );
}
