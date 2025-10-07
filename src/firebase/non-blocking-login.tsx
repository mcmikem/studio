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
} from "firebase/firestore"
import { errorEmitter } from "./error-emitter"
import { FirestorePermissionError } from "./errors"
import {
  sampleUsers,
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

  const usersCollection = collection(db, "users")
  const userSnapshot = await getDocs(query(usersCollection, limit(1)))

  if (!userSnapshot.empty) {
    console.log("Data already exists. Skipping seed.")
    return
  }

  console.log("Seeding initial data...")
  const batch = writeBatch(db)

  // Seed Users
  for (const user of sampleUsers) {
    // In a real app, you'd get the UID after creation, but for seeding we use a placeholder
    // and let the user profile creation logic handle the real UID.
    // For this seed, we'll create a new doc and use its ID.
    const userRef = doc(collection(db, "users"))
    batch.set(userRef, { ...user, id: userRef.id })
  }

  // Seed Other Collections
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
    // Optionally emit a global error
  }
}

async function createUserProfile(
  userCredential: UserCredential,
  db: Firestore
) {
  const user = userCredential.user
  if (!user || !user.email) return userCredential

  if (!isEmailApproved(user.email)) {
    await user.delete()
    throw new Error(
      "This email address is not authorized to use this application."
    )
  }

  // Seed data only for the very first user to sign up
  if (userCredential.additionalUserInfo?.isNewUser) {
    await seedInitialData(db)
  }

  // Check if user profile already exists.
  const userRef = doc(db, "users", user.uid)

  // Non-blocking write to create or update the user profile document
  const userData = approvedUsers[user.email.toLowerCase()]
  const userProfile = {
    id: user.uid,
    name: userData.name,
    email: user.email,
    role: userData.role,
  }

  setDoc(userRef, userProfile, { merge: true }).catch((error) => {
    console.error("Error creating/updating user profile:", error)
    errorEmitter.emit(
      "permission-error",
      new FirestorePermissionError({
        path: userRef.path,
        operation: "write",
        requestResourceData: userProfile,
      })
    )
  })

  return userCredential
}

/** Initiate email/password sign-up and create user profile. */
export function initiateEmailSignUp(
  authInstance: Auth,
  email: string,
  password: string
) {
  if (!isEmailApproved(email)) {
    return Promise.reject(
      new Error("This email address is not authorized for sign-up.")
    )
  }
  const db = getFirestore(authInstance.app)
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
  if (!isEmailApproved(email)) {
    return Promise.reject(
      new Error("This email address is not authorized to sign in.")
    )
  }
  const db = getFirestore(authInstance.app)
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
        // Immediately sign out the user if not authorized
        authInstance.signOut()
        throw new Error(
          "This Google account is not authorized to use this application."
        )
      }
      return createUserProfile(userCredential, db)
    })
    .catch((error) => {
      console.error("Google sign-in error:", error)
      // Ensure we don't leave a partially logged-in state
      if (error.code !== "auth/popup-closed-by-user") {
        authInstance.signOut()
      }
      throw error
    })
}
