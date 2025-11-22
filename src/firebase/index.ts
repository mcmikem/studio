
'use client';

// This file serves as a barrel file for exporting all necessary Firebase
// functionality to the rest of the application. It simplifies imports.

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

// --- Stable, Singleton Initialization ---
let firebaseApp: FirebaseApp;
let firestore: Firestore;
let auth: Auth;

if (typeof window !== 'undefined') {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }

  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);

  // Correctly handle the asynchronous nature of enableIndexedDbPersistence
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
} else {
    // Provide null or mock initializations for server-side rendering if necessary
    // This branch helps prevent errors during server-side builds.
    firebaseApp = null as any;
    firestore = null as any;
    auth = null as any;
}


export function initializeFirebase() {
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
