
'use server';

import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';
import * as fs from 'fs';
import * as path from 'path';

let firestore: Firestore;

function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    try {
      const serviceAccountPath = path.resolve(process.cwd(), 'secrets/serviceAccountKey.json');
      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error("Firebase service account key not found at secrets/serviceAccountKey.json. Ensure the file exists and is correctly placed.");
      }
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      const app = initializeApp({
        credential: cert(serviceAccount),
        projectId: firebaseConfig.projectId,
      });
      firestore = getFirestore(app);
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (e) {
      console.error("Critical Error: Failed to initialize Firebase Admin SDK.", e);
      // In a production environment, you might want to exit the process
      // or have a more robust error handling mechanism.
      throw new Error("Could not initialize Firebase Admin SDK. The application cannot start.");
    }
  } else {
    const app = getApp();
    firestore = getFirestore(app);
  }
}

// Initialize immediately when the module is loaded.
initializeFirebaseAdmin();

// Export the initialized instance.
export { firestore };
