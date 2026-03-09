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

// This maps specific emails to roles and names within the Omuto organization.
const approvedUsers: Record<string, { name: string; role: string, supervisorId?: string }> = {
  'mcmike@omuto.org': { name: 'McMike Mutumba', role: 'Executive Director' },
  'dianah@omuto.org': {
    name: 'Dianah Nansikombi',
    role: 'Programs & Partnerships Manager',
  },
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
  
  // Explicitly approved organizational emails
  if (Object.keys(approvedUsers).some(key => key.toLowerCase() === lowercasedEmail)) {
    return true;
  }

  // Any other email is "approved" as they are signing up as volunteers or interns
  return true; 
};

async function seedUserTasks(db: Firestore, userId: string, role: string) {
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
}

async function createUserProfile(
  userCredential: UserCredential, 
  db: Firestore, 
  accessCode?: string,
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
     // If not an organizational email, they MUST be a volunteer or intern
     if (isNewUser && accessCode !== 'Omutofoundation' && accessCode !== 'Omutovolunteer') {
        throw new Error('Personal emails require the correct Access Code to join the team.');
     }

     const finalRole = extraProfileData?.role || 'Volunteer';
     const userProfile = {
       id: user.uid,
       name: extraProfileData?.name || user.displayName || 'Volunteer User',
       email: user.email,
       role: finalRole,
       photoURL: user.photoURL || '',
       createdAt: serverTimestamp(),
       supervisorId: finalRole === 'Intern' ? 'operations@omuto.org' : 'programs@omuto.org',
     };
     await setDoc(userRef, userProfile, { merge: true });

     if (isNewUser) {
        await seedUserTasks(db, user.uid, finalRole);
     }
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

  if (isNewUser) {
    await seedUserTasks(db, user.uid, userData.role);
  }

  return userCredential;
}

/** Sign in an existing user with email and password. */
export async function signInWithEmail(auth: Auth, email: string, password: string): Promise<UserCredential> {
  const db = getFirestore(auth.app);
  const isOrgEmail = email.toLowerCase().endsWith('@omuto.org');
  const requiredPassword = isOrgEmail ? 'Omutofoundation.' : 'Omutovolunteer';

  if (password !== requiredPassword) {
    throw new Error(`Incorrect password. For ${isOrgEmail ? 'staff' : 'volunteers/interns'}, the standard password is ${requiredPassword}`);
  }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return await createUserProfile(userCredential, db);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error(`Wrong Credentials. If you haven't updated your account to the new standard password (${requiredPassword}), please use 'Forgot Password' to reset it.`);
      }
      throw error;
    }
}

/** Create a new account with email and password. */
export async function signUpWithEmail(
  auth: Auth, 
  email: string, 
  password: string, 
  accessCode?: string,
  fullName?: string,
  role?: string
): Promise<UserCredential> {
  const db = getFirestore(auth.app);
  
  const isOrgEmail = email.toLowerCase().endsWith('@omuto.org');
  const requiredPassword = isOrgEmail ? 'Omutofoundation.' : 'Omutovolunteer';

  if (password !== requiredPassword) {
    throw new Error(`To sign up, you must use the ${isOrgEmail ? 'Staff' : 'Volunteer/Intern'} standard password: ${requiredPassword}`);
  }

  if (!isOrgEmail && accessCode !== 'Omutovolunteer' && accessCode !== 'Omutofoundation') {
    throw new Error('Personal emails require the correct Access Code to sign up.');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return await createUserProfile(userCredential, db, accessCode, { name: fullName, role });
  } catch (error: any) {
    throw error;
  }
}

/** Initiate Google sign-in and create user profile. */
export function initiateGoogleSignIn(authInstance: Auth, accessCode?: string) {
  const provider = new GoogleAuthProvider();
  const db = getFirestore(authInstance.app);
  return signInWithPopup(authInstance, provider)
    .then(async (userCredential) => {
      return createUserProfile(userCredential, db, accessCode);
    })
    .catch((error) => {
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
    throw error;
  });
}
