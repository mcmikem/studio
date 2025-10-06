'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, writeBatch, collection, getDocs, query, limit } from 'firebase/firestore';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';
import { sampleUsers, samplePrograms, samplePartnerships, sampleKeyResults, sampleProjects, sampleImpactMetrics, sampleAlerts, sampleCalendarEvents } from '@/lib/data';


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
    'bashir@omuto.org': { name: 'Bwire Bashir', role: 'Field Coordinator' },
    
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

async function seedInitialData(db: ReturnType<typeof getFirestore>) {
    console.log("Checking if initial data seeding is needed...");

    const collectionsToSeed = [
        { name: 'users', data: sampleUsers },
        { name: 'programs', data: samplePrograms },
        { name: 'partnerships', data: samplePartnerships },
        { name: 'key-results', data: sampleKeyResults },
        { name: 'projects', data: sampleProjects },
        { name: 'impact-metrics', data: sampleImpactMetrics },
        { name: 'alerts', data: sampleAlerts },
        { name: 'events', data: sampleCalendarEvents },
    ];
    
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(query(usersCollection, limit(1)));
    
    if (!userSnapshot.empty) {
        console.log("Data already exists. Skipping seed.");
        return;
    }
    
    console.log("Seeding initial data...");
    const batch = writeBatch(db);

    for (const coll of collectionsToSeed) {
        const collectionRef = collection(db, coll.name);
        for (const item of coll.data) {
            // For users, we use a specific ID. Let Firestore generate IDs for others.
            let docRef;
            if (coll.name === 'users') {
                 // Find the user details from approvedUsers to get the correct ID
                const userDetail = Object.values(approvedUsers).find(u => u.name === (item as any).name);
                const userEmail = Object.keys(approvedUsers).find(key => approvedUsers[key] === userDetail);
                if(userEmail) {
                    docRef = doc(collectionRef); // Let firestore create id
                    batch.set(docRef, { ...item, id: docRef.id }); 
                }
            } else {
                docRef = doc(collectionRef);
                batch.set(docRef, item);
            }
        }
    }

    await batch.commit();
    console.log("Initial data seeded successfully.");
}


async function createUserProfile(userCredential: UserCredential) {
    const user = userCredential.user;
    if (!user || !user.email) return userCredential;

    if (!isEmailApproved(user.email)) {
        await user.delete();
        throw new Error('This email address is not authorized to use this application.');
    }

    const db = getFirestore(user.auth.app);
    
    if (userCredential.additionalUserInfo?.isNewUser) {
        await seedInitialData(db);
    }
    
    const usersSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', user.email)));

    let userId;
    if (!usersSnapshot.empty) {
        userId = usersSnapshot.docs[0].id;
    } else {
        const newUserRef = doc(collection(db, 'users'));
        userId = newUserRef.id;
        const userData = approvedUsers[user.email.toLowerCase()];
        const userProfile = {
            id: userId,
            name: userData.name,
            email: user.email,
            role: userData.role,
        };
        // Use a non-blocking write to create the user profile document
        setDoc(newUserRef, userProfile).catch((error) => {
            console.error("Error creating user profile:", error);
            errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: newUserRef.path,
                    operation: 'create',
                    requestResourceData: userProfile,
                })
            );
        });
    }

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
    .then(createUserProfile) 
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
              authInstance.signOut();
              throw new Error("This Google account is not authorized to use this application.");
          }
          return createUserProfile(userCredential);
      })
      .catch(error => {
        console.error("Google sign-in error:", error);
        throw error;
      });
}
