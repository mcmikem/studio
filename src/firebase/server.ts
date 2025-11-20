
'use server';

import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';
import * as fs from 'fs';
import * as path from 'path';

let _app: App;
let _firestore: Firestore;

/**
 * Initializes the Firebase Admin SDK, reusing the existing instance if available.
 * This is the correct and efficient way to interact with Firebase from the server-side.
 * @returns An object containing the Firestore instance.
 */
export async function initializeFirebase(): Promise<{ firestore: Firestore }> {
  if (getApps().length === 0) {
    const serviceAccountPath = path.resolve(process.cwd(), 'secrets/serviceAccountKey.json');
    
    if (!fs.existsSync(serviceAccountPath)) {
        throw new Error("Firebase service account key not found at secrets/serviceAccountKey.json.");
    }
    
    try {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        _app = initializeApp({
            credential: cert(serviceAccount),
            projectId: firebaseConfig.projectId,
        });
        _firestore = getFirestore(_app);
    } catch (e) {
        console.error("Failed to parse or initialize Firebase service account credentials.", e);
        throw new Error("Invalid Firebase service account credentials.");
    }
  } else {
    _app = getApp();
    _firestore = getFirestore(_app);
  }
  
  return { firestore: _firestore };
}
