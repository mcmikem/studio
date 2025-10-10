
'use server';

import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

// IMPORTANT: The service account key is injected via environment variables
// and should not be hardcoded. This is a secure way to initialize the Admin SDK.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

let _app: App;
let _firestore: Firestore;

/**
 * Initializes the Firebase Admin SDK, reusing the existing instance if available.
 * This is the correct and efficient way to interact with Firebase from the server-side.
 * @returns An object containing the Firestore instance.
 */
export async function initializeFirebase(): Promise<{ firestore: Firestore }> {
  if (getApps().length === 0) {
    _app = initializeApp({
      credential: cert(serviceAccount),
      projectId: firebaseConfig.projectId,
    });
    _firestore = getFirestore(_app);
  } else {
    _app = getApp();
    _firestore = getFirestore(_app);
  }
  
  return { firestore: _firestore };
}
