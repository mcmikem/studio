

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
} from "@/lib/data"

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
    role: "Media & Communications Lead",
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

async function seedInitialData(db: Firestore) {
  console.log("Checking if initial data seeding is needed...")

  const programsCollection = collection(db, "programs");
  const programsSnapshot = await getDocs(query(programsCollection, limit(1)));

  if (!programsSnapshot.empty) {
    console.log("Core data (programs) already exists. Skipping seed.");
    return;
  }
  
  console.log("Seeding initial data...")
  const batch = writeBatch(db)

  const collectionsToSeed = [
    { name: "programs", data: samplePrograms },
    { name: "partnerships", data: samplePartnerships },
    { name: "key-results", data: sampleKeyResults },
    { name: "projects", data: sampleProjects },
    { name: "impact-metrics", data: sampleImpactMetrics },
    { name: "alerts", data: sampleAlerts },
    { name: "events", data: sampleCalendarEvents },
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

async function createUserProfile(
  userCredential: UserCredential,
  db: Firestore,
) {
  const user = userCredential.user
  if (!user || !user.email) return userCredential

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
    
    // Seed data only for the very first user to sign up
    await seedInitialData(db)
    
    const userData = approvedUsers[user.email.toLowerCase()]
    const userProfile = {
      id: user.uid,
      name: userData.name,
      email: user.email,
      role: userData.role,
      createdAt: serverTimestamp(),
    }

    try {
       await setDoc(userRef, userProfile);
       console.log("User profile created successfully.");
    } catch (error) {
        console.error("Error creating user profile:", error)
        errorEmitter.emit(
          "permission-error",
          new FirestorePermissionError({
            path: userRef.path,
            operation: "write",
            requestResourceData: userProfile,
          })
        )
    }
  } else {
     console.log("User profile already exists, skipping creation.");
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
    .then((userCredential) => {
      if (!isEmailApproved(userCredential.user.email)) {
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
