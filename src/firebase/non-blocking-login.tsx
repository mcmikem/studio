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


// This maps specific emails to roles and names within the Omuto organization.
const approvedUsers: Record<string, { name: string; role: string }> = {
    // Executive
    'mcmike@omuto.org': { name: 'McMike Mutumba', role: 'Executive Director' },
    '1mark2mike@gmail.com': { name: 'McMike Mutumba', role: 'Executive Director' },
    'mcmike.mutumba@gmail.com': { name: 'McMike Mutumba', role: 'Executive Director' },
    
    // Programs & Partnerships
    'programs@omuto.org': { name: 'Dianah Nansikombi', role: 'Programs & Partnerships Manager' },
    'nansikombidianah@gmail.com': { name: 'Dianah Nansikombi', role: 'Programs & Partnerships Manager' },

    // Operations & Field
    'operations@omuto.org': { name: 'Kasirye Constantine', role: 'Operations & Field Manager' },
    'kasirye.connie@gmail.com': { name: 'Kasirye Constantine', role: 'Operations & Field Manager' },
    'bashir@omuto.org': { name: 'Bashir', role: 'Field Coordinator' },
    
    // Media, Comms & Finance
    'communications@omuto.org': { name: 'Nsereko Alex', role: 'Media & Communications Lead' },
    'alex@omuto.org': { name: 'Nsereko Alex', role: 'Media & Communications Lead' },

    // Resource Mobilization
    'partnerships@omuto.org': { name: 'John Paul Akera', role: 'Resource Mobilization Lead' },
    'akera@omuto.org': { name: 'John Paul Akera', role: 'Resource Mobilization Lead' },
    'akerajonpaul@gmail.com': { name: 'John Paul Akera', role: 'Resource Mobilization Lead' },

    // General
    'info@omuto.org': { name: 'Omuto General', role: 'Administrator' },
};

const isEmailApproved = (email: string | null): boolean => {
    if (!email) return false;
    return Object.keys(approvedUsers).includes(email.toLowerCase());
}

async function createUserProfile(userCredential: UserCredential) {
    const user = userCredential.user;
    if (!user || !user.email) return userCredential;

    if (!isEmailApproved(user.email)) {
        // This is a failsafe. This user should not have been created.
        // We delete the user and throw an error.
        await user.delete();
        throw new Error('This email address is not authorized to use this application.');
    }

    const db = getFirestore(user.auth.app);
    const userRef = doc(db, 'users', user.uid);
    const userData = approvedUsers[user.email.toLowerCase()];

    const userProfile = {
        id: user.uid,
        name: userData.name,
        email: user.email,
        role: userData.role,
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

    return userCredential;
}


/** Initiate email/password sign-up and create user profile. */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string) {
  if (!isEmailApproved(email)) {
    return Promise.reject(new Error("This email address is not authorized for sign-up."));
  }
  return createUserWithEmailAndPassword(authInstance, email, password)
    .then(createUserProfile)
    .catch(error => {
      console.error("Email sign-up error:", error);
      throw error;
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string) {
  if (!isEmailApproved(email)) {
    return Promise.reject(new Error("This email address is not authorized to sign in."));
  }
  return signInWithEmailAndPassword(authInstance, email, password)
    .then(createUserProfile) // Ensure profile exists on every sign-in
    .catch(error => {
      console.error("Email sign-in error:", error);
      throw error;
  });
}

/** Initiate Google sign-in and create user profile. */
export function initiateGoogleSignIn(authInstance: Auth) {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(authInstance, provider)
      .then(userCredential => {
          if (!isEmailApproved(userCredential.user.email)) {
              // Important: Sign the user out immediately and throw an error.
              authInstance.signOut();
              throw new Error("This Google account is not authorized to use this application.");
          }
          // If approved, proceed to create their profile.
          return createUserProfile(userCredential);
      })
      .catch(error => {
        console.error("Google sign-in error:", error);
        throw error;
      });
}
