// src/context/profile/firestoreService.js
/**
 * @fileoverview Firestore CRUD operations and realtime listeners for authenticated users.
 */

import { doc, setDoc, deleteDoc, collection, getDocs, onSnapshot } from '../../firebase';

export function subscribeToUserDoc(db, uid, onData, onError) {
  const userDocRef = doc(db, 'users', uid);
  return onSnapshot(userDocRef, onData, onError);
}

export function subscribeToFamilyCollection(db, uid, onData, onError) {
  const familyColRef = collection(db, 'users', uid, 'family');
  return onSnapshot(familyColRef, onData, onError);
}

export function subscribeToMemoryCollection(db, uid, onData, onError) {
  const memoryColRef = collection(db, 'users', uid, 'memory');
  return onSnapshot(memoryColRef, onData, onError);
}

export async function saveUserDoc(db, uid, payload) {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(userDocRef, { ...payload, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function saveFamilyMemberDoc(db, uid, memberId, memberData) {
  const memberDocRef = doc(db, 'users', uid, 'family', memberId);
  await setDoc(
    memberDocRef,
    { ...memberData, id: memberId, updatedAt: new Date().toISOString() },
    { merge: true }
  );
}

export async function deleteFamilyMemberDoc(db, uid, memberId) {
  const memberDocRef = doc(db, 'users', uid, 'family', memberId);
  await deleteDoc(memberDocRef);
}

export async function saveMemoryDoc(db, uid, memoryId, memoryData) {
  const memoryDocRef = doc(db, 'users', uid, 'memory', memoryId);
  await setDoc(memoryDocRef, memoryData);
}

export async function deleteMemoryDoc(db, uid, memoryId) {
  const memoryDocRef = doc(db, 'users', uid, 'memory', memoryId);
  await deleteDoc(memoryDocRef);
}

export async function deleteUserSubcollections(db, uid) {
  const [famSnapshot, memSnapshot] = await Promise.all([
    getDocs(collection(db, 'users', uid, 'family')),
    getDocs(collection(db, 'users', uid, 'memory'))
  ]);
  const deletions = [
    ...famSnapshot.docs.map((d) => deleteDoc(doc(db, 'users', uid, 'family', d.id))),
    ...memSnapshot.docs.map((d) => deleteDoc(doc(db, 'users', uid, 'memory', d.id)))
  ];
  await Promise.all(deletions);
}

export async function clearAllUserFirestoreData(db, uid, defaultPreferredName = '') {
  await deleteUserSubcollections(db, uid);
  await setDoc(doc(db, 'users', uid), {
    profile: null,
    preferredName: defaultPreferredName,
    onboarding: { step: 'profile', completedAt: null },
    updatedAt: new Date().toISOString()
  });
}

export async function deleteAllAccountFirestoreData(db, uid) {
  await deleteUserSubcollections(db, uid);
  await deleteDoc(doc(db, 'users', uid));
}
