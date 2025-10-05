'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';


// This maps specific emails to roles within the Omuto organization.
const emailToRoleMap: Record<string, string> = {
    // Executive
    'mcmike@omuto.org': 'Executive Director',
    '1mark2mike@gmail.com': 'Executive Director',
    'mcmike.mutumba@gmail.com': 'Executive Director',
    
    // Programs & Partnerships
    'dianah@omuto.org': 'Programs & Partnerships Manager',
    'nansikombidianah@gmail.com': 'Programs & Partnerships Manager',

    // Operations & Field
    'kasirye@omuto.org': 'Operations & Field Manager',
    'kasirye.connie@gmail.com': 'Operations & Field Manager',
    'bashir@omuto.org': 'Field Coordinator',
    
    // Media, Comms & Finance
    'alex@omuto.org': 'Media & Communications Lead',

    // Resource Mobilization
    'akera@omuto.org': 'Resource Mobilization Lead',
    'akerajonpaul@gmail.com': 'Resource Mobilization Lead',
};

async function createUserProfile(userCredential: UserCredential) {
    const user = userCredential.user;
    if (!user || !user.email) return;

    const db = getFirestore(user.auth.app);
    const userRef = doc(db, 'users', user.uid);
    const role = emailToRoleMap[user.email.toLowerCase()] || 'Staff';

    const userProfile = {
        id: user.uid,
        name: user.displayName || user.email.split('@')[0],
        email: user.email,
        role: role,
    };

    // Use a non-blocking write to create the user profile document
    setDoc(userRef, userProfile, { merge: true }).catch((error) => {
        console.error("Error creating user profile:", error);
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: userRef.path,
                operation: 'create',
                requestResourceData: userProfile,
            })
        );
    });
}


/** Initiate email/password sign-up and create user profile. */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(createUserProfile)
    .catch(error => {
      // Handle sign-up errors (e.g., email already in use)
      console.error("Email sign-up error:", error);
      // Optionally emit a global error or show a toast
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password).catch(error => {
      // Handle sign-in errors (e.g., wrong password)
      console.error("Email sign-in error:", error);
  });
}

/** Initiate Google sign-in and create user profile. */
export function initiateGoogleSignIn(authInstance: Auth): void {
    const provider = new GoogleAuthProvider();
    signInWithPopup(authInstance, provider)
      .then(createUserProfile)
      .catch(error => {
        // Handle Google sign-in errors
        console.error("Google sign-in error:", error);
      });
}
