// src/pages/onboarding/OnboardingProfilePage.jsx
// Step 1 of 2: Compulsory Onboarding - About You
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import MascotAvatar from '../../components/MascotAvatar';
import {
  COUNTRIES,
  INDIAN_STATES_AND_UTS,
  HEALTH_CONDITIONS,
  SENSITIVITY_LEVELS,
  COMMUTE_STYLES,
  LIFESTYLE_ACTIVITIES
} from '../../data/onboardingData';
import {
  validateProfileForm,
  validateFullName,
  validateAge,
  validateCountry,
  validateState,
  validateCity,
  validateConditions,
  validateSensitivity,
  validateCommute,
  validateLifestyle,
  validateConsent
} from '../../utils/validation';
import { geocodeLocation } from '../../services/api';
import { statesMatch } from '../../../functions/api/geocode';
import { ShieldCheck, MapPin, Check, AlertCircle, Loader2, ChevronRight, Lock } from 'lucide-react';

export default function OnboardingProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, rawProfile, saveOnboardingProfile } = useProfile();

  // Pre-fill from existing profile if user is editing or resuming
  const initialData = rawProfile || profile || {};

  const [fullName, setFullName] = useState(initialData.fullName || user?.displayName || '');
  const [age, setAge] = useState(initialData.age ? String(initialData.age) : '');
  const [country, setCountry] = useState(initialData.country || 'India');
  const [state, setState] = useState(initialData.state || 'West Bengal');
  const [city, setCity] = useState(initialData.city || 'Kolkata');
  const [locationObj, setLocationObj] = useState(
    initialData.latitude
      ? {
          name: initialData.city || 'Kolkata',
          latitude: initialData.latitude,
          longitude: initialData.longitude,
          timezone: initialData.timezone || 'Asia/Kolkata',
          admin1: initialData.state || 'West Bengal',
          country: initialData.country || 'India',
          id: initialData.placeId || 1275004
        }
      : {
          name: 'Kolkata',
          latitude: 22.5726,
          longitude: 88.3639,
          timezone: 'Asia/Kolkata',
          admin1: 'West Bengal',
          country: 'India',
          id: 1275004
        }
  );

  const [conditions, setConditions] = useState(
    Array.isArray(initialData.conditions) && initialData.conditions.length > 0
      ? initialData.conditions
      : ['None']
  );
  const [otherCondition, setOtherCondition] = useState(initialData.otherCondition || '');
  const [sensitivity, setSensitivity] = useState(initialData.sensitivity || 'Low');
  const [commute, setCommute] = useState(
    Array.isArray(initialData.commute) && initialData.commute.length > 0
      ? initialData.commute
      : typeof initialData.commute === 'string' && initialData.commute
        ? [initialData.commute]
        : ['Metro']
  );
  const [lifestyle, setLifestyle] = useState(
    Array.isArray(initialData.lifestyle) && initialData.lifestyle.length > 0
      ? initialData.lifestyle
      : ['Morning walk']
  );
  const [otherLifestyle, setOtherLifestyle] = useState(initialData.otherLifestyle || '');
  const [consent, setConsent] = useState(!!initialData.consentAcceptedAt);

  // Field errors & touched states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  // Geocoding autocomplete states
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [citySearchError, setCitySearchError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cityInputRef = useRef(null);

  // Field element refs for focusing first invalid field on submit
  const fieldRefs = {
    fullName: useRef(null),
    age: useRef(null),
    country: useRef(null),
    state: useRef(null),
    city: useRef(null),
    conditions: useRef(null),
    otherCondition: useRef(null),
    sensitivity: useRef(null),
    commute: useRef(null),
    lifestyle: useRef(null),
    otherLifestyle: useRef(null),
    consent: useRef(null)
  };

  // Form validity calculation
  const currentFormValues = {
    fullName,
    age,
    country,
    state,
    city,
    locationObj,
    conditions,
    otherCondition,
    sensitivity,
    commute,
    lifestyle,
    otherLifestyle,
    consent
  };

  const { isValid, errors: validationErrors } = validateProfileForm(currentFormValues);

  // Auto-lock sensitivity to Low if only 'None' is chosen
  useEffect(() => {
    if (conditions.length === 1 && conditions[0] === 'None') {
      if (sensitivity !== 'Low') setSensitivity('Low');
    }
  }, [conditions, sensitivity]);

  // Handle City search with debounce
  useEffect(() => {
    if (!city || city.trim().length < 2) {
      setCitySuggestions([]);
      setCitySearchError('');
      return;
    }

    let active = true;
    setIsSearchingCity(true);
    setCitySearchError('');

    const countryCode = country === 'India' ? 'IN' : '';
    const timer = setTimeout(async () => {
      try {
        const results = await geocodeLocation({
          name: city.trim(),
          countryCode
        });

        if (!active) return;
        setIsSearchingCity(false);

        if (!results || results.length === 0) {
          setCitySuggestions([]);
          setCitySearchError(
            `We couldn't find '${city}' in ${state}, ${country}. Check the spelling or choose a nearby larger town.`
          );
        } else {
          setCitySuggestions(results);
          setShowSuggestions(true);
        }
      } catch (_err) {
        if (!active) return;
        setIsSearchingCity(false);
        setCitySearchError(
          'Geocoding service unavailable. Please check your connection and retry.'
        );
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [city, country, state]);

  // Touch & validate field on blur
  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    let err = null;
    if (field === 'fullName') err = validateFullName(fullName);
    if (field === 'age') err = validateAge(age);
    if (field === 'country') err = validateCountry(country);
    if (field === 'state') err = validateState(state, country);
    if (field === 'city') err = validateCity(city, locationObj, state, country);
    if (field === 'conditions') err = validateConditions(conditions, otherCondition);
    if (field === 'sensitivity') err = validateSensitivity(sensitivity, conditions);
    if (field === 'commute') err = validateCommute(commute, false);
    if (field === 'lifestyle') err = validateLifestyle(lifestyle, otherLifestyle, false);
    if (field === 'consent') err = validateConsent(consent);

    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleSelectCitySuggestion = (suggestion) => {
    // Check if suggestion matches the selected State
    if (state && suggestion.admin1 && !statesMatch(state, suggestion.admin1)) {
      setErrors((prev) => ({
        ...prev,
        city: `Selected '${suggestion.name}' is in ${suggestion.admin1}, but your state is set to ${state}. Please select a location within ${state}.`
      }));
      return;
    }

    setCity(suggestion.name);
    setLocationObj(suggestion);
    setShowSuggestions(false);
    setCitySearchError('');
    setErrors((prev) => ({ ...prev, city: null }));
  };

  const toggleCondition = (cond) => {
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

  const toggleCommute = (method) => {
    setCommute((prev) => {
      if (prev.includes(method)) {
        return prev.filter((m) => m !== method);
      } else {
        return [...prev, method];
      }
    });
  };

  const toggleLifestyle = (activity) => {
    setLifestyle((prev) => {
      if (prev.includes(activity)) {
        return prev.filter((a) => a !== activity);
      } else {
        return [...prev, activity];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all as touched
    const allTouched = Object.keys(fieldRefs).reduce((acc, f) => ({ ...acc, [f]: true }), {});
    setTouched(allTouched);
    setErrors(validationErrors);

    if (!isValid) {
      // Focus first invalid field
      const firstErrorField = Object.keys(fieldRefs).find((field) => validationErrors[field]);
      if (firstErrorField && fieldRefs[firstErrorField]?.current) {
        fieldRefs[firstErrorField].current.focus();
        fieldRefs[firstErrorField].current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    try {
      const sanitized = {
        fullName,
        age: parseInt(age, 10),
        country,
        state,
        city,
        locationObj,
        conditions,
        otherCondition,
        sensitivity,
        commute,
        lifestyle,
        otherLifestyle,
        consentAcceptedAt: new Date().toISOString()
      };

      await saveOnboardingProfile(sanitized);
      navigate('/get-started/family');
    } catch (err) {
      console.error('Failed to save profile step:', err);
      setErrors((prev) => ({
        ...prev,
        form: err.message || 'Failed to save profile. Please try again.'
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      {/* Step Progress Tracker */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-sky-600 dark:text-sky-400 font-extrabold flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px]">
              1
            </span>
            About you (Step 1 of 2)
          </span>
          <span className="text-slate-400">Step 2: Family & Household</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div className="bg-sky-500 h-full w-1/2 transition-all duration-300"></div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <MascotAvatar size="md" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Tell Foggy about yourself
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            We use your specific location, commute, and respiratory sensitivities to build your
            daily air pollution defense plan.
          </p>
        </div>
      </div>

      {/* Live Error Alert Region */}
      <div aria-live="polite" className="sr-only">
        {Object.values(errors).filter(Boolean).join('. ')}
      </div>

      {errors.form && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errors.form}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-soft dark:shadow-soft-dark space-y-6">
          {/* 1. Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5"
            >
              1. Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="fullName"
              ref={fieldRefs.fullName}
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => handleBlur('fullName')}
              placeholder="e.g. Rajesh Sharma"
              maxLength={60}
              aria-invalid={!!(touched.fullName && errors.fullName)}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 ${
                touched.fullName && errors.fullName
                  ? 'border-rose-500 focus:ring-rose-400'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-sky-500'
              }`}
            />
            {touched.fullName && errors.fullName && (
              <p
                id="fullName-error"
                className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" /> {errors.fullName}
              </p>
            )}
          </div>

          {/* 2. Age */}
          <div>
            <label
              htmlFor="age"
              className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5"
            >
              2. Age <span className="text-rose-500">*</span>
            </label>
            <input
              id="age"
              ref={fieldRefs.age}
              type="number"
              min="1"
              max="120"
              required
              value={age}
              onChange={(e) => setAge(e.target.value)}
              onBlur={() => handleBlur('age')}
              placeholder="e.g. 34"
              aria-invalid={!!(touched.age && errors.age)}
              aria-describedby={errors.age ? 'age-error' : undefined}
              className={`w-full sm:w-36 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 ${
                touched.age && errors.age
                  ? 'border-rose-500 focus:ring-rose-400'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-sky-500'
              }`}
            />
            {touched.age && errors.age && (
              <p
                id="age-error"
                className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" /> {errors.age}
              </p>
            )}
          </div>

          {/* 3. Country */}
          <div>
            <label
              htmlFor="country"
              className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5"
            >
              3. Country <span className="text-rose-500">*</span>
            </label>
            <select
              id="country"
              ref={fieldRefs.country}
              value={country}
              onChange={(e) => {
                const newC = e.target.value;
                setCountry(newC);
                if (newC === 'India') {
                  setState('West Bengal');
                } else {
                  setState('');
                }
                setCity('');
                setLocationObj(null);
              }}
              onBlur={() => handleBlur('country')}
              aria-invalid={!!(touched.country && errors.country)}
              aria-describedby={errors.country ? 'country-error' : undefined}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            {touched.country && errors.country && (
              <p
                id="country-error"
                className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" /> {errors.country}
              </p>
            )}
          </div>

          {/* 4. State or Union Territory */}
          <div>
            <label
              htmlFor="state"
              className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5"
            >
              4. State or Union Territory <span className="text-rose-500">*</span>
            </label>
            {country === 'India' ? (
              <select
                id="state"
                ref={fieldRefs.state}
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setCity('');
                  setLocationObj(null);
                }}
                onBlur={() => handleBlur('state')}
                aria-invalid={!!(touched.state && errors.state)}
                aria-describedby={errors.state ? 'state-error' : undefined}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">-- Select Indian State / UT --</option>
                {INDIAN_STATES_AND_UTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="state"
                ref={fieldRefs.state}
                type="text"
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setLocationObj(null);
                }}
                onBlur={() => handleBlur('state')}
                placeholder="e.g. California, Ontario, New South Wales"
                maxLength={60}
                aria-invalid={!!(touched.state && errors.state)}
                aria-describedby={errors.state ? 'state-error' : undefined}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            )}
            {touched.state && errors.state && (
              <p
                id="state-error"
                className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" /> {errors.state}
              </p>
            )}
          </div>

          {/* 5. City or Town (Autocomplete with location validation) */}
          <div className="relative">
            <label
              htmlFor="city"
              className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5"
            >
              5. City or Town <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="city"
                ref={(el) => {
                  fieldRefs.city.current = el;
                  cityInputRef.current = el;
                }}
                type="text"
                required
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setLocationObj(null);
                }}
                onFocus={() => {
                  if (citySuggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 250);
                  handleBlur('city');
                }}
                placeholder="Type city or town (e.g. Kolkata, Howrah, Delhi)"
                maxLength={80}
                autoComplete="off"
                aria-invalid={!!(touched.city && errors.city)}
                aria-describedby={errors.city ? 'city-error' : undefined}
                className={`w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 ${
                  touched.city && errors.city
                    ? 'border-rose-500 focus:ring-rose-400'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-sky-500'
                }`}
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {isSearchingCity && (
                <Loader2 className="w-4 h-4 text-sky-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Verified Location Badge */}
            {locationObj && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>
                  Verified: {locationObj.name}, {locationObj.admin1 || state} (
                  {locationObj.latitude.toFixed(2)}°, {locationObj.longitude.toFixed(2)}°)
                </span>
              </div>
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && citySuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-56 overflow-y-auto rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-xs">
                {citySuggestions.map((s) => (
                  <button
                    key={`${s.id || s.name}-${s.latitude}`}
                    type="button"
                    onMouseDown={() => handleSelectCitySuggestion(s)}
                    className="w-full text-left px-3.5 py-2 hover:bg-sky-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-100 flex items-center justify-between"
                  >
                    <span>
                      <strong className="font-bold">{s.name}</strong>, {s.admin1 || ''} (
                      {s.country || country})
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {s.latitude.toFixed(2)}, {s.longitude.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {citySearchError && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{citySearchError}</span>
              </p>
            )}

            {touched.city && errors.city && (
              <p
                id="city-error"
                className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3 shrink-0" /> {errors.city}
              </p>
            )}
          </div>

          {/* 6. Health Conditions (Multi-select chips, 'None' is exclusive) */}
          <div ref={fieldRefs.conditions} tabIndex={-1}>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              6. Health Conditions <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Select all that apply. Choose "None" if you have no chronic respiratory or
              cardiovascular conditions.
            </p>
            <div className="flex flex-wrap gap-2">
              {HEALTH_CONDITIONS.map((cond) => {
                const isSelected = conditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleCondition(cond)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {cond}
                  </button>
                );
              })}
            </div>

            {/* Other Condition input if 'Other' selected */}
            {conditions.includes('Other') && (
              <div className="mt-3">
                <label
                  htmlFor="otherCondition"
                  className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Please specify your other condition: <span className="text-rose-500">*</span>
                </label>
                <input
                  id="otherCondition"
                  ref={fieldRefs.otherCondition}
                  type="text"
                  required
                  value={otherCondition}
                  onChange={(e) => setOtherCondition(e.target.value)}
                  placeholder="e.g. Bronchiectasis, interstitial lung disease"
                  maxLength={100}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}

            {touched.conditions && errors.conditions && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.conditions}
              </p>
            )}
          </div>

          {/* 7. Sensitivity Level (Radio buttons with descriptions, locked if 'None') */}
          <div ref={fieldRefs.sensitivity} tabIndex={-1}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                7. Sensitivity Level <span className="text-rose-500">*</span>
              </label>
              {conditions.length === 1 && conditions[0] === 'None' && (
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Auto-set to Low (No conditions)
                </span>
              )}
            </div>

            <div className="space-y-2">
              {SENSITIVITY_LEVELS.map((s) => {
                const isSelected = sensitivity === s.level;
                const isLocked =
                  conditions.length === 1 && conditions[0] === 'None' && s.level !== 'Low';

                return (
                  <label
                    key={s.level}
                    className={`block p-3 rounded-2xl border transition-all cursor-pointer ${
                      isLocked
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                        : isSelected
                          ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-800 ring-1 ring-sky-400'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="sensitivity"
                        value={s.level}
                        checked={isSelected}
                        disabled={isLocked}
                        onChange={() => setSensitivity(s.level)}
                        className="mt-0.5 text-sky-600 focus:ring-sky-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {s.title}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {s.description}
                        </p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            {touched.sensitivity && errors.sensitivity && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.sensitivity}
              </p>
            )}
          </div>

          {/* 8. Commute Style (Multi-select, at least one) */}
          <div ref={fieldRefs.commute} tabIndex={-1}>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              8. Commute Style <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Select all modes you use regularly. Helps Foggy calculate transit exposure windows and
              suggest cleaner swaps.
            </p>
            <div className="flex flex-wrap gap-2">
              {COMMUTE_STYLES.map((c) => {
                const isSelected = commute.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCommute(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            {touched.commute && errors.commute && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.commute}
              </p>
            )}
          </div>

          {/* 9. Lifestyle & Outdoor Activities (Multi-select, at least one) */}
          <div ref={fieldRefs.lifestyle} tabIndex={-1}>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              9. Lifestyle & Outdoor Activities <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Select your typical routines. Foggy adjusts outdoor walk and sports advisories around
              morning inversion peaks.
            </p>
            <div className="flex flex-wrap gap-2">
              {LIFESTYLE_ACTIVITIES.map((act) => {
                const isSelected = lifestyle.includes(act);
                return (
                  <button
                    key={act}
                    type="button"
                    onClick={() => toggleLifestyle(act)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {act}
                  </button>
                );
              })}
            </div>

            {lifestyle.includes('Other') && (
              <div className="mt-3">
                <label
                  htmlFor="otherLifestyle"
                  className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Please specify your other outdoor activity:{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  id="otherLifestyle"
                  ref={fieldRefs.otherLifestyle}
                  type="text"
                  required
                  value={otherLifestyle}
                  onChange={(e) => setOtherLifestyle(e.target.value)}
                  placeholder="e.g. Daily cycling to work, badminton"
                  maxLength={100}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}

            {touched.lifestyle && errors.lifestyle && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.lifestyle}
              </p>
            )}
          </div>

          {/* 10. Required Consent Checkbox */}
          <div
            ref={fieldRefs.consent}
            tabIndex={-1}
            className="pt-2 border-t border-slate-100 dark:border-slate-800"
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (touched.consent) handleBlur('consent');
                }}
                className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                I agree to store these details to personalise my advice. I can edit or delete them
                anytime. View our{' '}
                <button
                  type="button"
                  onClick={() => setPrivacyModalOpen(true)}
                  className="text-sky-600 dark:text-sky-400 underline font-semibold hover:text-sky-500 cursor-pointer"
                >
                  Privacy Notice
                </button>
                . <span className="text-rose-500">*</span>
              </span>
            </label>
            {touched.consent && errors.consent && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.consent}
              </p>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-slate-400">
            All 10 fields are required to unlock your personalized advice.
          </p>

          <button
            type="submit"
            disabled={!isValid || submitting}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer ${
              isValid && !submitting
                ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/20 hover:scale-[1.02]'
                : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving details...</span>
              </>
            ) : (
              <>
                <span>Next: Family & Household</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Privacy Notice Modal */}
      {privacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-sky-600 dark:text-sky-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Privacy & Data Guarantee
              </h3>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>
                <strong>Zero Public Training:</strong> Your health conditions and family details are
                never sold, published, or used to train public foundation models.
              </p>
              <p>
                <strong>Secure Storage:</strong> Stored securely in your isolated user database on
                Firebase Firestore (region <code>asia-south1</code>), protected by security rules
                permitting access solely to your verified user ID.
              </p>
              <p>
                <strong>Complete Control:</strong> You can edit or permanently erase all your data
                and account records at any time from the <strong>Settings</strong> page.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
