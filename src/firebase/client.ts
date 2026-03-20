import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getMessaging, getToken, isSupported, type Messaging } from "firebase/messaging";
import { firebaseConfig } from "./config";

// --- APP CHECK (Optional: Add NEXT_PUBLIC_APP_CHECK_SITE_KEY to .env.local to enable) ---
// App Check is bundled with firebase v12+, no extra import needed when using compat

// --- CORE INSTANCES (For Legacy/Direct Access) ---
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firestore with multi-tab offline persistence enabled
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Initialize Storage with explicit bucket URL
let storage: FirebaseStorage | undefined;
try {
  storage = getStorage(app);
  console.log("[Firebase] Storage initialized with default bucket");
} catch (error) {
  console.error("[Firebase] Failed to initialize storage:", error);
  if (firebaseConfig.storageBucket) {
    try {
      storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);
      console.log("[Firebase] Storage initialized with explicit bucket");
    } catch (fallbackError) {
      console.error("[Firebase] Fallback storage initialization also failed:", fallbackError);
    }
  }
}

if (!storage) {
  console.warn("[Firebase] Storage not available - file uploads will not work");
}

// Use a promise to handle the async nature of isSupported() for messaging
let messaging: Messaging | null = null;

if (typeof window !== "undefined") {
    // We don't await here to avoid blocking module evaluation, 
    // but in a real app you might want to initialize this in a useEffect or similar.
    // For the exported 'messaging' variable, it might be null initially.
    isSupported().then((supported: boolean) => {
        if (supported) {
            messaging = getMessaging(app);
        }
    }).catch((err: any) => console.error("Firebase Messaging support check failed", err));
}

// --- HELPER FUNCTIONS ---

export interface FirebaseServices {
    firebaseApp: FirebaseApp;
    firestore: Firestore;
    auth: Auth;
    storage: FirebaseStorage | undefined;
    messaging: Messaging | null;
}

export const initializeFirebase = (): FirebaseServices => {
    return {
        firebaseApp: app,
        firestore: db,
        auth: auth,
        storage: storage,
        messaging: messaging
    };
};

export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
    if (typeof window !== "undefined") {
        try {
            const supported = await isSupported();
            if (supported) {
                const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
                return getMessaging(app);
            }
        } catch (e) {
            console.error("Firebase Messaging not supported", e);
        }
    }
    return null;
};

export const requestNotificationPermission = async () => {
    if (typeof window === "undefined") return null;

    try {
        const messagingInstance = await getFirebaseMessaging();
        if (!messagingInstance) {
            console.warn("FCM: Messaging not supported or initialization failed.");
            return null;
        }

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            const token = await getToken(messagingInstance, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY // Suggesting use of VAPID key
            });
            console.log("FCM: Token generated successfully.");
            return token;
        } else {
            console.warn("FCM: Notification permission denied.");
        }
    } catch (error) {
        console.error("FCM: Error requesting permission or getting token:", error);
    }
    return null;
};

// Export instances for legacy use
export { app, auth, db, storage, messaging };
