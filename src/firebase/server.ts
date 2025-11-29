
import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';
import * as fs from 'fs';
import * as path from 'path';

let adminApp: App | null = null;
let firestoreInstance: Firestore | null = null;

/**
 * Returns the singleton instance of the Firebase Admin services.
 * This function ensures that Firebase Admin is initialized only once.
 * @returns An object containing the initialized Firestore instance.
 */
export function getFirebaseAdmin() {
  if (adminApp && firestoreInstance) {
    return { firestore: firestoreInstance };
  }

  const appName = 'firebase-admin-app-e9d6a3c2'; // Use a unique name to avoid conflicts
  const existingApp = getApps().find(app => app.name === appName);
  
  if (existingApp) {
    adminApp = existingApp;
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
      }, appName);
  
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (e) {
      console.error("Critical Error: Failed to initialize Firebase Admin SDK.", e);
      // In a server environment, this is a fatal error.
      // We throw to prevent the application from running in a broken state.
      throw new Error("Could not initialize Firebase Admin SDK. The application cannot start.");
    }
  }

  firestoreInstance = getFirestore(adminApp);
  return { firestore: firestoreInstance };
}
