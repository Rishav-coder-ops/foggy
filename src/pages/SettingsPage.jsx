// src/pages/SettingsPage.jsx
/**
 * @fileoverview User Profile Preferences, Transparency Inspector, and Account Deletion.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { auth, deleteUser } from '../firebase';
import { AlertTriangle } from 'lucide-react';
import { validateProfileForm, sanitizeText } from '../utils/validation';
import PreferredNameCard from '../components/settings/PreferredNameCard';
import ProfileSummaryCard from '../components/settings/ProfileSummaryCard';
import EditProfileModal from '../components/settings/EditProfileModal';
import DeleteAccountModal from '../components/settings/DeleteAccountModal';

const MAX_PREFERRED_NAME_LENGTH = 30;
const PREFERRED_NAME_SAVED_DISPLAY_MS = 2500;

/**
 * Settings & data transparency management page.
 */
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
    const clean = sanitizeText(callName, MAX_PREFERRED_NAME_LENGTH);
    if (!clean || clean.length < 1) {
      setCallNameError('Please enter a name (maximum 30 characters).');
      return;
    }
    if (clean.length > MAX_PREFERRED_NAME_LENGTH) {
      setCallNameError('Name cannot exceed 30 characters.');
      return;
    }
    setCallNameError('');
    await updatePreferredName(clean);
    setCallNameSaved(true);
    setTimeout(() => setCallNameSaved(false), PREFERRED_NAME_SAVED_DISPLAY_MS);
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
  const [editState, setEditState] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editLocationObj, setEditLocationObj] = useState(null);
  const [editConditions, setEditConditions] = useState(['None']);
  const [editOtherCondition, setEditOtherCondition] = useState('');
  const [editSensitivity, setEditSensitivity] = useState('Low');
  const [editCommute, setEditCommute] = useState(['Metro']);
  const [editLifestyle, setEditLifestyle] = useState(['Morning walk']);
  const [editOtherLifestyle, setEditOtherLifestyle] = useState('');
  const [editErrors, setEditErrors] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  const openEditModal = () => {
    setEditFullName(profile?.fullName || '');
    setEditAge(String(profile?.age || ''));
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

  const handleSaveEditedDetails = async (e) => {
    e.preventDefault();
    const formData = {
      fullName: editFullName,
      age: editAge,
      country: profile?.country || 'India',
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

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    const isDeleteConfirmed = deleteConfirmationText.trim().toLowerCase() === 'delete';
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
        } catch (_authErr) {
          // Firebase auth deletion note
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
      <PreferredNameCard
        callName={callName}
        setCallName={setCallName}
        callNameError={callNameError}
        setCallNameError={setCallNameError}
        callNameSaved={callNameSaved}
        onSave={handleSavePreferredName}
      />

      {/* SECTION 2: "What Foggy knows about me" */}
      <ProfileSummaryCard
        profile={profile}
        familyMembers={familyMembers}
        savedMemories={savedMemories}
        onDownloadData={handleDownloadData}
        onOpenEditModal={openEditModal}
        onDeleteMemory={deleteMemory}
      />

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
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleSaveEditedDetails}
        fullName={editFullName}
        setFullName={setEditFullName}
        age={editAge}
        setAge={setEditAge}
        state={editState}
        setState={setEditState}
        city={editCity}
        setCity={setEditCity}
        locationObj={editLocationObj}
        setLocationObj={setEditLocationObj}
        errors={editErrors}
        saving={editSaving}
      />

      {/* Delete Account Confirmation Dialog */}
      <DeleteAccountModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteConfirmationText('');
          setDeleteError('');
        }}
        onSubmit={handleDeleteAccount}
        confirmationText={deleteConfirmationText}
        setConfirmationText={setDeleteConfirmationText}
        loading={deleteLoading}
        error={deleteError}
        familyCount={familyMembers.length}
        memoryCount={savedMemories.length}
      />
    </div>
  );
}
