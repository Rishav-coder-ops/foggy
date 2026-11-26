/**
 * @fileoverview Hook handling Firestore subscription and offline resilience for user profiles.
 */

import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { setStoredCity } from '../../services/api';
import { loadDemoProfile } from './demoStorage.js';
import {
  subscribeToUserDoc,
  subscribeToFamilyCollection,
  subscribeToMemoryCollection,
  saveUserDoc
} from './firestoreService.js';
import { loadProfileFromLocalStorage, saveProfileToLocalStorage } from './profileStorage.js';
import { ensureVerifiedCoordinates } from './profileDefaults.js';

const FIRESTORE_SYNC_TIMEOUT_MS = 8000;

/**
 * Manages profile synchronization between Firestore and local storage.
 * @param {object} params
 * @returns {{ syncBlocked: boolean, loadingProfile: boolean, retrySync: () => void }}
 */
export function useProfileSync({
  user,
  isAuthenticated,
  isDemo,
  uid,
  profileData,
  preferredName,
  onboarding,
  familyMembers,
  savedMemories,
  setProfileData,
  setPreferredName,
  setOnboarding,
  setFamilyMembers,
  setSavedMemories
}) {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [syncBlocked, setSyncBlocked] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const retrySync = () => {
    setSyncBlocked(false);
    setLoadingProfile(true);
    setRetryTrigger((c) => c + 1);
  };

  useEffect(() => {
    if (!isAuthenticated || !uid) {
      setProfileData(null);
      setPreferredName('');
      setOnboarding({ step: 'profile', completedAt: null });
      setFamilyMembers([]);
      setSavedMemories([]);
      setLoadingProfile(false);
      setSyncBlocked(false);
      return;
    }

    if (isDemo) {
      const demoState = loadDemoProfile();
      ensureVerifiedCoordinates(demoState.profile).then((verified) => {
        setProfileData(verified);
        if (verified?.latitude != null && verified?.longitude != null) {
          setStoredCity({
            name: verified.city,
            admin1: verified.state || '',
            country: verified.country || 'India',
            lat: verified.latitude,
            lon: verified.longitude
          });
        }
      });
      setPreferredName(demoState.preferredName || 'Demo User');
      setOnboarding(
        demoState.onboarding || { step: 'done', completedAt: new Date().toISOString() }
      );
      setFamilyMembers(demoState.familyMembers || []);
      setSavedMemories(demoState.savedMemories || []);
      setLoadingProfile(false);
      setSyncBlocked(false);
      return;
    }

    const cachedBackup = loadProfileFromLocalStorage(uid);
    if (cachedBackup) {
      if (cachedBackup.profile) setProfileData(cachedBackup.profile);
      if (cachedBackup.preferredName) setPreferredName(cachedBackup.preferredName);
      if (cachedBackup.onboarding) setOnboarding(cachedBackup.onboarding);
      if (Array.isArray(cachedBackup.familyMembers)) setFamilyMembers(cachedBackup.familyMembers);
      if (Array.isArray(cachedBackup.savedMemories)) setSavedMemories(cachedBackup.savedMemories);
      if (cachedBackup.profile?.latitude != null && cachedBackup.profile?.longitude != null) {
        setStoredCity({
          name: cachedBackup.profile.city,
          admin1: cachedBackup.profile.state || '',
          country: cachedBackup.profile.country || 'India',
          lat: cachedBackup.profile.latitude,
          lon: cachedBackup.profile.longitude
        });
      }
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setSyncBlocked(true);
      setLoadingProfile(false);
      return;
    }

    if (!db) {
      setSyncBlocked(true);
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    let syncDelivered = false;

    const timeoutTimer = setTimeout(() => {
      if (!syncDelivered) {
        setSyncBlocked(true);
        setLoadingProfile(false);
      }
    }, FIRESTORE_SYNC_TIMEOUT_MS);

    const handleSyncError = (error) => {
      const msg = String(error?.message || '').toLowerCase();
      const code = String(error?.code || '').toLowerCase();
      const isBlockedOrUnavailable =
        (typeof navigator !== 'undefined' && navigator.onLine === false) ||
        code === 'unavailable' ||
        code === 'permission-denied' ||
        code === 'failed-precondition' ||
        msg.includes('unavailable') ||
        msg.includes('blocked') ||
        msg.includes('client') ||
        msg.includes('network');

      if (isBlockedOrUnavailable || !syncDelivered) {
        setSyncBlocked(true);
      }
      setLoadingProfile(false);
    };

    const unsubUser = subscribeToUserDoc(
      db,
      uid,
      (snapshot) => {
        syncDelivered = true;
        clearTimeout(timeoutTimer);
        setSyncBlocked(false);

        if (snapshot.exists()) {
          const data = snapshot.data();
          const rawProf = data.profile || null;
          const pref =
            data.preferredName ||
            data.profile?.fullName?.split(' ')[0] ||
            user.displayName?.split(' ')[0] ||
            'Friend';
          setPreferredName(pref);
          const nextOnb = data.onboarding || { step: 'profile', completedAt: null };
          setOnboarding(nextOnb);

          if (rawProf && rawProf.city) {
            ensureVerifiedCoordinates(rawProf).then((verified) => {
              setProfileData(verified);
              if (verified?.latitude != null && verified?.longitude != null) {
                setStoredCity({
                  name: verified.city,
                  admin1: verified.state || '',
                  country: verified.country || 'India',
                  lat: verified.latitude,
                  lon: verified.longitude
                });
              }
              saveProfileToLocalStorage(uid, {
                profile: verified,
                preferredName: pref,
                onboarding: nextOnb,
                familyMembers,
                savedMemories
              });
              if (
                verified?.latitude !== rawProf.latitude ||
                verified?.longitude !== rawProf.longitude
              ) {
                if (db && uid) {
                  saveUserDoc(db, uid, { profile: verified }).catch(() => {});
                }
              }
            });
          } else {
            setProfileData(rawProf);
            saveProfileToLocalStorage(uid, {
              profile: rawProf,
              preferredName: pref,
              onboarding: nextOnb,
              familyMembers,
              savedMemories
            });
          }
        } else if (!cachedBackup) {
          setProfileData(null);
          setPreferredName(user.displayName?.split(' ')[0] || '');
          setOnboarding({ step: 'profile', completedAt: null });
        }
        setLoadingProfile(false);
      },
      (error) => handleSyncError(error)
    );

    const unsubFamily = subscribeToFamilyCollection(
      db,
      uid,
      (snapshot) => {
        syncDelivered = true;
        clearTimeout(timeoutTimer);
        const members = [];
        snapshot.forEach((d) => members.push({ id: d.id, ...d.data() }));
        setFamilyMembers(members);
        saveProfileToLocalStorage(uid, {
          profile: profileData || cachedBackup?.profile,
          preferredName: preferredName || cachedBackup?.preferredName,
          onboarding: onboarding || cachedBackup?.onboarding,
          familyMembers: members,
          savedMemories
        });
      },
      (error) => handleSyncError(error)
    );

    const unsubMemory = subscribeToMemoryCollection(
      db,
      uid,
      (snapshot) => {
        syncDelivered = true;
        clearTimeout(timeoutTimer);
        const memories = [];
        snapshot.forEach((d) => memories.push({ id: d.id, ...d.data() }));
        setSavedMemories(memories);
      },
      (error) => handleSyncError(error)
    );

    return () => {
      clearTimeout(timeoutTimer);
      unsubUser();
      unsubFamily();
      unsubMemory();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, uid, isDemo, user?.displayName, retryTrigger]);

  return { loadingProfile, syncBlocked, retrySync };
}
