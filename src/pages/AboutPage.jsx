// src/pages/AboutPage.jsx
// Comprehensive Educational & Scientific Reference for Indian Air Quality & Foggy Architecture

import MascotAvatar from '../components/MascotAvatar';
import AboutAqiSection from '../components/about/AboutAqiSection';
import AboutScienceSection from '../components/about/AboutScienceSection';
import AboutPortalsSection from '../components/about/AboutPortalsSection';
import AboutEmergencySection from '../components/about/AboutEmergencySection';
import AboutDisclaimerSection from '../components/about/AboutDisclaimerSection';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <MascotAvatar size="lg" className="mx-auto mb-2" />
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          About Foggy &amp; Indian Air Quality Science
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          The physics of winter thermal inversions across the Indo-Gangetic plains, official CPCB
          National AQI (NAQI) standards, statutory regulatory portals, verified emergency helplines,
          and system architecture.
        </p>
      </div>

      <AboutAqiSection />
      <AboutScienceSection />
      <AboutPortalsSection />
      <AboutEmergencySection />
      <AboutDisclaimerSection />
    </div>
  );
}
