
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { type FirebaseApp } from 'firebase/app';
import { type Firestore } from 'firebase/firestore';
import { type Auth, onAuthStateChanged, type User } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { initializeFirebase } from '@/firebase/index';

// --- Context and State Definitions ---

interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
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
  // Memoize the Firebase services to ensure they are initialized only once.
  const services = useMemo(() => {
    // This check is important to prevent re-initialization on every render.
    if (typeof window !== 'undefined') {
      return initializeFirebase();
    }
    return null;
  }, []);

  const [userAuthState, setUserAuthState] = useState<{
    user: User | null;
    isUserLoading: boolean;
    userError: Error | null;
  }>({
    user: null, 
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    if (!services) return; // Don't run auth listener if services are not initialized

    // Set up the auth state listener
    const unsubscribe = onAuthStateChanged(
      services.auth,
      (firebaseUser) => {
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );

    return () => unsubscribe();
  }, [services]); // This effect depends only on the stable `services` object.

  const contextValue = useMemo((): FirebaseContextState => {
    return {
      firebaseApp: services?.firebaseApp || null,
      firestore: services?.firestore || null,
      auth: services?.auth || null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading || !services,
      userError: userAuthState.userError,
    };
  }, [services, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};


// --- Hooks ---

export const useFirebaseServices = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebaseServices must be used within a FirebaseProvider.');
  }
  const { firebaseApp, firestore, auth } = context;
   // We throw an error only if the context is available but services are not yet initialized.
   // This helps catch race conditions during development.
  if (!firebaseApp || !firestore || !auth) {
    // In a server component context, this might be expected. In client components, it's an issue.
    if (typeof window !== 'undefined') {
        throw new Error('Firebase services are not yet available. This may be a race condition or an initialization error.');
    }
  }
  return { firebaseApp, firestore, auth };
};

export const useAuth = (): Auth | null => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider.');
  }
  return context.auth;
};

export const useFirestore = (): Firestore | null => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirestore must be used within a FirebaseProvider.');
  }
  return context.firestore;
};

export const useFirebaseApp = (): FirebaseApp | null => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider.');
  }
  return context.firebaseApp;
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
