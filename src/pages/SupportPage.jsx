// src/pages/SupportPage.jsx
// Comprehensive Help, FAQ Accordion, Emergency Contacts, and Support Channels
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MascotAvatar from '../components/MascotAvatar';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  PhoneCall,
  Mail,
  Github,
  Shield,
  Trash2,
  ExternalLink,
  LifeBuoy
} from 'lucide-react';

const FAQS = [
  {
    q: 'How does Foggy work and personalize my guidance?',
    a: 'Foggy combines ground-truth satellite and atmospheric model feeds (from Copernicus Atmosphere Monitoring Service via Open-Meteo) with your household vulnerability profile. It calculates official Indian Central Pollution Control Board (CPCB) NAQI categories and provides personalized, actionable exposure mitigation strategies (such as window opening schedules, commute swaps, and HEPA filter timings).'
  },
  {
    q: 'Where does the air quality data come from?',
    a: 'Air quality data is sourced hourly from the Open-Meteo Air Quality API, using the European Copernicus Atmosphere Monitoring Service (CAMS) atmospheric model (0.4° global resolution, ~40 km). For live ground-truth comparison where sensor feeds exist, nearest station references are shown.'
  },
  {
    q: 'What are the accuracy limits of modeled air data?',
    a: 'Atmospheric models provide regional and city-wide estimates based on meteorological dispersion physics and satellite aerosol optical depth. They do not represent a localized physical sensor reading on your exact balcony or street corner. For clinical or acute medical decisions, always refer to local official CPCB/SPCB continuous ambient monitoring stations.'
  },
  {
    q: 'How does Foggy protect my privacy and sensitive health data?',
    a: 'Your health conditions (such as asthma, COPD, and hypertension) and family dependent details are stored in your private, isolated Firestore database tree (region asia-south1), locked by database security rules that verify your authentication token. We do not sell user data, train public foundation models on your family details, or share health profiles with third parties.'
  },
  {
    q: 'How can I permanently delete all my data and account?',
    a: 'You have complete sovereignty over your data. Go to your Settings page, scroll to the "Danger Zone" section at the bottom, and click "Delete Account". After confirming with DELETE and re-authenticating, all your cloud Firestore records, family profiles, chat memories, and local browser storage are irreversibly wiped.'
  }
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Help & Customer Support</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            Foggy Support & FAQ
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Answers to common questions regarding data sourcing, respiratory safeguards, account privacy, and assistance channels.
          </p>
        </div>

        <MascotAvatar size="md" className="hidden sm:block" />
      </div>

      {/* Emergency Alert Banner */}
      <div className="rounded-3xl p-5 sm:p-6 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs sm:text-sm text-rose-900 dark:text-rose-200 space-y-3">
        <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300">
          <PhoneCall className="w-4 h-4 text-rose-600" />
          <span>Medical Emergency or Severe Respiratory Distress?</span>
        </div>
        <p className="leading-relaxed text-xs">
          Foggy is an educational AI assistant, <strong>not a doctor or medical provider</strong>. If you or a family member experience shortness of breath, severe chest tightness, or respiratory failure, call immediate emergency responders:
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href="tel:112"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-transform active:scale-95 cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call 112 (National Emergency)</span>
          </a>
          <a
            href="tel:108"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/80 dark:hover:bg-rose-800 text-rose-900 dark:text-rose-100 font-bold text-xs transition-colors cursor-pointer"
          >
            <span>Call 108 (Ambulance)</span>
          </a>
          <Link
            to="/about#emergency"
            className="text-xs font-semibold text-rose-700 dark:text-rose-400 underline hover:text-rose-600"
          >
            View all official helpline numbers →
          </Link>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-soft dark:shadow-soft-dark space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <HelpCircle className="w-5 h-5 text-sky-500" />
          <span>Frequently Asked Questions</span>
        </h2>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 hover:text-sky-600 dark:hover:text-sky-400 focus:outline-none"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-sky-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Support & Contact Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Email Support */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft dark:shadow-soft-dark space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Report an Issue or Feedback
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Encountered a bug, incorrect station geocoding, or have a suggestion? Email our support desk directly.
            </p>
          </div>
          <a
            href="mailto:support@foggy.app?subject=Foggy%20Assistant%20Feedback"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline pt-1"
          >
            <span>support@foggy.app</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* GitHub Repository */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft dark:shadow-soft-dark space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <Github className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Open Source GitHub Repo
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Inspect our open source codebase, report technical bugs on GitHub Issues, or view release roadmaps.
            </p>
          </div>
          <a
            href="https://github.com/Rishav-coder-ops/foggy"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-sky-500 pt-1"
          >
            <span>github.com/Rishav-coder-ops/foggy</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
