// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Flame, Bus, Wind, Sun, AlertTriangle, ShieldCheck, ArrowRight, Sparkles, Check, Users } from 'lucide-react';
import AQICard from '../components/AQICard';
import HourlyTimeline from '../components/HourlyTimeline';
import ImpactBadge from '../components/ImpactBadge';
import MascotAvatar from '../components/MascotAvatar';
import { fetchAQIData } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const { profile, familyMembers, updateProfile } = useProfile();

  const [currentCity, setCurrentCity] = useState(profile?.location || 'Salt Lake City');
  const [aqiData, setAqiData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync city when profile updates
  useEffect(() => {
    if (profile?.location && profile.location !== currentCity) {
      setCurrentCity(profile.location);
    }
  }, [profile?.location]);

  // Load AQI Data
  const loadAQI = async (city) => {
    setLoading(true);
    const data = await fetchAQIData(city);
    setAqiData(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAQI(currentCity);
  }, [currentCity]);

  const handleCityChange = (newCity) => {
    setCurrentCity(newCity);
    updateProfile({ location: newCity });
  };

  const sensitiveMembers = familyMembers.filter(m => m.condition && m.condition !== 'None');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-sky-500/10 via-amber-500/10 to-teal-500/10 dark:from-sky-950/40 dark:via-slate-900 dark:to-teal-950/40 border border-sky-300/60 dark:border-sky-800/60">
        <div className="flex items-center gap-4">
          <MascotAvatar size="lg" mood="happy" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white">
                Good day, {user?.name ? user.name.split(' ')[0] : 'friend'}!
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                Personalized
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Foggy has analyzed today's winter air patterns in <span className="font-semibold text-slate-800 dark:text-slate-200">{currentCity}</span> for your household.
            </p>
          </div>
        </div>

        <Link
          to="/chat"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all transform hover:-translate-y-0.5 shrink-0"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ask Foggy About Today</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main AQI Widget */}
      <AQICard
        aqiData={aqiData}
        onCityChange={handleCityChange}
        loading={loading}
        onRefresh={() => loadAQI(currentCity)}
      />

      {/* 24-Hour Smog Inversion Curve */}
      {aqiData?.forecastHourly && (
        <HourlyTimeline hourlyData={aqiData.forecastHourly} />
      )}

      {/* Family Vulnerability Overview Alert */}
      {sensitiveMembers.length > 0 && (
        <div className="rounded-3xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/60 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                  Family Health Priority: {sensitiveMembers.length} Vulnerable {sensitiveMembers.length === 1 ? 'Member' : 'Members'}
                </h3>
                <p className="text-xs text-amber-900/90 dark:text-amber-300/90 mt-1 leading-relaxed">
                  Today's AQI ({aqiData?.aqi || 125}) presents heightened risk for sensitive airways. Foggy recommends special care for:
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sensitiveMembers.map((m) => (
                    <div
                      key={m.id}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/80 text-xs shadow-xs"
                    >
                      <strong className="text-slate-800 dark:text-slate-100">{m.name}</strong>
                      <span className="text-amber-700 dark:text-amber-400 ml-1.5 font-medium">({m.condition})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link
              to="/family"
              className="text-xs font-bold text-amber-900 dark:text-amber-300 hover:underline flex items-center gap-1 shrink-0 hidden sm:flex"
            >
              <span>Manage Family Profiles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Low-Emission Daily Routine Plan */}
      <div className="interactive-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Personalized Smog Shield Protocol
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white mt-0.5">
              Today's Low-Emission Daily Routine
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Tailored for {currentCity} • Updated hourly
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Routine Card 1: Commute */}
          <div className="interactive-card rounded-2xl p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400">
                  <Bus className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Commute: Take Metro / Light Rail Instead of Solo Car
                </h4>
              </div>
              <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/50 px-2 py-0.5 rounded-full">
                7:30 AM
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Winter inversions trap vehicle tailpipe exhaust at bumper height. Riding transit bypasses street-level NO2 fumes and keeps hundreds of vehicle cold-starts off the road.
            </p>

            <ImpactBadge
              co2Saved="~2.4 kg CO2 saved"
              pmReduced="-65% PM2.5 inhaled"
              costTradeoff="$3.50 gas & parking saved"
            />
          </div>

          {/* Routine Card 2: Outdoor Activity */}
          <div className="interactive-card rounded-2xl p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400">
                  <Sun className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Outdoor Timing: Shift Exercise to 1:30 PM – 3:30 PM
                </h4>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                Safest Window
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Solar radiation breaks the morning thermal lid in the afternoon, lowering ground-level particulate density by up to 35%. Complete dog walks and errands during this window.
            </p>

            <ImpactBadge
              healthBenefit="Avoids peak smog trigger"
              pmReduced="-35% ground PM2.5"
            />
          </div>

          {/* Routine Card 3: Heating */}
          <div className="interactive-card rounded-2xl p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400">
                  <Flame className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Heating Swap: Zone Heat with Heat Pump (No Wood Burning)
                </h4>
              </div>
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 rounded-full">
                Zero Smoke
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              A single residential fireplace emits as much PM2.5 in an evening as 90 modern heavy diesel trucks driving 10 miles. Use electric zoned heat and weatherstrip exterior doors.
            </p>

            <ImpactBadge
              co2Saved="~5.1 kg CO2 / evening"
              pmReduced="Prevents ~40g neighborhood soot"
              healthBenefit="Protects local asthmatics"
            />
          </div>

          {/* Routine Card 4: Cooking & Indoor */}
          <div className="interactive-card rounded-2xl p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Indoor Air: Run Bedroom DIY Box Fan & Vent Hood
                </h4>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                All Day
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Turn on exhaust ventilation when cooking, and keep the Corsi-Rosenthal filter circulating on low. A damp rolled towel at the entry door cuts drafts by 40%.
            </p>

            <ImpactBadge
              pmReduced="-85% indoor particulate count"
              costTradeoff="< $0.15 electricity / day"
            />
          </div>
        </div>

        {/* Ask Foggy Card Footer */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <span>Need custom changes for shifts, kids, or pets?</span>
          <Link
            to="/chat"
            className="font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>Ask Foggy to adapt this routine</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
