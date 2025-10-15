
"use client"
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from "firebase/auth"
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
} from "firebase/firestore"
import { errorEmitter } from "./error-emitter"
import { FirestorePermissionError } from "./errors"
import {
  samplePrograms,
  samplePartnerships,
  sampleKeyResults,
  sampleProjects,
  sampleImpactMetrics,
  sampleAlerts,
  sampleCalendarEvents,
  sampleTeamWeeklyPlans,
  sampleHistoricalIncome,
  sampleHistoricalExpenses,
} from "@/lib/data"
import { setDocumentNonBlocking } from "@/firebase";

// This maps specific emails to roles and names within the Omuto organization.
const approvedUsers: Record<string, { name: string; role: string }> = {
  // Executive
  "mcmike@omuto.org": { name: "McMike Mutumba", role: "Executive Director" },
  "1mark2mike@gmail.com": { name: "McMike Mutumba", role: "Executive Director" },
  "mcmike.mutumba@gmail.com": {
    name: "McMike Mutumba",
    role: "Executive Director",
  },

  // Programs & Partnerships
  "programs@omuto.org": {
    name: "Dianah Nansikombi",
    role: "Programs & Partnerships Manager",
  },
  "nansikombidianah@gmail.com": {
    name: "Dianah Nansikombi",
    role: "Programs & Partnerships Manager",
  },

  // Operations & Field
  "operations@omuto.org": {
    name: "Kasirye Constantine",
    role: "Operations & Field Manager",
  },
  "kasirye.connie@gmail.com": {
    name: "Kasirye Constantine",
    role: "Operations & Field Manager",
  },
  "bashir@omuto.org": { name: "Bwire Bashir", role: "Field Coordinator" },

  // Media, Comms & Finance
  "communications@omuto.org": {
    name: "Nsereko Alex",
    role: "Media & Communications Lead",
  },
  "alex@omuto.org": {
    name: "Nsereko Alex",
    role: "Media & Finance Lead",
  },

  // Resource Mobilization
  "partnerships@omuto.org": {
    name: "John Paul Akera",
    role: "Resource Mobilization Lead",
  },
  "akera@omuto.org": {
    name: "John Paul Akera",
    role: "Resource Mobilization Lead",
  },
  "akerajonpaul@gmail.com": {
    name: "John Paul Akera",
    role: "Resource Mobilization Lead",
  },

  // General
  "info@omuto.org": { name: "Omuto General", role: "Administrator" },
}

const isEmailApproved = (email: string | null): boolean => {
  if (!email) return false
  return Object.keys(approvedUsers).includes(email.toLowerCase())
}

async function seedInitialData(db: Firestore, userId: string) {
  console.log("Checking if initial data seeding is needed...")
  
  // This is the very first user signup. Seed the entire database.
  console.log("Seeding all initial data...")
  const batch = writeBatch(db)

  const collectionsToSeed = [
    { name: "programs", data: samplePrograms },
    { name: "partnerships", data: samplePartnerships },
    { name: "key-results", data: sampleKeyResults },
    { name: "projects", data: sampleProjects },
    { name: "impact-metrics", data: sampleImpactMetrics },
    { name: "alerts", data: sampleAlerts },
    { name: "events", data: sampleCalendarEvents },
    { name: "team-workplans", data: sampleTeamWeeklyPlans },
    { name: 'income', data: sampleHistoricalIncome },
    { name: 'expenses', data: sampleHistoricalExpenses },
     { name: "proposals", data: [
        { title: 'GlobalGiving Youth Empowerment Grant', partnerName: 'GlobalGiving', amountRequested: 5000000, status: 'Submitted', submissionDate: '2025-09-15', createdAt: new Date() },
        { title: 'Local District Education Fund', partnerName: 'Mpigi District', amountRequested: 2500000, status: 'Draft', submissionDate: '2025-10-20', createdAt: new Date() },
      ]
    },
  ]

  for (const coll of collectionsToSeed) {
    for (const item of coll.data) {
      const docRef = doc(collection(db, coll.name))
      batch.set(docRef, item)
    }
  }

  try {
    await batch.commit()
    console.log("Initial data seeded successfully.")
  } catch (error) {
    console.error("Error seeding data: ", error)
  }
}

async function seedUserTasks(db: Firestore, userId: string) {
    console.log("Seeding user-specific tasks for new user.");
    const userTasksCollection = collection(db, "users", userId, "tasks");
    const initialTasks = [
      { title: "Complete your profile information", completed: false, createdAt: serverTimestamp() },
      { title: "Review the October Operational Plan", completed: false, createdAt: serverTimestamp() },
      { title: "Explore your new dashboard", completed: false, createdAt: serverTimestamp() },
    ];
    const userBatch = writeBatch(db);
    initialTasks.forEach(task => {
        const taskRef = doc(userTasksCollection);
        userBatch.set(taskRef, task);
    });
    await userBatch.commit();
    console.log("Initial tasks seeded for new user.");
}


async function createUserProfile(
  userCredential: UserCredential,
  db: Firestore,
) {
  const user = userCredential.user
  if (!user || !user.email) return userCredential

  // CRITICAL FIX: Check for approval BEFORE any database operations.
  if (!isEmailApproved(user.email)) {
    // If user is not approved, delete their Firebase Auth account immediately
    // and throw an error to prevent them from staying logged in.
    await user.delete()
    throw new Error(
      "This email address is not authorized to use this application."
    )
  }

  const userRef = doc(db, "users", user.uid)
  const docSnap = await getDoc(userRef);
  
  // Only create a user profile if one doesn't already exist.
  if (!docSnap.exists()) {
    console.log("User profile does not exist, creating one...");

    const userData = approvedUsers[user.email.toLowerCase()]
    const userProfile = {
      id: user.uid,
      name: userData.name,
      email: user.email,
      role: userData.role,
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp(),
    }
    
    // Check if any core data exists. If not, this is the very first user.
    const programsSnapshot = await getDocs(query(collection(db, "programs"), limit(1)));
    if (programsSnapshot.empty) {
        await seedInitialData(db, user.uid);
    }
    
    // Now create the user profile document and seed their tasks
    await setDoc(userRef, userProfile, { merge: true });
    await seedUserTasks(db, user.uid);
    
  } else {
     console.log("User profile already exists, skipping creation and seeding.");
  }

  return userCredential
}

/** Initiate email/password sign-up and create user profile. */
export function initiateEmailSignUp(
  authInstance: Auth,
  email: string,
  password: string
) {
  const db = getFirestore(authInstance.app)
  
  if (!isEmailApproved(email)) {
      throw new Error("This email address is not authorized to sign up.");
  }

  return createUserWithEmailAndPassword(authInstance, email, password)
    .then((cred) => createUserProfile(cred, db))
    .catch((error) => {
      console.error("Email sign-up error:", error)
      throw error
    })
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(
  authInstance: Auth,
  email: string,
  password: string
) {
  const db = getFirestore(authInstance.app)
  if (!isEmailApproved(email)) {
      throw new Error("This email address is not authorized to use this application.");
  }
  return signInWithEmailAndPassword(authInstance, email, password)
    .then((cred) => createUserProfile(cred, db))
    .catch((error) => {
      console.error("Email sign-in error:", error)
      throw error
    })
}

/** Initiate Google sign-in and create user profile. */
export function initiateGoogleSignIn(authInstance: Auth) {
  const provider = new GoogleAuthProvider()
  const db = getFirestore(authInstance.app)
  return signInWithPopup(authInstance, provider)
    .then(async (userCredential) => {
      if (!isEmailApproved(userCredential.user.email)) {
        // If the user's email is not on the approved list, we must
        // delete the newly created Firebase Auth user to prevent them
        // from being stuck in an authenticated but unauthorized state.
        await userCredential.user.delete();
        throw new Error(
          "This email address is not authorized to use this application."
        );
      }
      return createUserProfile(userCredential, db);
    })
    .catch((error) => {
      console.error("Google sign-in error:", error)
      // If the error is due to an unapproved user or popup closed, sign them out
      // to prevent getting stuck in a bad auth state.
      if (error.code === 'auth/popup-closed-by-user' || error.message.includes("not authorized")) {
        authInstance.signOut();
      }
      throw error
    })
}
