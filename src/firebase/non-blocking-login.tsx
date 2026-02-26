

'use client';

import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  UserCredential,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  writeBatch,
  collection,
  getDocs,
  query,
  limit,
  Firestore,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from './errors';


// This maps specific emails to roles and names within the Omuto organization.
const approvedUsers: Record<string, { name: string; role: string, supervisorId?: string }> = {
  'mcmike@omuto.org': { name: 'McMike Mutumba', role: 'Executive Director' },
  'programs@omuto.org': {
    name: 'Dianah Nansikombi',
    role: 'Programs & Partnerships Manager',
  },
  'operations@omuto.org': {
    name: 'Kasirye Constantine',
    role: 'Operations & Field Manager',
  },
  'kasiryeconstantine@gmail.com': {
    name: 'Kasirye Constantine',
    role: 'Operations & Field Manager',
  },
  'communications@omuto.org': {
    name: 'Nsereko Alex',
    role: 'Media & Finance Lead',
  },
  'partnerships@omuto.org': {
    name: 'John Paul Akera',
    role: 'Resource Mobilization Lead',
  },
  'essentials.manager@omuto.org': { name: 'Essentials Manager', role: 'Essentials Manager', supervisorId: 'operations@omuto.org' },
  'yc.manager@omuto.org': { name: 'Youth Center Manager', role: 'Youth Center Manager', supervisorId: 'operations@omuto.org' },
  'finance@omuto.org': { name: 'Finance Admin', role: 'Accountant/Finance', supervisorId: 'mcmike@omuto.org' },
  'volunteer@omuto.org': { name: 'Volunteer User', role: 'Volunteer', supervisorId: 'programs@omuto.org' },
  'intern@omuto.org': { name: 'Intern User', role: 'Intern', supervisorId: 'operations@omuto.org' },
  'info@omuto.org': { name: 'Omuto Admin', role: 'Administrator' },
};

export const isEmailApproved = (email: string | null): boolean => {
  if (!email) return false;
  const lowercasedEmail = email.toLowerCase();
  const approvedEmailKeys = Object.keys(approvedUsers);
  return approvedEmailKeys.some(key => key.toLowerCase() === lowercasedEmail);
};


async function seedUserTasks(db: Firestore, userId: string, role: string) {
  console.log(`Seeding initial tasks for new ${role}.`);
  const userTasksCollection = collection(db, 'users', userId, 'tasks');
  let initialTasks = [
    { title: 'Update your profile picture', completed: false, createdAt: serverTimestamp() },
  ];

  if (role === 'Intern' || role === 'Volunteer') {
      initialTasks.push(
          { title: "Read the Intern & Volunteer Guide in the 'Help' section", completed: false, createdAt: serverTimestamp() },
          { title: "Ask the AI Coach: 'What are the main programs at Omuto?'", completed: false, createdAt: serverTimestamp() },
          { title: "Schedule a 15-min intro meeting with your supervisor", completed: false, createdAt: serverTimestamp() }
      );
  } else {
       initialTasks.push(
          { title: 'Review the November Operational Plan', completed: false, createdAt: serverTimestamp() },
          { title: 'Explore your new dashboard and management tools', completed: false, createdAt: serverTimestamp() },
       );
  }

  const userBatch = writeBatch(db);
  initialTasks.forEach((task) => {
    const taskRef = doc(userTasksCollection);
    userBatch.set(taskRef, task);
  });
  await userBatch.commit();
  console.log(`Initial tasks for ${role} seeded successfully.`);
}

async function createUserProfile(userCredential: UserCredential, db: Firestore) {
  const user = userCredential.user;
  if (!user || !user.email) return userCredential;

  const userEmailLower = user.email.toLowerCase();
  
  const approvedEmailKey = Object.keys(approvedUsers).find(
    (key) => key.toLowerCase() === userEmailLower
  );

  if (!approvedEmailKey) {
     await user.delete();
     throw new Error('This email address is not authorized to use this application.');
  }

  const userRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userRef);
  
  const userData = approvedUsers[approvedEmailKey];
  const userProfile = {
    id: user.uid,
    name: userData.name,
    email: user.email,
    role: userData.role,
    photoURL: user.photoURL || '',
    createdAt: serverTimestamp(),
    supervisorId: userData.supervisorId || '',
  };

  // Always set/update the profile to ensure role is correct.
  await setDoc(userRef, userProfile, { merge: true });

  // Only seed data if the user profile is being created for the first time.
  if (!docSnap.exists()) {
    console.log('New user detected. Seeding user-specific tasks...');
    await seedUserTasks(db, user.uid, userData.role);
  }

  return userCredential;
}

/** Unified email/password auth flow. Attempts to sign in, and if user doesn't exist, creates an account. */
export async function initiateEmailAuth(auth: Auth, email: string, password: string): Promise<UserCredential> {
  const db = getFirestore(auth.app);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // If sign-in is successful, update/verify their profile.
    return await createUserProfile(userCredential, db);
  } catch (error: any) {
    // If sign-in fails because the user is not found, attempt to create a new account.
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      if (!isEmailApproved(email)) {
        throw new Error('This email address is not authorized to sign up.');
      }
      try {
        const newUserCredential = await createUserWithEmailAndPassword(auth, email, password);
        return await createUserProfile(newUserCredential, db);
      } catch (signUpError: any) {
        // This will catch errors during the sign-up attempt (e.g., weak password)
        console.error('Email sign-up error during auth flow:', signUpError);
        throw signUpError;
      }
    }
    // Re-throw other sign-in errors (e.g., wrong password)
    console.error('Email sign-in error:', error);
    throw error;
  }
}

/** Initiate Google sign-in and create user profile. */
export function initiateGoogleSignIn(authInstance: Auth) {
  const provider = new GoogleAuthProvider();
  const db = getFirestore(authInstance.app);
  return signInWithPopup(authInstance, provider)
    .then(async (userCredential) => {
      // The createUserProfile function now handles authorization and creation/update.
      return createUserProfile(userCredential, db);
    })
    .catch((error) => {
      console.error('Google sign-in error:', error);
      if (
        error.code === 'auth/popup-closed-by-user' ||
        error.message.includes('not authorized')
      ) {
        authInstance.signOut();
      }
      throw error;
    });
}

/** Sends a password reset email to the user. */
export function initiatePasswordReset(authInstance: Auth, email: string) {
  return sendPasswordResetEmail(authInstance, email).catch((error) => {
    console.error('Password reset error:', error);
    throw error;
  });
}

    
