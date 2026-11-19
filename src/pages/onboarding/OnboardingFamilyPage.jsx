// src/pages/onboarding/OnboardingFamilyPage.jsx
// Step 2 of 2: Compulsory Onboarding - Family & Household Members
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../context/ProfileContext';
import MascotAvatar from '../../components/MascotAvatar';
import confetti from 'canvas-confetti';
import {
  COUNTRIES,
  INDIAN_STATES_AND_UTS,
  HEALTH_CONDITIONS,
  SENSITIVITY_LEVELS,
  COMMUTE_STYLES,
  LIFESTYLE_ACTIVITIES,
  PET_LIFESTYLE_ACTIVITIES,
  RELATIONSHIP_SUGGESTIONS
} from '../../data/onboardingData';
import { validateFamilyMemberForm } from '../../utils/validation';
import { geocodeLocation } from '../../services/api';
import { statesMatch } from '../../../functions/api/geocode';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  Loader2,
  Users,
  Heart,
  MapPin,
  Sparkles,
  X
} from 'lucide-react';

export default function OnboardingFamilyPage() {
  const navigate = useNavigate();
  const { profile, saveOnboardingFamily } = useProfile();

  // If user completed page 1, use their default geo location
  const defaultCountry = profile?.country || 'India';
  const defaultState = profile?.state || 'West Bengal';
  const defaultCity = profile?.city || 'Kolkata';
  const defaultLocationObj = {
    name: defaultCity,
    latitude: profile?.latitude || 22.5726,
    longitude: profile?.longitude || 88.3639,
    timezone: profile?.timezone || 'Asia/Kolkata',
    admin1: defaultState,
    country: defaultCountry,
    id: profile?.placeId || 1275004
  };

  const [members, setMembers] = useState([]);
  const [livesAlone, setLivesAlone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Member Modal State (Add or Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Modal Form Fields
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Son');
  const [age, setAge] = useState('');
  const [country, setCountry] = useState(defaultCountry);
  const [state, setState] = useState(defaultState);
  const [city, setCity] = useState(defaultCity);
  const [locationObj, setLocationObj] = useState(defaultLocationObj);
  const [conditions, setConditions] = useState(['None']);
  const [otherCondition, setOtherCondition] = useState('');
  const [sensitivity, setSensitivity] = useState('Low');
  const [commute, setCommute] = useState(['Walk']);
  const [lifestyle, setLifestyle] = useState(['Morning walk']);
  const [otherLifestyle, setOtherLifestyle] = useState('');

  // Modal city autocomplete states
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [citySearchError, setCitySearchError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [modalErrors, setModalErrors] = useState({});

  const isPet = relationship.toLowerCase().trim() === 'pet';

  // Open modal for adding a new member
  const handleOpenAddModal = () => {
    setEditingId(null);
    setName('');
    setRelationship('Son');
    setAge('');
    setCountry(defaultCountry);
    setState(defaultState);
    setCity(defaultCity);
    setLocationObj(defaultLocationObj);
    setConditions(['None']);
    setOtherCondition('');
    setSensitivity('Low');
    setCommute(['Walk']);
    setLifestyle(['Morning walk']);
    setOtherLifestyle('');
    setModalErrors({});
    setModalOpen(true);
  };

  // Open modal for editing an existing member
  const handleOpenEditModal = (member) => {
    setEditingId(member.id);
    setName(member.name);
    setRelationship(member.relationship || 'Dependent');
    setAge(String(member.age || ''));
    setCountry(member.country || defaultCountry);
    setState(member.state || defaultState);
    setCity(member.city || defaultCity);
    setLocationObj(
      member.latitude
        ? {
            name: member.city,
            latitude: member.latitude,
            longitude: member.longitude,
            timezone: member.timezone,
            admin1: member.state,
            country: member.country,
            id: member.placeId
          }
        : defaultLocationObj
    );
    setConditions(Array.isArray(member.conditions) && member.conditions.length > 0 ? member.conditions : ['None']);
    setOtherCondition(member.otherCondition || '');
    setSensitivity(member.sensitivity || 'Low');
    setCommute(Array.isArray(member.commute) ? member.commute : []);
    setLifestyle(Array.isArray(member.lifestyle) ? member.lifestyle : []);
    setOtherLifestyle(member.otherLifestyle || '');
    setModalErrors({});
    setModalOpen(true);
  };

  // Modal City Autocomplete
  const handleCitySearch = async (val) => {
    setCity(val);
    setLocationObj(null);
    if (!val || val.trim().length < 2) {
      setCitySuggestions([]);
      setCitySearchError('');
      return;
    }

    setIsSearchingCity(true);
    setCitySearchError('');
    try {
      const results = await geocodeLocation({
        name: val.trim(),
        countryCode: country === 'India' ? 'IN' : ''
      });
      setIsSearchingCity(false);
      if (!results || results.length === 0) {
        setCitySuggestions([]);
        setCitySearchError(`We couldn't find '${val}' in ${state}, ${country}.`);
      } else {
        setCitySuggestions(results);
        setShowSuggestions(true);
      }
    } catch {
      setIsSearchingCity(false);
      setCitySearchError('Geocoding service unavailable.');
    }
  };

  const handleSelectCitySuggestion = (suggestion) => {
    if (state && suggestion.admin1 && !statesMatch(state, suggestion.admin1)) {
      setModalErrors((prev) => ({
        ...prev,
        city: `Selected '${suggestion.name}' is in ${suggestion.admin1}, not ${state}.`
      }));
      return;
    }
    setCity(suggestion.name);
    setLocationObj(suggestion);
    setShowSuggestions(false);
    setCitySearchError('');
    setModalErrors((prev) => ({ ...prev, city: null }));
  };

  const toggleModalCondition = (cond) => {
    if (cond === 'None') {
      setConditions(['None']);
      setSensitivity('Low');
      return;
    }
    setConditions((prev) => {
      const filtered = prev.filter((c) => c !== 'None');
      if (filtered.includes(cond)) {
        const next = filtered.filter((c) => c !== cond);
        return next.length === 0 ? ['None'] : next;
      } else {
        return [...filtered, cond];
      }
    });
  };

  const toggleModalCommute = (method) => {
    setCommute((prev) => (prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]));
  };

  const toggleModalLifestyle = (act) => {
    setLifestyle((prev) => (prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]));
  };

  // Save Modal Form
  const handleSaveModalMember = (e) => {
    e.preventDefault();

    const memberData = {
      id: editingId,
      name,
      relationship,
      age,
      country,
      state,
      city,
      locationObj,
      conditions,
      otherCondition,
      sensitivity: conditions.length === 1 && conditions[0] === 'None' ? 'Low' : sensitivity,
      commute: isPet ? [] : commute,
      lifestyle,
      otherLifestyle
    };

    const { isValid: memberValid, errors: mErrors, sanitizedData } = validateFamilyMemberForm(memberData);

    if (!memberValid) {
      setModalErrors(mErrors);
      return;
    }

    if (editingId) {
      setMembers((prev) => prev.map((m) => (m.id === editingId ? sanitizedData : m)));
    } else {
      setMembers((prev) => [...prev, sanitizedData]);
    }

    setModalOpen(false);
  };

  const handleDeleteMember = (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  // Check overall Page 2 validity
  const isPage2Valid = livesAlone || members.length > 0;

  // Final Onboarding Submit
  const handleFinalSubmit = async () => {
    if (!isPage2Valid || submitting) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      await saveOnboardingFamily(members, livesAlone);

      // Trigger Confetti Celebration and show Personalising State
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Safe if confetti fails
      }

      setCelebrating(true);

      setTimeout(() => {
        navigate('/dashboard');
      }, 1600);
    } catch (err) {
      console.error('Final onboarding submission failed:', err);
      setErrorMsg(err.message || 'Failed to complete onboarding. Please try again.');
      setSubmitting(false);
    }
  };

  if (celebrating) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <MascotAvatar size="lg" className="animate-bounce" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Onboarding Complete!</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Personalising your dashboard...
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md">
          Calibrating 24-hour inversion curves, CPCB thresholds, and personalized family air defense routines.
        </p>
        <Loader2 className="w-6 h-6 text-sky-500 animate-spin mt-4" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Step Progress Tracker */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</span>
            Step 1: About you
          </span>
          <span className="text-sky-600 dark:text-sky-400 font-extrabold flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px]">2</span>
            Your family and household (Step 2 of 2)
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div className="bg-sky-500 h-full w-full transition-all duration-300"></div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <MascotAvatar size="md" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Your family and household
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Add children, elderly parents, asthmatic dependents, or pets so Foggy automatically calculates their outdoor risk.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Live Alone Option Checkbox */}
      <div className="mb-6 p-4 rounded-2xl bg-slate-100 dark:bg-slate-850/70 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
        <input
          id="livesAlone"
          type="checkbox"
          checked={livesAlone}
          onChange={(e) => {
            setLivesAlone(e.target.checked);
          }}
          className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
        />
        <label htmlFor="livesAlone" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer leading-relaxed">
          <strong className="font-bold text-slate-900 dark:text-white">I live alone / I have no family members to add.</strong>
          <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Check this box if you are managing air pollution protection solely for yourself. You can add household members anytime later.
          </span>
        </label>
      </div>

      {/* Member Cards List */}
      {!livesAlone && (
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-500" />
              <span>Registered Dependents & Household ({members.length})</span>
            </h2>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Family Member</span>
            </button>
          </div>

          {members.length === 0 ? (
            <div className="p-8 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <Users className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No household members added yet. Click <strong>"Add Family Member"</strong> above, or check <strong>"I live alone"</strong> if you don't have dependents to add.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft dark:shadow-soft-dark space-y-2 relative"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 mb-1">
                        {m.relationship}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {m.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {m.city}, {m.state} ({m.age} yrs)
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(m)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Edit member"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(m.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Delete member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 space-y-1">
                    <p>
                      <strong>Conditions:</strong> {m.conditions?.join(', ') || 'None'}
                    </p>
                    <p>
                      <strong>Sensitivity:</strong>{' '}
                      <span className={m.sensitivity === 'High' ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                        {m.sensitivity}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Submit Action */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => navigate('/get-started/profile')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          ← Back to Profile
        </button>

        <button
          type="button"
          disabled={!isPage2Valid || submitting}
          onClick={handleFinalSubmit}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer ${
            isPage2Valid && !submitting
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:scale-[1.02]'
              : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed opacity-60'
          }`}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Personalising Dashboard...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Complete Setup & Open Dashboard</span>
            </>
          )}
        </button>
      </div>

      {/* Add / Edit Family Member Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="max-w-xl w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Household Member' : 'Add Family Member'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModalMember} noValidate className="space-y-4 text-xs">
              {/* Relationship Combobox */}
              <div>
                <label htmlFor="memberRel" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Relationship Tag <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="memberRel"
                    type="text"
                    required
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="e.g. Son, Daughter, Mother, Pet..."
                    list="relationship-suggestions"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <datalist id="relationship-suggestions">
                    {RELATIONSHIP_SUGGESTIONS.map((r) => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </div>
                {modalErrors.relationship && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{modalErrors.relationship}</p>
                )}
              </div>

              {/* Name & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="memberName" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="memberName"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isPet ? 'e.g. Rusty' : 'e.g. Beta, Dadi, Priya'}
                    maxLength={60}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {modalErrors.name && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{modalErrors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="memberAge" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Age <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="memberAge"
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 7"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {modalErrors.age && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{modalErrors.age}</p>
                  )}
                </div>
              </div>

              {/* Location: State & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="memberState" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    State <span className="text-rose-500">*</span>
                  </label>
                  {country === 'India' ? (
                    <select
                      id="memberState"
                      value={state}
                      onChange={(e) => {
                        setState(e.target.value);
                        setCity('');
                        setLocationObj(null);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      {INDIAN_STATES_AND_UTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="memberState"
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State / Region"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  )}
                </div>

                <div className="relative">
                  <label htmlFor="memberCity" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="memberCity"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => handleCitySearch(e.target.value)}
                    onFocus={() => {
                      if (citySuggestions.length > 0) setShowSuggestions(true);
                    }}
                    placeholder="Search city..."
                    autoComplete="off"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {isSearchingCity && (
                    <Loader2 className="w-3.5 h-3.5 text-sky-500 animate-spin absolute right-3 top-8" />
                  )}

                  {showSuggestions && citySuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-48 overflow-y-auto rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-xs">
                      {citySuggestions.map((s) => (
                        <button
                          key={`${s.id}-${s.latitude}`}
                          type="button"
                          onMouseDown={() => handleSelectCitySuggestion(s)}
                          className="w-full text-left px-3 py-1.5 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100"
                        >
                          {s.name}, {s.admin1} ({s.country})
                        </button>
                      ))}
                    </div>
                  )}

                  {locationObj && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Verified: {locationObj.name} ({locationObj.latitude.toFixed(2)}°, {locationObj.longitude.toFixed(2)}°)
                    </span>
                  )}
                  {citySearchError && (
                    <p className="text-[10px] text-amber-600 mt-1">{citySearchError}</p>
                  )}
                  {modalErrors.city && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{modalErrors.city}</p>
                  )}
                </div>
              </div>

              {/* Health Conditions */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Health Conditions <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {HEALTH_CONDITIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleModalCondition(c)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                        conditions.includes(c)
                          ? 'bg-sky-500 text-white border-sky-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                {conditions.includes('Other') && (
                  <input
                    type="text"
                    value={otherCondition}
                    onChange={(e) => setOtherCondition(e.target.value)}
                    placeholder="Specify condition..."
                    className="mt-2 w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                )}
                {modalErrors.conditions && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{modalErrors.conditions}</p>
                )}
              </div>

              {/* Sensitivity */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sensitivity Level <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Low', 'Moderate', 'High'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      disabled={conditions.length === 1 && conditions[0] === 'None' && lvl !== 'Low'}
                      onClick={() => setSensitivity(lvl)}
                      className={`py-1.5 text-xs font-bold rounded-xl border text-center ${
                        sensitivity === lvl
                          ? 'bg-sky-500 text-white border-sky-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Commute (Optional if Pet) */}
              {!isPet && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Commute Style <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMUTE_STYLES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleModalCommute(c)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                          commute.includes(c)
                            ? 'bg-sky-500 text-white border-sky-600'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  {modalErrors.commute && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{modalErrors.commute}</p>
                  )}
                </div>
              )}

              {/* Lifestyle Activities */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lifestyle & Outdoor Routines <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(isPet ? PET_LIFESTYLE_ACTIVITIES : LIFESTYLE_ACTIVITIES).map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => toggleModalLifestyle(act)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                        lifestyle.includes(act)
                          ? 'bg-sky-500 text-white border-sky-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
                {lifestyle.includes('Other') && (
                  <input
                    type="text"
                    value={otherLifestyle}
                    onChange={(e) => setOtherLifestyle(e.target.value)}
                    placeholder="Specify other activity..."
                    className="mt-2 w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                )}
                {modalErrors.lifestyle && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{modalErrors.lifestyle}</p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold shadow-sm"
                >
                  {editingId ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
