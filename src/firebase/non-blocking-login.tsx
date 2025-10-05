'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithPopup,
  UserCredential,
} from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';


// This maps specific emails to roles within the Omuto organization.
const emailToRoleMap: Record<string, string> = {
    'mcmike@omuto.org': 'ED',
    'programs@omuto.org': 'PPM', // Programs Manager
    'partnerships@omuto.org': 'PPL', // Programs Lead
    'communications@omuto.org': 'Media', // Media Lead
    'info@omuto.org': 'OPM', // Operations Manager
    // Allow personal emails for key staff for easier login
    '1mark2mike@gmail.com': 'ED',
};

async function createUserProfile(userCredential: UserCredential) {
    const user = userCredential.user;
    if (!user || !user.email) return;

    const db = getFirestore(user.auth.app);
    const userRef = doc(db, 'users', user.uid);
    const role = emailToRoleMap[user.email.toLowerCase()] || 'Volunteer';

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
