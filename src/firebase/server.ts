import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';
import * as fs from 'fs';
import * as path from 'path';

// This file uses a singleton pattern to ensure Firebase Admin is initialized only once.
let adminApp: App | undefined;
let adminFirestore: Firestore | undefined;

function initializeAdmin() {
  if (getApps().some(app => app.name === 'firebase-admin')) {
      adminApp = getApp('firebase-admin');
      adminFirestore = getFirestore(adminApp);
  } else {
    try {
      const serviceAccountPath = path.resolve(process.cwd(), 'secrets/serviceAccountKey.json');
      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error("Firebase service account key not found at secrets/serviceAccountKey.json. Ensure the file exists and is correctly placed.");
      }
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: firebaseConfig.projectId,
      }, 'firebase-admin');
      adminFirestore = getFirestore(adminApp);
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (e) {
      console.error("Critical Error: Failed to initialize Firebase Admin SDK.", e);
      // In a server environment, if Firebase Admin fails, we should throw to halt the process.
      throw new Error("Could not initialize Firebase Admin SDK. The application cannot start.");
    }
  }
}

// Call the initialization function immediately when the module is loaded.
initializeAdmin();

/**
 * Returns the singleton instance of the Firebase Admin services.
 * Throws an error if the services could not be initialized.
 * @returns An object containing the initialized Firestore instance.
 */
export function getFirebaseAdmin() {
    if (!adminFirestore) {
        // This should theoretically not be reached if the module loading works as expected,
        // but it's a safeguard.
        throw new Error("Firebase Admin SDK not initialized. The server process might be in an inconsistent state.");
    }
    return { firestore: adminFirestore };
}
