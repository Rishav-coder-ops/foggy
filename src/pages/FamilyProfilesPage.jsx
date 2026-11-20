// src/pages/FamilyProfilesPage.jsx
// Comprehensive Family & Household Air Health Profiles with CPCB NAQI Care Plan Engine & Foggy Personalization

import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Edit2, Trash2, Heart, Shield, AlertTriangle, Check,
  X, Sparkles, ChevronDown, ChevronUp, Clock, AlertCircle, Phone,
  Loader2, Activity, Compass, Wind, Coffee, RefreshCw
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import MascotAvatar from '../components/MascotAvatar';
import { fetchAQIData } from '../services/api';
import { generateMemberCarePlan } from '../utils/carePlanEngine';
import { validateFamilyMemberForm, sanitizeText } from '../utils/validation';
import {
  INDIAN_STATES_AND_UTS,
  HEALTH_CONDITIONS,
  SENSITIVITY_LEVELS,
  COMMUTE_STYLES,
  LIFESTYLE_ACTIVITIES,
  RELATIONSHIP_SUGGESTIONS
} from '../data/onboardingData';
import { geocodeLocation } from '../services/api';

export default function FamilyProfilesPage() {
  const { user } = useAuth();
  const { profile, familyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember } = useProfile();

  const [aqiData, setAqiData] = useState(null);
  const [loadingAQI, setLoadingAQI] = useState(true);

  // Expanded Care Plan accordion state (memberId -> boolean)
  const [expandedPlans, setExpandedPlans] = useState({});

  // AI Personalization state
  const [personalizingMember, setPersonalizingMember] = useState(null);
  const [aiMemo, setAiMemo] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Son',
    age: '',
    country: 'India',
    state: profile?.state || 'West Bengal',
    city: profile?.city || 'Kolkata',
    locationObj: null,
    conditions: ['Asthma'],
    otherCondition: '',
    sensitivity: 'High',
    commute: ['Metro'],
    lifestyle: ['Outdoor sports (cricket, football, tennis)'],
    otherLifestyle: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [searchingCity, setSearchingCity] = useState(false);

  // Load AQI Data for household
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoadingAQI(true);
      const data = await fetchAQIData(
        profile?.city || 'Kolkata',
        profile?.latitude,
        profile?.longitude
      );
      if (isMounted) {
        setAqiData(data);
        setLoadingAQI(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [profile?.city, profile?.latitude, profile?.longitude]);

  // City geocoding autocomplete inside modal
  const handleCityInput = async (query) => {
    setFormData((prev) => ({ ...prev, city: query, locationObj: null }));
    if (!query || query.trim().length < 2) {
      setCitySuggestions([]);
      return;
    }
    setSearchingCity(true);
    try {
      const results = await geocodeLocation(query, formData.country);
      setCitySuggestions(results || []);
    } catch {
      setCitySuggestions([]);
    } finally {
      setSearchingCity(false);
    }
  };

  const handleSelectCitySuggestion = (item) => {
    setFormData((prev) => ({
      ...prev,
      city: item.name,
      state: item.admin1 || prev.state,
      locationObj: {
        name: item.name,
        latitude: item.latitude,
        longitude: item.longitude,
        timezone: item.timezone || 'Asia/Kolkata',
        admin1: item.admin1 || prev.state,
        country: item.country || prev.country,
        id: item.id
      }
    }));
    setCitySuggestions([]);
    setFormErrors((prev) => ({ ...prev, city: null }));
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      relationship: 'Son',
      age: '',
      country: profile?.country || 'India',
      state: profile?.state || 'West Bengal',
      city: profile?.city || 'Kolkata',
      locationObj: {
        name: profile?.city || 'Kolkata',
        latitude: profile?.latitude || 22.5726,
        longitude: profile?.longitude || 88.3639,
        timezone: profile?.timezone || 'Asia/Kolkata',
        admin1: profile?.state || 'West Bengal',
        country: profile?.country || 'India'
      },
      conditions: ['None'],
      otherCondition: '',
      sensitivity: 'Low',
      commute: ['Metro'],
      lifestyle: ['Walking / Leisure walks'],
      otherLifestyle: ''
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingId(member.id);
    const conds = Array.isArray(member.conditions)
      ? member.conditions
      : member.condition ? [member.condition] : ['None'];

    setFormData({
      name: member.name || '',
      relationship: member.relationship || 'Dependent',
      age: member.age !== undefined && member.age !== null ? String(member.age) : '',
      country: member.country || profile?.country || 'India',
      state: member.state || profile?.state || 'West Bengal',
      city: member.city || profile?.city || 'Kolkata',
      locationObj: {
        name: member.city || profile?.city || 'Kolkata',
        latitude: member.latitude || profile?.latitude || 22.5726,
        longitude: member.longitude || profile?.longitude || 88.3639,
        timezone: member.timezone || profile?.timezone || 'Asia/Kolkata',
        admin1: member.state || profile?.state || 'West Bengal',
        country: member.country || profile?.country || 'India',
        id: member.placeId || null
      },
      conditions: conds,
      otherCondition: member.otherCondition || '',
      sensitivity: member.sensitivity || 'Moderate',
      commute: Array.isArray(member.commute) ? member.commute : ['Metro'],
      lifestyle: Array.isArray(member.lifestyle) ? member.lifestyle : ['Walking / Leisure walks'],
      otherLifestyle: member.otherLifestyle || ''
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleModalSave = async (e) => {
    e.preventDefault();
    const result = validateFamilyMemberForm(formData);
    if (!result.isValid) {
      setFormErrors(result.errors);
      return;
    }

    try {
      if (editingId) {
        await updateFamilyMember(editingId, result.sanitizedData);
      } else {
        await addFamilyMember(result.sanitizedData);
      }
      setModalOpen(false);
    } catch (err) {
      console.error('Failed to save member:', err);
      setFormErrors({ submit: 'Could not save member profile. Please try again.' });
    }
  };

  const handleDelete = async (id, memberName) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from your household profiles?`)) {
      await deleteFamilyMember(id);
    }
  };

  const toggleCarePlan = (memberId) => {
    setExpandedPlans((prev) => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  // AI Personalization with Foggy via /api/personalize (fallback /api/chat)
  const handlePersonalizeWithFoggy = async (member) => {
    if (!member) return;
    setPersonalizingMember(member);
    setAiMemo(null);
    setAiError('');
    setLoadingAi(true);

    try {
      const sanitizedName = sanitizeText(member.name, 50) || 'Family Member';
      const sanitizedRel = sanitizeText(member.relationship, 40) || 'Dependent';
      const ageStr = member.age ? `${member.age} years old` : 'age unspecified';
      const condsStr = Array.isArray(member.conditions) ? member.conditions.join(', ') : (member.condition || 'None');
      const commuteStr = Array.isArray(member.commute) ? member.commute.join(', ') : 'Not specified';
      const lifeStr = Array.isArray(member.lifestyle) ? member.lifestyle.join(', ') : 'Not specified';
      const aqiNum = aqiData?.aqi || 165;
      const aqiCat = aqiData?.category || 'Moderate';
      const cityLoc = member.city ? `${member.city}, ${member.state || 'India'}` : (profile?.city || 'Kolkata');

      const prompt = `Please create a friendly, structured personalized air quality care memo for ${sanitizedName} (${sanitizedRel}, ${ageStr}).
Location: ${cityLoc}.
Current CPCB National AQI: ${aqiNum} (${aqiCat}).
Respiratory Conditions: ${condsStr}.
Sensitivity: ${member.sensitivity || 'Moderate'}.
Daily Commute: ${commuteStr}.
Outdoor Activities / Habits: ${lifeStr}.${member.notes ? `\nSpecial notes: ${sanitizeText(member.notes, 300)}.` : ''}

Please include:
1. Optimal outdoor timing window based on diurnal inversion.
2. Certified mask guidance (N95/FFP2).
3. Commute adjustment advice.
4. If asthmatic, remind to keep doctor-prescribed salbutamol rescue inhaler (such as Asthalin) at hand.
5. Hydration and indoor air filtration steps.
6. Clear not-a-doctor medical disclaimer and 112 emergency notice. Keep it warm and actionable.`;

      let idToken = null;
      try {
        if (user && typeof user.getIdToken === 'function') {
          idToken = await user.getIdToken();
        } else if (auth?.currentUser && typeof auth.currentUser.getIdToken === 'function') {
          idToken = await auth.currentUser.getIdToken();
        }
      } catch (tokenErr) {
        console.warn('Could not retrieve Firebase ID token:', tokenErr);
      }

      const headers = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const requestPayload = {
        message: prompt,
        prompt,
        member: {
          name: sanitizedName,
          relationship: sanitizedRel,
          age: member.age,
          city: member.city || profile?.city || 'Kolkata',
          state: member.state || profile?.state || 'India',
          conditions: member.conditions || member.condition || 'None',
          sensitivity: member.sensitivity || 'Moderate',
          commute: member.commute || 'Not specified',
          lifestyle: member.lifestyle || 'Not specified',
          notes: member.notes || ''
        },
        aqiData: {
          aqi: aqiNum,
          category: aqiCat,
          city: member.city || profile?.city || 'Kolkata'
        },
        city: member.city || profile?.city || 'Kolkata',
        history: []
      };

      let res = await fetch('/api/personalize', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestPayload)
      });

      // Fallback to /api/chat if /api/personalize is not routed
      if (res.status === 404) {
        res = await fetch('/api/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestPayload)
        });
      }

      if (!res.ok) {
        let errJson = {};
        try {
          errJson = await res.json();
        } catch {}

        if (res.status === 429 || errJson.isRateLimited || errJson.code === 'RATE_LIMITED') {
          throw new Error('Foggy is busy, try again in a minute.');
        } else if (res.status === 401 || res.status === 403) {
          throw new Error('Sign-in required: please sign in to personalize advice with Foggy.');
        } else if (res.status >= 500) {
          throw new Error('Server problem: Foggy experienced a temporary issue. Please try again.');
        } else {
          throw new Error(errJson.message || `API error (${res.status})`);
        }
      }

      const json = await res.json();
      setAiMemo(json.memo || json.reply || json.message || 'Foggy personalized precautions generated.');
    } catch (err) {
      console.error('Personalization failed with error:', err);
      const msg = err.message || '';
      if (msg.includes('busy') || msg.includes('minute') || msg.includes('limit') || msg.includes('429')) {
        setAiError('Foggy is busy, try again in a minute.');
      } else if (msg.includes('Sign-in') || msg.includes('sign in') || msg.includes('auth') || msg.includes('401') || msg.includes('403')) {
        setAiError('Sign-in problem: please sign in or refresh your session.');
      } else if (msg.includes('Server') || msg.includes('server') || msg.includes('500') || msg.includes('502') || msg.includes('503')) {
        setAiError('Server problem: Foggy is temporarily unavailable. Please try again.');
      } else if (err.name === 'TypeError' || msg.includes('fetch') || msg.includes('Network') || msg.includes('network') || msg.includes('offline') || msg.includes('connection')) {
        setAiError('Network problem: Please check your internet connection.');
      } else {
        setAiError(msg || 'Unable to connect with Foggy right now.');
      }
    } finally {
      setLoadingAi(false);
    }
  };

  const getRoleIcon = (rel) => {
    const r = (rel || '').toLowerCase();
    if (r === 'pet' || r.includes('dog') || r.includes('cat')) return '🐾';
    if (r === 'son' || r === 'daughter' || r === 'child') return '🧒';
    if (r.includes('dadi') || r.includes('nani') || r.includes('dada') || r.includes('nana') || r.includes('senior') || r.includes('grand')) return '👵';
    if (r.includes('mother') || r.includes('father') || r.includes('parent')) return '🧑';
    if (r.includes('spouse') || r.includes('partner') || r.includes('wife') || r.includes('husband')) return '❤️';
    return '👤';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            <Users className="w-3.5 h-3.5" />
            <span>Household Care Network</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            Family & Household Health Profiles
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Foggy tailors every outdoor advisory, commute swap, and filter recommendation to the unique respiratory sensitivities of each loved one using official CPCB NAQI guidelines.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-sky-400 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Family Member</span>
        </button>
      </div>

      {/* Profiles Grid */}
      {familyMembers.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center shadow-soft dark:shadow-soft-dark max-w-md mx-auto">
          <MascotAvatar size="lg" className="mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            No family profiles added yet
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 mb-4">
            Add children, elders, pets, or anyone with asthma to receive deterministic care plans and personalized smog alerts.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 text-white cursor-pointer"
          >
            Add First Profile
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {familyMembers.map((member) => {
            const isHigh = member.sensitivity === 'High';
            const isMod = member.sensitivity === 'Moderate';
            const carePlan = generateMemberCarePlan(member, aqiData || { aqi: 165, category: 'Moderate' });
            const isPlanOpen = !!expandedPlans[member.id];
            const conds = Array.isArray(member.conditions) ? member.conditions : (member.condition ? [member.condition] : ['None']);
            const commutes = Array.isArray(member.commute) ? member.commute : [];
            const lifestyles = Array.isArray(member.lifestyle) ? member.lifestyle : [];

            return (
              <div
                key={member.id}
                className="interactive-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark transition-all hover:border-sky-300 dark:hover:border-sky-700"
              >
                {/* Top Member Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {getRoleIcon(member.relationship)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                          {member.name}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                          {member.relationship || 'Dependent'}
                        </span>
                        {member.age ? (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            • {member.age} yrs old
                          </span>
                        ) : null}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Location: <span className="font-semibold text-slate-700 dark:text-slate-300">{member.city || profile?.city || 'Kolkata'}, {member.state || profile?.state || 'West Bengal'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions & Sensitivity Badge */}
                  <div className="flex items-center gap-2.5 self-end md:self-auto">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        isHigh
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          : isMod
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      {member.sensitivity || 'Standard'} Sensitivity
                    </span>

                    <button
                      type="button"
                      onClick={() => openEditModal(member)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Profile"
                      aria-label={`Edit ${member.name}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(member.id, member.name)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete Profile"
                      aria-label={`Delete ${member.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Profile Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 text-xs">
                  {/* Conditions */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span>Health Conditions</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {conds.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-medium"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Commute */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                      <Compass className="w-3.5 h-3.5 text-sky-500" />
                      <span>Daily Commute Methods</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {commutes.length > 0 ? (
                        commutes.map((cm) => (
                          <span
                            key={cm}
                            className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-medium"
                          >
                            {cm}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 italic">None specified</span>
                      )}
                    </div>
                  </div>

                  {/* Lifestyle */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Outdoor Habits / Routine</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {lifestyles.length > 0 ? (
                        lifestyles.map((ls) => (
                          <span
                            key={ls}
                            className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-medium"
                          >
                            {ls}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 italic">Standard routine</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes if any */}
                {member.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic mb-4">
                    Special notes: "{member.notes}"
                  </p>
                )}

                {/* Action Bar: Care Plan Toggle + Personalize with Foggy */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleCarePlan(member.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-sky-500" />
                    <span>{isPlanOpen ? "Hide Today's Care Plan" : "View Today's Care Plan"}</span>
                    {isPlanOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePersonalizeWithFoggy(member)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-300/60 dark:border-sky-800 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Personalise with Foggy</span>
                  </button>
                </div>

                {/* Deterministic "Today's Care Plan" Accordion Content */}
                {isPlanOpen && (
                  <div className="mt-5 p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-750 space-y-5 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                          Deterministic CPCB Protocol
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          Today's Care Plan for {member.name}
                        </h3>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Based on CPCB NAQI: <strong className="text-slate-800 dark:text-slate-200">{carePlan.aqi} ({carePlan.category})</strong>
                      </span>
                    </div>

                    {/* 3-Hour Diurnal Forecast Slots */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-sky-500" />
                        <span>Diurnal Inversion Schedule & Lifestyle Swaps</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {carePlan.timeSlots.map((ts, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 text-xs flex flex-col justify-between space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{ts.slot}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300">
                                {ts.forecastBadge}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                              {ts.guidance}
                            </p>
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                              ⚡ {ts.lifestyleAdjustment}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actionable Do's & Avoid's */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                        <span className="font-bold text-emerald-900 dark:text-emerald-200 block mb-2">
                          ✓ Recommended Actions (Do's)
                        </span>
                        <ul className="space-y-1.5 text-emerald-900/90 dark:text-emerald-300/90">
                          {carePlan.doList.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold shrink-0">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
                        <span className="font-bold text-rose-900 dark:text-rose-200 block mb-2">
                          ✕ Activities to Avoid (Don'ts)
                        </span>
                        <ul className="space-y-1.5 text-rose-900/90 dark:text-rose-300/90">
                          {carePlan.avoidList.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-rose-600 font-bold shrink-0">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Mask Guidance & Commute Advice */}
                    <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs space-y-1.5">
                      <div className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-sky-500" />
                        <span>Certified Mask Guidance (N95 / FFP2)</span>
                      </div>
                      <p className="text-sky-800 dark:text-sky-300 leading-relaxed text-[11px]">
                        {carePlan.maskAdvice}
                      </p>
                      {carePlan.commuteTips.length > 0 && (
                        <div className="pt-2 border-t border-sky-200/60 dark:border-sky-800/60 text-[11px] text-sky-800 dark:text-sky-300 space-y-1">
                          <strong>Commute Safeties:</strong>
                          {carePlan.commuteTips.map((tip, idx) => (
                            <p key={idx}>• {tip}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Condition Reminders (Asthma with salbutamol rescue inhaler, senior, child) */}
                    {carePlan.conditionReminders.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs space-y-1.5">
                        <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Condition-Specific Health Reminders</span>
                        </div>
                        {carePlan.conditionReminders.map((rem, idx) => (
                          <p key={idx} className="text-amber-900/90 dark:text-amber-200/90 text-[11px] leading-relaxed">
                            {rem}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Hydration & Medical Trigger Footer */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] pt-3 border-t border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400">
                      <div>
                        <strong>Hydration:</strong> {carePlan.hydrationAdvice}
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold shrink-0">
                        <Phone className="w-3.5 h-3.5" />
                        <span>Medical emergency? Call 112 immediately.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* AI Personalization Modal / Bottom Sheet */}
      {personalizingMember && (() => {
        const modalCarePlan = generateMemberCarePlan(personalizingMember, aqiData || { aqi: 165, category: 'Moderate' });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <MascotAvatar size="sm" mood={loadingAi ? 'thinking' : aiError ? 'concerned' : 'happy'} />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Foggy's Air Memo for {personalizingMember.name}
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      Live AI analysis based on profile & today's CPCB AQI
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPersonalizingMember(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loadingAi ? (
                <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Foggy is tailoring precautions for {personalizingMember.name}...
                  </p>
                  <span className="text-[11px] text-slate-400">
                    Evaluating diurnal inversion and specific respiratory sensitivities
                  </span>
                </div>
              ) : aiError ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-300">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="font-medium">{aiError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePersonalizeWithFoggy(personalizingMember)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shrink-0 transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Try again</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700/60 leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
                    {aiMemo}
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Medical Disclaimer:</strong> Foggy is an educational AI assistant, not a doctor. Never change prescribed medications without consulting your doctor. In case of severe breathlessness or emergency, call <strong>112</strong> immediately.
                    </div>
                  </div>
                </div>
              )}

              {/* Deterministic Today's Care Plan - Always kept visible below */}
              {modalCarePlan && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                        CPCB Deterministic Protocol
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Today's Care Plan for {personalizingMember.name}
                      </h4>
                    </div>
                    <span className="text-xs text-slate-500">
                      CPCB AQI: <strong className="text-slate-700 dark:text-slate-300">{modalCarePlan.aqi} ({modalCarePlan.category})</strong>
                    </span>
                  </div>

                  {/* Diurnal Time Slots */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {modalCarePlan.timeSlots.map((ts, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 text-xs flex flex-col justify-between space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{ts.slot}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300">
                            {ts.forecastBadge}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                          {ts.guidance}
                        </p>
                        <div className="pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                          ⚡ {ts.lifestyleAdjustment}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Do's & Don'ts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                      <span className="font-bold text-emerald-900 dark:text-emerald-200 block mb-1.5">
                        ✓ Recommended Actions
                      </span>
                      <ul className="space-y-1 text-emerald-900/90 dark:text-emerald-300/90 text-[11px]">
                        {modalCarePlan.doList.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
                      <span className="font-bold text-rose-900 dark:text-rose-200 block mb-1.5">
                        ✕ Activities to Avoid
                      </span>
                      <ul className="space-y-1 text-rose-900/90 dark:text-rose-300/90 text-[11px]">
                        {modalCarePlan.avoidList.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-rose-600 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Certified Mask Guidance */}
                  <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs space-y-1">
                    <div className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-sky-500" />
                      <span>Certified Mask Guidance (N95 / FFP2)</span>
                    </div>
                    <p className="text-sky-800 dark:text-sky-300 text-[11px] leading-relaxed">
                      {modalCarePlan.maskAdvice}
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPersonalizingMember(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Close Memo
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add / Edit Family Member Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 overscroll-contain">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                {editingId ? 'Edit Family Member Profile' : 'Add New Family Member Profile'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModalSave} className="space-y-4 text-xs">
              {formErrors.submit && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                  {formErrors.submit}
                </div>
              )}

              {/* Relationship Tag */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Relationship Tag *
                </label>
                <input
                  type="text"
                  list="relationship-suggestions"
                  value={formData.relationship}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      relationship: val,
                      sensitivity: val.toLowerCase().trim() === 'pet' ? 'Standard' : prev.sensitivity
                    }));
                  }}
                  placeholder="e.g. Son, Daughter, Dadi, Nani, Pet, Spouse"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
                <datalist id="relationship-suggestions">
                  {RELATIONSHIP_SUGGESTIONS.map((rel) => (
                    <option key={rel} value={rel} />
                  ))}
                </datalist>
                {formErrors.relationship && <p className="text-rose-500 text-[10px] mt-1">{formErrors.relationship}</p>}
              </div>

              {/* Name & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Name / Identifier *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Beta, Dadi, Rusty"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  />
                  {formErrors.name && <p className="text-rose-500 text-[10px] mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Age (Optional for pets)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={formData.age}
                    onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
                    placeholder="e.g. 7 or 74"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  />
                  {formErrors.age && <p className="text-rose-500 text-[10px] mt-1">{formErrors.age}</p>}
                </div>
              </div>

              {/* State & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    State / UT *
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  >
                    {INDIAN_STATES_AND_UTS.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City / Town *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleCityInput(e.target.value)}
                    placeholder="Type to search city..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  />
                  {searchingCity && (
                    <div className="absolute right-3 top-8">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                    </div>
                  )}
                  {citySuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto">
                      {citySuggestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectCitySuggestion(item)}
                          className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs cursor-pointer"
                        >
                          {item.name}, {item.admin1 || item.country}
                        </button>
                      ))}
                    </div>
                  )}
                  {formErrors.city && <p className="text-rose-500 text-[10px] mt-1">{formErrors.city}</p>}
                </div>
              </div>

              {/* Health Conditions */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Health Conditions (Multi-select) *
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {HEALTH_CONDITIONS.map((cond) => {
                    const isChecked = formData.conditions.includes(cond);
                    return (
                      <label key={cond} className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            let next;
                            if (cond === 'None') {
                              next = ['None'];
                            } else {
                              const withoutNone = formData.conditions.filter((c) => c !== 'None');
                              if (e.target.checked) {
                                next = [...withoutNone, cond];
                              } else {
                                next = withoutNone.filter((c) => c !== cond);
                              }
                            }
                            if (next.length === 0) next = ['None'];
                            const isNoneOnly = next.length === 1 && next[0] === 'None';
                            setFormData((prev) => ({
                              ...prev,
                              conditions: next,
                              sensitivity: isNoneOnly ? 'Low' : prev.sensitivity
                            }));
                          }}
                          className="rounded text-sky-500 focus:ring-sky-400"
                        />
                        <span>{cond}</span>
                      </label>
                    );
                  })}
                </div>
                {formErrors.conditions && <p className="text-rose-500 text-[10px] mt-1">{formErrors.conditions}</p>}
              </div>

              {/* Sensitivity Level */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sensitivity Level *
                </label>
                <select
                  value={formData.sensitivity}
                  disabled={formData.conditions.length === 1 && formData.conditions[0] === 'None'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sensitivity: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 disabled:opacity-60"
                >
                  <option value="Low">Low Sensitivity (No pre-existing conditions)</option>
                  <option value="Moderate">Moderate Sensitivity</option>
                  <option value="High">High Sensitivity (Asthma / Cardiac / Senior / Infant)</option>
                </select>
                {formErrors.sensitivity && <p className="text-rose-500 text-[10px] mt-1">{formErrors.sensitivity}</p>}
              </div>

              {/* Commute */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Daily Commute Styles
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {COMMUTE_STYLES.map((cm) => {
                    const isChecked = formData.commute.includes(cm);
                    return (
                      <label key={cm} className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...formData.commute, cm]
                              : formData.commute.filter((c) => c !== cm);
                            setFormData((prev) => ({ ...prev, commute: next }));
                          }}
                          className="rounded text-sky-500 focus:ring-sky-400"
                        />
                        <span>{cm}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Lifestyle Habits */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Outdoor Activities & Habits
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {LIFESTYLE_ACTIVITIES.map((ls) => {
                    const isChecked = formData.lifestyle.includes(ls);
                    return (
                      <label key={ls} className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...formData.lifestyle, ls]
                              : formData.lifestyle.filter((l) => l !== ls);
                            setFormData((prev) => ({ ...prev, lifestyle: next }));
                          }}
                          className="rounded text-sky-500 focus:ring-sky-400"
                        />
                        <span>{ls}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold cursor-pointer"
                >
                  {editingId ? 'Update Profile' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
