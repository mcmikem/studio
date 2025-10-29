
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth, type Auth, onAuthStateChanged, type User } from 'firebase/auth';
import { firebaseConfig } from './config';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// --- Stable, Singleton Initialization ---
// This ensures Firebase is initialized only ONCE per application lifecycle.
let firebaseApp: FirebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

const auth: Auth = getAuth(firebaseApp);
const firestore: Firestore = getFirestore(firebaseApp);

// Enable offline persistence only once
try {
    enableIndexedDbPersistence(firestore, { cacheSizeBytes: CACHE_SIZE_UNLIMITED });
} catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.warn(
        'Firestore offline persistence failed: Multiple tabs open. Persistence will be enabled in one tab only.'
      );
    } else if (err.code === 'unimplemented') {
      console.warn(
        'Firestore offline persistence failed: The current browser does not support all of the features required.'
      );
    }
}


// --- Context and State Definitions ---

interface FirebaseContextState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// --- Provider Component ---

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const [userAuthState, setUserAuthState] = useState<{
    user: User | null;
    isUserLoading: boolean;
    userError: Error | null;
  }>({
    user: auth.currentUser, // Initialize with current user if available
    isUserLoading: true,
    userError: null,
  });

  // --- Effect for Auth State Subscription ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );

    // This handles the case where the user is already authenticated on initial load
    // before the onAuthStateChanged listener fires.
    if (userAuthState.isUserLoading) {
      if(auth.currentUser) {
         setUserAuthState({ user: auth.currentUser, isUserLoading: false, userError: null });
      } else {
        // If no user is found synchronously, we still need to stop loading.
        // The listener above will catch any async user state changes.
        setUserAuthState(prev => ({ ...prev, isUserLoading: false }));
      }
    }


    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contextValue = useMemo((): FirebaseContextState => {
    return {
      firebaseApp,
      firestore,
      auth,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
    // The userAuthState object is the only dependency that should trigger a re-render
  }, [userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};


// --- Hooks ---

const useStableFirebase = () => {
    return { firebaseApp, firestore, auth };
};


export const useFirebaseServices = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebaseServices must be used within a FirebaseProvider.');
  }
  // Return the stable singleton instances directly
  return useStableFirebase();
};

export const useAuth = (): Auth => {
  return useStableFirebase().auth;
};

export const useFirestore = (): Firestore => {
  return useStableFirebase().firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
  return useStableFirebase().firebaseApp;
};

export const useUser = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  const { user, isUserLoading, userError } = context;
  return { user, isUserLoading, userError };
};


/**
 * A stable version of useMemo for Firebase objects.
 * The factory function will only re-run if the dependencies in the deps array change.
 * It's crucial to use this for creating queries to prevent infinite re-renders.
 */
export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(factory, deps);
}
