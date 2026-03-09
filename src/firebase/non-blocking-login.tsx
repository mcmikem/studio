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
  Firestore,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';

/**
 * Maps organizational emails to a name and role within Omuto Foundation.
 * For new staff: add their email here and redeploy.
 * Long-term: migrate this to a Firestore `approved-emails` collection.
 */
const approvedUsers: Record<string, { name: string; role: string; supervisorId?: string }> = {
  'mcmike@omuto.org': { name: 'McMike Mutumba', role: 'Executive Director' },
  'dianah@omuto.org': { name: 'Dianah Nansikombi', role: 'Programs & Partnerships Manager' },
  'programs@omuto.org': { name: 'Dianah Nansikombi', role: 'Programs & Partnerships Manager' },
  'operations@omuto.org': { name: 'Kasirye Constantine', role: 'Operations & Field Manager' },
  'kasiryeconstantine@gmail.com': { name: 'Kasirye Constantine', role: 'Operations & Field Manager' },
  'communications@omuto.org': { name: 'Nsereko Alex', role: 'Media & Finance Lead' },
  'partnerships@omuto.org': { name: 'John Paul Akera', role: 'Resource Mobilization Lead' },
  'essentials.manager@omuto.org': { name: 'Essentials Manager', role: 'Essentials Manager', supervisorId: 'operations@omuto.org' },
  'yc.manager@omuto.org': { name: 'Youth Center Manager', role: 'Youth Center Manager', supervisorId: 'operations@omuto.org' },
  'finance@omuto.org': { name: 'Finance Admin', role: 'Accountant/Finance', supervisorId: 'mcmike@omuto.org' },
  'volunteer@omuto.org': { name: 'Volunteer User', role: 'Volunteer', supervisorId: 'programs@omuto.org' },
  'intern@omuto.org': { name: 'Intern User', role: 'Intern', supervisorId: 'operations@omuto.org' },
  'info@omuto.org': { name: 'Omuto Admin', role: 'Administrator' },
};

/** Returns true if the email belongs to a known org staff member. */
export const isOrgEmail = (email: string | null): boolean => {
  if (!email) return false;
  const lower = email.toLowerCase();
  return Object.keys(approvedUsers).some((key) => key.toLowerCase() === lower);
};

async function seedUserTasks(db: Firestore, userId: string, role: string) {
  const userTasksCollection = collection(db, 'users', userId, 'tasks');
  const initialTasks = [
    { title: 'Update your profile picture', completed: false, createdAt: serverTimestamp() },
  ];

  if (role === 'Intern' || role === 'Volunteer') {
    initialTasks.push(
      { title: "Read the Intern & Volunteer Guide in the 'Help' section", completed: false, createdAt: serverTimestamp() },
      { title: "Ask the AI Coach: 'What are the main programs at Omuto?'", completed: false, createdAt: serverTimestamp() },
      { title: 'Schedule a 15-min intro meeting with your supervisor', completed: false, createdAt: serverTimestamp() }
    );
  } else {
    initialTasks.push(
      { title: 'Review the current Operational Plan', completed: false, createdAt: serverTimestamp() },
      { title: 'Explore your dashboard and management tools', completed: false, createdAt: serverTimestamp() }
    );
  }

  const batch = writeBatch(db);
  initialTasks.forEach((task) => {
    const taskRef = doc(userTasksCollection);
    batch.set(taskRef, task);
  });
  await batch.commit();
}

async function createUserProfile(
  userCredential: UserCredential,
  db: Firestore,
  isValidated: boolean = false,
  extraProfileData?: { name?: string; role?: string }
) {
  const user = userCredential.user;
  if (!user || !user.email) return userCredential;

  const userEmailLower = user.email.toLowerCase();
  const approvedEmailKey = Object.keys(approvedUsers).find(
    (key) => key.toLowerCase() === userEmailLower
  );

  const userRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userRef);
  const isNewUser = !docSnap.exists();

  if (!approvedEmailKey) {
    // Personal email — must have been validated via Server Action before calling this
    if (isNewUser && !isValidated) {
      throw new Error('Access denied. Please use the correct Access Code to complete signup.');
    }

    const finalRole = extraProfileData?.role || 'Volunteer';
    const userProfile = {
      id: user.uid,
      name: extraProfileData?.name || user.displayName || 'Team Member',
      email: user.email,
      role: finalRole,
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp(),
      supervisorId: finalRole === 'Intern' ? 'operations@omuto.org' : 'programs@omuto.org',
    };
    await setDoc(userRef, userProfile, { merge: true });
    if (isNewUser) await seedUserTasks(db, user.uid, finalRole);
    return userCredential;
  }

  const userData = approvedUsers[approvedEmailKey];
  const userProfile = {
    id: user.uid,
    name: extraProfileData?.name || userData.name,
    email: user.email,
    role: userData.role,
    photoURL: user.photoURL || '',
    createdAt: serverTimestamp(),
    supervisorId: userData.supervisorId || '',
  };
  await setDoc(userRef, userProfile, { merge: true });
  if (isNewUser) await seedUserTasks(db, user.uid, userData.role);
  return userCredential;
}

/** Sign in an existing user with email and password. The password is never echoed in error messages. */
export async function signInWithEmail(auth: Auth, email: string, password: string): Promise<UserCredential> {
  const db = getFirestore(auth.app);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return await createUserProfile(userCredential, db, true);
  } catch (error: any) {
    if (
      error.code === 'auth/wrong-password' ||
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/invalid-email'
    ) {
      throw new Error('Incorrect email or password. Please check your credentials or contact your team coordinator.');
    }
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found for this email. Please use the Sign Up tab to create your access.');
    }
    throw error;
  }
}

/** Create a new account. The access code must have been validated server-side before calling this. */
export async function signUpWithEmail(
  auth: Auth,
  email: string,
  password: string,
  isValidated: boolean = false,
  fullName?: string,
  role?: string
): Promise<UserCredential> {
  const db = getFirestore(auth.app);

  if (!isValidated && !isOrgEmail(email)) {
    throw new Error('Your Access Code is incorrect. Please contact your Omuto team coordinator.');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return await createUserProfile(userCredential, db, isValidated, { name: fullName, role });
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please use the Log In tab instead.');
    }
    if (error.code === 'auth/weak-password') {
      throw new Error('Password must be at least 6 characters. Please try again.');
    }
    throw error;
  }
}

/** Initiate Google sign-in and create user profile if new. */
export function initiateGoogleSignIn(authInstance: Auth, isValidated: boolean = false) {
  const provider = new GoogleAuthProvider();
  const db = getFirestore(authInstance.app);
  return signInWithPopup(authInstance, provider)
    .then(async (userCredential) => {
      return createUserProfile(userCredential, db, isValidated);
    })
    .catch((error) => {
      if (error.code === 'auth/popup-closed-by-user') {
        authInstance.signOut();
      }
      throw error;
    });
}

/** Sends a password reset email to the user. */
export function initiatePasswordReset(authInstance: Auth, email: string) {
  return sendPasswordResetEmail(authInstance, email).catch((error) => {
    throw error;
  });
}
