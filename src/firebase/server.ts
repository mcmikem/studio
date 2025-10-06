'use server';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

/**
 * Initializes and returns a Firebase app instance for server-side use.
 * Ensures that Firebase is initialized only once.
 */
export async function initializeFirebase(): Promise<{ firestore: ReturnType<typeof getFirestore> }> {
  if (!getApps().length) {
    // This is the server, so we use the explicit config.
    initializeApp(firebaseConfig);
  }
  const app = getApp();
  const firestore = getFirestore(app);
  
  return { firestore };
}
