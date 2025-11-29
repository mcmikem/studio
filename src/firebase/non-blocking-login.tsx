
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
import {
  samplePrograms,
  samplePartnerships,
  sampleProjects,
  sampleImpactMetrics,
  sampleAlerts,
  sampleCalendarEvents,
  sampleTeamWeeklyPlans,
  sampleHistoricalIncome,
  sampleHistoricalExpenses,
  sampleTaskTemplates,
} from '@/lib/data';

// This maps specific emails to roles and names within the Omuto organization.
const approvedUsers: Record<string, { name: string; role: string }> = {
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
  'volunteer@omuto.org': { name: 'Volunteer User', role: 'Volunteer' },
  'intern@omuto.org': { name: 'Intern User', role: 'Intern' },
  'info@omuto.org': { name: 'Omuto Admin', role: 'Administrator' },
};

export const isEmailApproved = (email: string | null): boolean => {
  if (!email) return false;
  const lowercasedEmail = email.toLowerCase();
  const lowercasedApprovedEmails = Object.keys(approvedUsers).map(e => e.toLowerCase());
  return lowercasedApprovedEmails.includes(lowercasedEmail);
};

const sampleKeyResults = [
    { title: 'NOV-KR1', description: 'Clear October Backlogs (tree planting, documentary, data)', currentProgress: 0, target: 100, deadline: '2025-11-07', priority: 'High' },
    { title: 'NOV-KR2', description: 'Launch Omuto Essentials & Sell 50+ Products', currentProgress: 0, target: 50, deadline: '2025-11-28', priority: 'High' },
    { title: 'NOV-KR3', description: 'Secure 3 OFA Partnership Commitments (MOUs)', currentProgress: 0, target: 3, deadline: '2025-11-21', priority: 'High' },
    { title: 'NOV-KR4', description: 'Achieve 100% Omuto Central Adoption & Coordination', currentProgress: 0, target: 100, deadline: '2025-11-28', priority: 'Medium' },
];


async function seedInitialData(db: Firestore) {
  console.log('Checking if initial data seeding is needed...');
  const programsSnapshot = await getDocs(
    query(collection(db, 'programs'), limit(1))
  );
  if (!programsSnapshot.empty) {
    console.log('Core data already exists. Skipping initial seed.');
    return;
  }

  // This is the very first user signup. Seed the entire database.
  console.log('Seeding all initial data...');
  const batch = writeBatch(db);

  const collectionsToSeed = [
    { name: 'programs', data: samplePrograms },
    { name: 'partnerships', data: samplePartnerships },
    { name: 'key-results', data: sampleKeyResults },
    { name: 'projects', data: sampleProjects },
    { name: 'impact-metrics', data: sampleImpactMetrics },
    { name: 'alerts', data: sampleAlerts },
    { name: 'events', data: sampleCalendarEvents },
    { name: 'team-workplans', data: sampleTeamWeeklyPlans },
    { name: 'income', data: sampleHistoricalIncome },
    { name: 'expenses', data: sampleHistoricalExpenses },
    { name: 'task-templates', data: sampleTaskTemplates },
    {
      name: 'proposals',
      data: [
        {
          title: 'GlobalGiving Youth Empowerment Grant',
          partnerName: 'GlobalGiving',
          amountRequested: 5000000,
          status: 'Submitted',
          submissionDate: '2025-09-15',
          createdAt: new Date(),
        },
        {
          title: 'Local District Education Fund',
          partnerName: 'Mpigi District',
          amountRequested: 2500000,
          status: 'Draft',
          submissionDate: '2025-10-20',
          createdAt: new Date(),
        },
      ],
    },
  ];

  for (const coll of collectionsToSeed) {
    for (const item of coll.data) {
      const docRef = doc(collection(db, coll.name));
      batch.set(docRef, item);
    }
  }

  try {
    await batch.commit();
    console.log('Initial data seeded successfully.');
  } catch (error) {
    console.error('Error seeding data: ', error);
  }
}

async function seedUserTasks(db: Firestore, userId: string) {
  console.log('Seeding user-specific tasks for new user.');
  const userTasksCollection = collection(db, 'users', userId, 'tasks');
  const initialTasks = [
    {
      title: 'Complete your profile information',
      completed: false,
      createdAt: serverTimestamp(),
    },
    {
      title: 'Review the November Operational Plan',
      completed: false,
      createdAt: serverTimestamp(),
    },
    {
      title: 'Explore your new dashboard',
      completed: false,
      createdAt: serverTimestamp(),
    },
  ];
  const userBatch = writeBatch(db);
  initialTasks.forEach((task) => {
    const taskRef = doc(userTasksCollection);
    userBatch.set(taskRef, task);
  });
  await userBatch.commit();
  console.log('Initial tasks seeded for new user.');
}

async function createUserProfile(userCredential: UserCredential, db: Firestore) {
  const user = userCredential.user;
  if (!user || !user.email) return userCredential;

  const userEmailLower = user.email.toLowerCase();
  const approvedEmailKey = Object.keys(approvedUsers).find(key => key.toLowerCase() === userEmailLower);

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
  };

  // Always set/update the profile to ensure role is correct.
  await setDoc(userRef, userProfile, { merge: true });

  // Only seed data if the user profile is being created for the first time.
  if (!docSnap.exists()) {
    console.log('New user detected. Seeding data...');
    // Check if any core data exists. If not, this is the very first user.
    const programsSnapshot = await getDocs(
      query(collection(db, 'programs'), limit(1))
    );
    if (programsSnapshot.empty) {
      await seedInitialData(db);
    }
    await seedUserTasks(db, user.uid);
  }

  return userCredential;
}

/** Initiate email/password sign-up and create user profile. */
export function initiateEmailSignUp(
  authInstance: Auth,
  email: string,
  password: string
) {
  const db = getFirestore(authInstance.app);
  return createUserWithEmailAndPassword(authInstance, email, password)
    .then((cred) => createUserProfile(cred, db))
    .catch((error) => {
      console.error('Email sign-up error:', error);
      throw error;
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(
  authInstance: Auth,
  email: string,
  password: string
) {
  const db = getFirestore(authInstance.app);
  return signInWithEmailAndPassword(authInstance, email, password)
    .then((cred) => createUserProfile(cred, db)) // Also run profile check/update on sign-in
    .catch((error) => {
      console.error('Email sign-in error:', error);
      throw error;
    });
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
