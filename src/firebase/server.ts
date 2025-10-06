'use server';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// A function to get the initialized Firebase app, creating it if necessary.
function getInitializedApp(): FirebaseApp {
  if (getApps().length === 0) {
    // If no apps are initialized, initialize a new one with the provided config.
    return initializeApp(firebaseConfig);
  } else {
    // If an app is already initialized, return it.
    return getApp();
  }
}

/**
 * Initializes and returns a Firestore instance for server-side use.
 */
export async function initializeFirebase(): Promise<{ firestore: ReturnType<typeof getFirestore> }> {
  const app = getInitializedApp();
  const firestore = getFirestore(app);
  return { firestore };
}
