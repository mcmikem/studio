'use server';

import {
  initializeApp,
  getApps,
  getApp,
  FirebaseApp,
  initializeServerApp,
} from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import {deleteApp} from "firebase/app";

// A promise that resolves with the initialized Firebase app
let firebaseAppPromise: Promise<FirebaseApp> | null = null;

/**
 * Initializes and returns a Firebase app instance for server-side use.
 * Ensures that Firebase is initialized only once using a promise-based approach.
 */
function getInitializedApp(): Promise<FirebaseApp> {
  if (firebaseAppPromise) {
    return firebaseAppPromise;
  }

  firebaseAppPromise = new Promise((resolve, reject) => {
    try {
      // Use initializeServerApp for server environments, which is more robust.
      // It handles initialization idempotently.
      const app = initializeServerApp(
        firebaseConfig,
        {
          // Optional: provide a unique app name if you have multiple apps
          appName: 'server-app'
        }
      ).then((app) => {
        // Cleanup logic to delete the app when the server process exits (optional)
        const cleanup = () => deleteApp(app).catch(console.error);
        process.on('exit', cleanup);
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
        return app;
      });
      resolve(app);
    } catch (e) {
      console.error("Failed to initialize server app:", e);
      reject(e);
    }
  });

  return firebaseAppPromise;
}

/**
 * Initializes and returns a Firestore instance for server-side use.
 */
export async function initializeFirebase(): Promise<{ firestore: ReturnType<typeof getFirestore> }> {
  const app = await getInitializedApp();
  const firestore = getFirestore(app);
  return { firestore };
}
