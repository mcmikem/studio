
'use client';

// This file serves as a barrel file for exporting all necessary Firebase
// functionality to the rest of the application. It simplifies imports.

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

// This function is now designed to be called safely from within a React component's effect.
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return null;
  }

  let firebaseApp: FirebaseApp;
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }

  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  enableIndexedDbPersistence(firestore, { cacheSizeBytes: CACHE_SIZE_UNLIMITED })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn(
          'Firestore offline persistence failed: Multiple tabs open. Persistence will be enabled in one tab only.'
        );
      } else if (err.code === 'unimplemented') {
        console.warn(
          'Firestore offline persistence failed: The current browser does not support all of the features required.'
        );
      }
    });

    return { firebaseApp, auth, firestore };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-login';
export * from './non-blocking-writes';
export * from './errors';
export * from './error-emitter';
export * from './storage';

