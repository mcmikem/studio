
'use client';

// This file serves as a barrel file for exporting all necessary Firebase
// functionality to the rest of the application. It simplifies imports.

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

// This function is now designed to be called safely on the client.
// It ensures that Firebase is initialized only once.
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
  
  return { firebaseApp, auth, firestore };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-login';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';
export * from './storage';
