import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';
import * as fs from 'fs';
import * as path from 'path';

interface FirebaseAdminServices {
  app: App;
  firestore: Firestore;
}

let services: FirebaseAdminServices | null = null;

function initializeAdmin(): FirebaseAdminServices {
  if (services) {
    return services;
  }

  // Check if the admin app is already initialized
  const adminApps = getApps().filter(app => app.name === 'firebase-admin');
  if (adminApps.length > 0) {
    const adminApp = adminApps[0];
    services = {
      app: adminApp,
      firestore: getFirestore(adminApp),
    };
    return services;
  }

  // Initialize a new admin app
  try {
    const serviceAccountPath = path.resolve(process.cwd(), 'secrets/serviceAccountKey.json');
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error("Firebase service account key not found at secrets/serviceAccountKey.json. Ensure the file exists and is correctly placed.");
    }
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    const newAdminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: firebaseConfig.projectId,
    }, 'firebase-admin');

    console.log("Firebase Admin SDK initialized successfully.");
    services = {
      app: newAdminApp,
      firestore: getFirestore(newAdminApp),
    };
    return services;
  } catch (e) {
    console.error("Critical Error: Failed to initialize Firebase Admin SDK.", e);
    throw new Error("Could not initialize Firebase Admin SDK. The application cannot start.");
  }
}

/**
 * Returns the singleton instance of the Firebase Admin services.
 * This function ensures that Firebase Admin is initialized only once.
 * @returns An object containing the initialized Firestore instance.
 */
export function getFirebaseAdmin() {
  if (!services) {
    services = initializeAdmin();
  }
  return services;
}
