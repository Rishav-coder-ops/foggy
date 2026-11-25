// src/pages/SettingsPage.jsx
// User Profile Preferences, Transparency Inspector, and Account Deletion
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { auth, deleteUser } from '../firebase';
import {
  User,
  Brain,
  Edit3,
  Download,
  Trash2,
  AlertTriangle,
  Check,
  Users,
  ShieldAlert,
  Loader2,
  X
} from 'lucide-react';
import { INDIAN_STATES_AND_UTS } from '../data/onboardingData';
import { validateProfileForm, sanitizeText } from '../utils/validation';
import { geocodeLocation } from '../services/api';
import { statesMatch } from '../../functions/api/geocode';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    profile,
    preferredName,
    updatePreferredName,
    updateProfile,
    familyMembers,
    savedMemories,
    deleteMemory,
    deleteAllAccountData
  } = useProfile();

  // 1. "What should Foggy call you?" state
  const [callName, setCallName] = useState(preferredName || '');
  const [callNameSaved, setCallNameSaved] = useState(false);
  const [callNameError, setCallNameError] = useState('');

  useEffect(() => {
    if (preferredName) setCallName(preferredName);
  }, [preferredName]);

  const handleSavePreferredName = async (e) => {
    e.preventDefault();
    const clean = sanitizeText(callName, 30);
    if (!clean || clean.length < 1) {
      setCallNameError('Please enter a name (maximum 30 characters).');
      return;
    }
    if (clean.length > 30) {
      setCallNameError('Name cannot exceed 30 characters.');
      return;
    }
    setCallNameError('');
    await updatePreferredName(clean);
    setCallNameSaved(true);
    setTimeout(() => setCallNameSaved(false), 2500);
  };

  // 2. Download My Data JSON
  const handleDownloadData = () => {
    const dataExport = {
      exportVersion: 2,
      exportDate: new Date().toISOString(),
      user: {
        uid: user?.uid,
        email: user?.email,
        displayName: user?.displayName
      },
      preferredName,
      profile,
      familyMembers,
      savedMemories
    };

    const blob = new Blob([JSON.stringify(dataExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foggy_data_${user?.uid ? user.uid.slice(0, 8) : 'export'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Edit Profile Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editCountry, setEditCountry] = useState('India');
  const [editState, setEditState] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editLocationObj, setEditLocationObj] = useState(null);
  const [editConditions, setEditConditions] = useState(['None']);
  const [editOtherCondition, setEditOtherCondition] = useState('');
  const [editSensitivity, setEditSensitivity] = useState('Low');
  const [editCommute, setEditCommute] = useState(['Metro']);
  const [editLifestyle, setEditLifestyle] = useState(['Morning walk']);
  const [editOtherLifestyle, setEditOtherLifestyle] = useState('');

  const [editCitySuggestions, setEditCitySuggestions] = useState([]);
  const [editSearchingCity, setEditSearchingCity] = useState(false);
  const [editCityError, setEditCityError] = useState('');
  const [editShowSuggestions, setEditShowSuggestions] = useState(false);
  const [editErrors, setEditErrors] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  const openEditModal = () => {
    setEditFullName(profile?.fullName || '');
    setEditAge(String(profile?.age || ''));
    setEditCountry(profile?.country || 'India');
    setEditState(profile?.state || 'West Bengal');
    setEditCity(profile?.city || 'Kolkata');
    setEditLocationObj({
      name: profile?.city || 'Kolkata',
      latitude: profile?.latitude || 22.5726,
      longitude: profile?.longitude || 88.3639,
      timezone: profile?.timezone || 'Asia/Kolkata',
      admin1: profile?.state || 'West Bengal',
      country: profile?.country || 'India',
      id: profile?.placeId || 1275004
    });
    setEditConditions(
      Array.isArray(profile?.conditions) && profile.conditions.length > 0
        ? profile.conditions
        : ['None']
    );
    setEditOtherCondition(profile?.otherCondition || '');
    setEditSensitivity(profile?.sensitivity || 'Low');
    setEditCommute(
      Array.isArray(profile?.commute)
        ? profile.commute
        : typeof profile?.commute === 'string'
          ? profile.commute.split(', ')
          : ['Metro']
    );
    setEditLifestyle(Array.isArray(profile?.lifestyle) ? profile.lifestyle : ['Morning walk']);
    setEditOtherLifestyle(profile?.otherLifestyle || '');
    setEditErrors({});
    setEditModalOpen(true);
  };

  const handleEditCitySearch = async (val) => {
    setEditCity(val);
    setEditLocationObj(null);
    if (!val || val.trim().length < 2) {
      setEditCitySuggestions([]);
      setEditCityError('');
      return;
    }
    setEditSearchingCity(true);
    setEditCityError('');
    try {
      const results = await geocodeLocation({
        name: val.trim(),
        countryCode: editCountry === 'India' ? 'IN' : ''
      });
      setEditSearchingCity(false);
      if (!results || results.length === 0) {
        setEditCitySuggestions([]);
        setEditCityError(`We couldn't find '${val}' in ${editState}, ${editCountry}.`);
      } else {
        setEditCitySuggestions(results);
        setEditShowSuggestions(true);
      }
    } catch {
      setEditSearchingCity(false);
      setEditCityError('Geocoding service unavailable.');
    }
  };

  const handleSelectEditCity = (s) => {
    if (editState && s.admin1 && !statesMatch(editState, s.admin1)) {
      setEditErrors((prev) => ({
        ...prev,
        city: `Selected '${s.name}' is in ${s.admin1}, not ${editState}.`
      }));
      return;
    }
    setEditCity(s.name);
    setEditLocationObj(s);
    setEditShowSuggestions(false);
    setEditCityError('');
    setEditErrors((prev) => ({ ...prev, city: null }));
  };

  const handleSaveEditedDetails = async (e) => {
    e.preventDefault();
    const formData = {
      fullName: editFullName,
      age: editAge,
      country: editCountry,
      state: editState,
      city: editCity,
      locationObj: editLocationObj,
      conditions: editConditions,
      otherCondition: editOtherCondition,
      sensitivity:
        editConditions.length === 1 && editConditions[0] === 'None' ? 'Low' : editSensitivity,
      commute: editCommute,
      lifestyle: editLifestyle,
      otherLifestyle: editOtherLifestyle,
      consent: true
    };

    const { isValid, errors: errs, sanitizedData } = validateProfileForm(formData);
    if (!isValid) {
      setEditErrors(errs);
      return;
    }

    setEditSaving(true);
    try {
      await updateProfile(sanitizedData);
      setEditModalOpen(false);
    } catch (err) {
      setEditErrors((prev) => ({ ...prev, form: err.message || 'Failed to update profile.' }));
    } finally {
      setEditSaving(false);
    }
  };

  // 3. Danger Zone: Delete Account Dialog
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const isDeleteConfirmed = deleteConfirmationText.trim().toLowerCase() === 'delete';

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!isDeleteConfirmed) {
      setDeleteError('Please type "delete" to confirm.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');

    try {
      // 1. Demo account handling
      if (user?.isDemo) {
        await deleteAllAccountData();
        logout();
        navigate('/', {
          replace: true,
          state: { message: 'Demo account session cleared.' }
        });
        return;
      }

      // 2. Delete Firestore Data & Local Storage (profile, family subcollection, memory subcollection)
      await deleteAllAccountData();

      // 3. Delete Firebase Auth User directly without requiring password re-authentication
      if (auth.currentUser) {
        try {
          await deleteUser(auth.currentUser);
        } catch (authErr) {
          console.warn('Firebase user deletion note:', authErr);
        }
      }

      // 4. Sign out & clear all local state
      await logout();

      navigate('/', {
        replace: true,
        state: {
          message: 'Your account and all associated health data have been permanently deleted.'
        }
      });
    } catch (err) {
      console.error('Account deletion failed:', err);
      setDeleteError(
        err.message || 'Account deletion failed. Please check your connection and retry.'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Account Settings & Memory Transparency
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          Control how Foggy addresses you, review verified profile parameters, manage remembered
          facts, and govern your data.
        </p>
      </div>

      {/* SECTION 1: "What should Foggy call you?" */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-soft dark:shadow-soft-dark space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-sky-500" />
            <span>What should Foggy call you?</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your preferred name or nickname used in dashboard greetings and conversational AI
            responses.
          </p>
        </div>

        <form
          onSubmit={handleSavePreferredName}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
        >
          <div className="w-full sm:max-w-xs">
            <input
              type="text"
              required
              maxLength={30}
              value={callName}
              onChange={(e) => {
                setCallName(e.target.value);
                setCallNameError('');
              }}
              placeholder="e.g. Rajesh, Dr. Sharma, Priya"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {callNameError && <p className="text-[11px] text-rose-600 mt-1">{callNameError}</p>}
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {callNameSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Name</span>
            )}
          </button>
        </form>
      </div>

      {/* SECTION 2: "What Foggy knows about me" */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-soft dark:shadow-soft-dark space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-sky-500" />
              <span>What Foggy knows about me</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Collected from your Step 1 profile and conversational learning.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download My Data (JSON)</span>
            </button>

            <button
              type="button"
              onClick={openEditModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit My Details</span>
            </button>
          </div>
        </div>

        {/* Display Collected Profile Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Full Name
            </span>
            <p className="font-bold text-slate-900 dark:text-white mt-0.5">
              {profile?.fullName || 'Not specified'}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Age
            </span>
            <p className="font-bold text-slate-900 dark:text-white mt-0.5">
              {profile?.age ? `${profile.age} years` : 'Not specified'}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Location
            </span>
            <p className="font-bold text-slate-900 dark:text-white mt-0.5">
              {profile?.city}, {profile?.state}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Country
            </span>
            <p className="font-bold text-slate-900 dark:text-white mt-0.5">
              {profile?.country || 'India'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Health Conditions & Sensitivity
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {Array.isArray(profile?.conditions) && profile.conditions.length > 0
                ? profile.conditions.join(', ')
                : 'None'}
            </p>
            <span
              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                profile?.sensitivity === 'High'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300'
                  : 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-300'
              }`}
            >
              {profile?.sensitivity || 'Low'} Sensitivity
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Commute & Routines
            </span>
            <p className="font-medium text-slate-800 dark:text-slate-200">
              <strong>Commute:</strong>{' '}
              {Array.isArray(profile?.commute)
                ? profile.commute.join(', ')
                : profile?.commute || 'Metro'}
            </p>
            <p className="font-medium text-slate-800 dark:text-slate-200">
              <strong>Lifestyle:</strong>{' '}
              {Array.isArray(profile?.lifestyle) ? profile.lifestyle.join(', ') : 'Morning walk'}
            </p>
          </div>
        </div>

        {/* Link to Family Profiles */}
        <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200">
            <Users className="w-4 h-4 text-sky-600" />
            <span>
              Manage dependent family members and pets:{' '}
              <strong>{familyMembers.length} registered</strong>
            </span>
          </div>
          <Link to="/family" className="font-bold text-sky-600 dark:text-sky-400 hover:underline">
            Family Profiles Page →
          </Link>
        </div>

        {/* Remembered Facts List */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Facts Learned from Chats ({savedMemories.length})
          </h3>
          {savedMemories.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No conversational facts recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {savedMemories.map((mem) => (
                <div
                  key={mem.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <div>
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                      {mem.category} • {mem.dateSaved}
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium mt-0.5">
                      {mem.detail}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteMemory(mem.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                    title="Delete this fact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: Danger Zone: Delete My Account */}
      <div className="rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <h2 className="text-base sm:text-lg font-bold">Danger Zone: Delete My Account</h2>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
          Permanently delete your user account, all saved family health profiles, learned
          conversational memories, and local browser cache. This action is irreversible. Signing up
          again later with the same email will yield a blank account starting at Step 1.
        </p>

        <button
          type="button"
          onClick={() => {
            setDeleteConfirmationText('');
            setDeleteError('');
            setDeleteModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-transform active:scale-95 cursor-pointer"
        >
          Delete Account
        </button>
      </div>

      {/* Edit My Details Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="max-w-xl w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Profile Details
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedDetails} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
                {editErrors.fullName && (
                  <p className="text-rose-600 text-[11px] mt-1">{editErrors.fullName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                  {editErrors.age && (
                    <p className="text-rose-600 text-[11px] mt-1">{editErrors.age}</p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    State / UT
                  </label>
                  <select
                    value={editState}
                    onChange={(e) => {
                      setEditState(e.target.value);
                      setEditCity('');
                      setEditLocationObj(null);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    {INDIAN_STATES_AND_UTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* City with Autocomplete */}
              <div className="relative">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  City or Town
                </label>
                <input
                  type="text"
                  required
                  value={editCity}
                  onChange={(e) => handleEditCitySearch(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
                {editSearchingCity && (
                  <Loader2 className="w-3.5 h-3.5 text-sky-500 animate-spin absolute right-3 top-8" />
                )}
                {editShowSuggestions && editCitySuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-44 overflow-y-auto rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-xs">
                    {editCitySuggestions.map((s) => (
                      <button
                        key={`${s.id}-${s.latitude}`}
                        type="button"
                        onMouseDown={() => handleSelectEditCity(s)}
                        className="w-full text-left px-3 py-1.5 hover:bg-sky-50 dark:hover:bg-slate-700"
                      >
                        {s.name}, {s.admin1} ({s.country})
                      </button>
                    ))}
                  </div>
                )}
                {editLocationObj && (
                  <span className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Verified: {editLocationObj.name} (
                    {editLocationObj.latitude.toFixed(2)}°, {editLocationObj.longitude.toFixed(2)}°)
                  </span>
                )}
                {editCityError && (
                  <p className="text-amber-600 text-[11px] mt-1">{editCityError}</p>
                )}
                {editErrors.city && (
                  <p className="text-rose-600 text-[11px] mt-1">{editErrors.city}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold"
                >
                  {editSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Dialog */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Delete Account & Erase All Data?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This action is <strong>irreversible</strong>. We will permanently delete your
              Firestore records (profile, {familyMembers.length} family members,{' '}
              {savedMemories.length} learned memories), your authentication identity, and local
              storage caches.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Type <strong>delete</strong> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="delete"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-center tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setDeleteConfirmationText('');
                    setDeleteError('');
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isDeleteConfirmed || deleteLoading}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all ${
                    isDeleteConfirmed && !deleteLoading
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-md cursor-pointer'
                      : 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  {deleteLoading ? 'Erasing Everything...' : 'Permanently Delete Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
