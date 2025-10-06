'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// --- START: SINGLETON INITIALIZATION ---
// This pattern ensures that Firebase is initialized only once, creating a stable,
// singleton instance of the app, auth, and firestore services that can be
// safely imported and used throughout the entire client-side application.

let firebaseApp: FirebaseApp;

// Check if any Firebase apps are already initialized.
if (!getApps().length) {
  // If not, initialize a new app with the provided configuration.
  firebaseApp = initializeApp(firebaseConfig);
} else {
  // If an app is already initialized, get that instance.
  firebaseApp = getApp();
}

// Get the auth and firestore services from the single app instance.
// These are now stable singletons.
const auth: Auth = getAuth(firebaseApp);
const firestore: Firestore = getFirestore(firebaseApp);

// --- END: SINGLETON INITIALIZATION ---

/**
 * DEPRECATED: This function is no longer needed as initialization happens once, globally.
 * It is kept for backward compatibility to avoid breaking existing imports, but it now
 * simply returns the globally stable instances.
 * @returns The globally initialized Firebase services.
 */
export function initializeFirebase() {
  return { firebaseApp, auth, firestore };
}

// Export the stable, singleton instances directly.
export { firebaseApp, auth, firestore };

// Export other necessary modules.
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
