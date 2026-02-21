
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getMessaging, getToken, isSupported, type Messaging } from "firebase/messaging";
import { firebaseConfig } from "./config";

// --- CORE INSTANCES (For Legacy/Direct Access) ---
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Use a promise to handle the async nature of isSupported() for messaging
let messaging: Messaging | null = null;

if (typeof window !== "undefined") {
    // We don't await here to avoid blocking module evaluation, 
    // but in a real app you might want to initialize this in a useEffect or similar.
    // For the exported 'messaging' variable, it might be null initially.
    isSupported().then(supported => {
        if (supported) {
            messaging = getMessaging(app);
        }
    }).catch(err => console.error("Firebase Messaging support check failed", err));
}

// --- HELPER FUNCTIONS ---

export interface FirebaseServices {
    firebaseApp: FirebaseApp;
    firestore: Firestore;
    auth: Auth;
    storage: FirebaseStorage;
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
        if (!messagingInstance) return null;

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            const token = await getToken(messagingInstance, {
                vapidKey: "BPC8B4Yf07O-vO9C6i9Lp-i8qP9Q7K0yX0S5T9X0Z0P0Q0V0"
            });
            return token;
        }
    } catch (error) {
        console.error("FCM Token Error:", error);
    }
    return null;
};

// Export instances for legacy use
export { app, auth, db, storage, messaging };
