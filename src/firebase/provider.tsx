
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { type FirebaseApp } from 'firebase/app';
import { type Firestore } from 'firebase/firestore';
import { type Auth, onAuthStateChanged, type User } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { initializeFirebase } from '@/firebase/index';

// --- Context and State Definitions ---

interface FirebaseServices {
    firebaseApp: FirebaseApp;
    firestore: Firestore;
    auth: Auth;
}

interface FirebaseContextState {
  services: FirebaseServices | null;
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
  const [services, setServices] = useState<FirebaseServices | null>(null);

  const [userAuthState, setUserAuthState] = useState<{
    user: User | null; 
    isUserLoading: boolean;
    userError: Error | null;
  }>({
    user: null, 
    isUserLoading: true,
    userError: null,
  });

  // Effect for initializing Firebase services safely on the client
  useEffect(() => {
    // This check ensures initialization only happens on the client, and only once.
    if (typeof window !== 'undefined' && !services) {
      const initializedServices = initializeFirebase();
      if (initializedServices) {
          setServices(initializedServices);
      }
    }
  }, [services]);


  // Effect for listening to authentication state changes
  useEffect(() => {
    if (!services) return; // Don't run auth listener if services are not initialized

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
  }, [services]);

  const contextValue = useMemo((): FirebaseContextState => {
    return {
      services,
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
   if (!context.services) {
    if (typeof window !== 'undefined') {
        throw new Error('Firebase services are not yet available. This may be a race condition or an initialization error.');
    }
    return { firebaseApp: null, firestore: null, auth: null };
  }
  return context.services;
};

export const useAuth = (): Auth | null => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider.');
  }
  return context.services?.auth ?? null;
};

export const useFirestore = (): Firestore | null => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirestore must be used within a FirebaseProvider.');
  }
  return context.services?.firestore ?? null;
};

export const useFirebaseApp = (): FirebaseApp | null => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider.');
  }
  return context.services?.firebaseApp ?? null;
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

