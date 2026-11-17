// src/pages/LandingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Wind, Shield, Users, Leaf, ArrowRight, Sparkles, CheckCircle2, HeartHandshake, DollarSign, Activity } from 'lucide-react';
import MascotAvatar from '../components/MascotAvatar';
import ImpactBadge from '../components/ImpactBadge';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated, loginAsDemo } = useAuth();

  return (
    <div className="relative overflow-hidden">
      {/* Misty atmospheric backdrop gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-sky-200/40 via-amber-100/20 to-transparent dark:from-sky-950/30 dark:via-slate-900/40 pointer-events-none blur-3xl -z-10"></div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-sky-100/90 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-300/80 dark:border-sky-800 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>GenAI Air Quality Companion for Severe Winter Smog</span>
          </div>

          {/* Hero Mascot Icon */}
          <div className="flex justify-center py-2">
            <MascotAvatar size="hero" mood="happy" className="shadow-lg hover:scale-105 transition-transform" />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-amber-500">Foggy</span>, Your Personal Shield Against Winter Smog.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            A friendly, knowledgeable, and reassuring AI companion that helps your household navigate severe urban air pollution with practical, low-emission daily routines, budget DIY air hacks, and tailored health safeguards.
          </p>

          {/* Direct Impact Teaser */}
          <div className="pt-2 flex justify-center">
            <ImpactBadge
              co2Saved="~2.4 kg CO2 / trip"
              pmReduced="-65% PM2.5 inhaled"
              healthBenefit="Asthma flare-up protection"
              costTradeoff="DIY Filter < $35"
            />
          </div>

          {/* CTA Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/chat"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-md flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat with Foggy</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-sm font-bold bg-slate-900 hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 text-white shadow-md flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={loginAsDemo}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-sm font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Try 1-Click Demo Profile</span>
                </button>
              </>
            )}

            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              View Live AQI Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Intelligent Protection
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Everything your community needs to stay safe & breathe easier
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="interactive-card rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-soft dark:shadow-soft-dark space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              GenAI Conversational Guide
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Foggy greets you by name, understands your household members (asthma, seniors, children, pets), and crafts reassuring, practical plans without ever inducing panic.
            </p>
            <div className="pt-2 text-xs font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1">
              <span>Powered by Google Gemini</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="interactive-card rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-soft dark:shadow-soft-dark space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Wind className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              24-Hour Smog Inversion Curves
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Live WAQI sensor integration detects peak morning and evening thermal inversions, pinpointing the optimal midday outdoor exercise and dog-walking windows.
            </p>
            <div className="pt-2 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span>Live + Simulation Fallback</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="interactive-card rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-soft dark:shadow-soft-dark space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Budget DIY Hacks & Direct Impact
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every single recommendation details emission savings (kg CO2) and direct particulate exposure reduction with a low-cost DIY alternative for every budget.
            </p>
            <div className="pt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>Corsi-Rosenthal & Sealing</span>
            </div>
          </div>
        </div>
      </section>

      {/* How Foggy Works Step-by-Step */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-3xl bg-slate-100/80 dark:bg-slate-850 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Personalized Care
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Foggy Remembers Everything So You Never Have to Repeat Yourself
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                When you mention that your son has asthma, your father lives with COPD, or you cook on a gas stove, Foggy automatically notes it and asks if you’d like it saved. You have full transparency and control on the <em>What Foggy Knows</em> page.
              </p>

              <div className="space-y-2.5 pt-2">
                {[
                  '100% private: stored safely in local storage, never sold',
                  'Instant customized daily routines based on today’s live AQI',
                  'Budget-friendly hacks: DIY filters, draft stoppers, ventilation timing',
                  'Clear medical safety disclaimers prioritizing healthcare providers'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link
                  to="/family"
                  className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  <Users className="w-4 h-4" />
                  <span>Configure your family’s health profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Interactive Preview Mock Card */}
            <div className="rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-5 shadow-md space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
                <MascotAvatar size="sm" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Foggy Memory Assistant
                  </h4>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400">
                    Context synced with Leo (Asthma) & Salt Lake City (AQI 128)
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                <p>
                  "Good morning Maya! Since the morning inversion layer has pushed the AQI to <strong>128</strong>, let's keep Leo's soccer drills indoors today."
                </p>
                <ImpactBadge
                  pmReduced="-72% PM2.5 lung intake"
                  co2Saved="~2.8 kg CO2"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-[11px] text-amber-900 dark:text-amber-300 flex items-center justify-between">
                <span>💡 Foggy noticed: Child Leo (Asthma) saved to family profile.</span>
                <span className="font-bold underline cursor-pointer">Edit</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
