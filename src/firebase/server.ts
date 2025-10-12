
'use server';

import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

// IMPORTANT: The service account key is injected via environment variables
// and should not be hardcoded. This is a secure way to initialize the Admin SDK.
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

let _app: App;
let _firestore: Firestore;

/**
 * Initializes the Firebase Admin SDK, reusing the existing instance if available.
 * This is the correct and efficient way to interact with Firebase from the server-side.
 * @returns An object containing the Firestore instance.
 */
export async function initializeFirebase(): Promise<{ firestore: Firestore }> {
  if (getApps().length === 0) {
    if (!serviceAccountString) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
    }
    try {
        const serviceAccount = JSON.parse(serviceAccountString);
        _app = initializeApp({
            credential: cert(serviceAccount),
            projectId: firebaseConfig.projectId,
        });
        _firestore = getFirestore(_app);
    } catch (e) {
        console.error("Failed to parse Firebase service account credentials.", e);
        throw new Error("Invalid Firebase service account credentials.");
    }
  } else {
    _app = getApp();
    _firestore = getFirestore(_app);
  }
  
  return { firestore: _firestore };
}

    