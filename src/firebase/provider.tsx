
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { type FirebaseApp } from 'firebase/app';
import { type Firestore } from 'firebase/firestore';
import { type Auth, onAuthStateChanged, type User } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { initializeFirebase } from '@/firebase/index';

// --- Context and State Definitions ---

interface FirebaseServices {
    firebaseApp: FirebaseApp | null;
    firestore: Firestore | null;
    auth: Auth | null;
}

interface FirebaseContextState {
  services: FirebaseServices;
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
  // Initialize services immediately. The initializeFirebase function is idempotent.
  const services = useMemo(() => initializeFirebase(), []);

  const [userAuthState, setUserAuthState] = useState<{
    user: User | null; 
    isUserLoading: boolean;
    userError: Error | null;
  }>({
    user: null, 
    isUserLoading: true,
    userError: null,
  });
  
  // Effect for listening to authentication state changes.
  useEffect(() => {
    if (!services?.auth) {
      // If services are not available (e.g., on server), set loading to false.
      setUserAuthState({ user: null, isUserLoading: false, userError: null });
      return;
    };

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
    // The user is considered "loading" if the auth state check hasn't completed.
    // Services are now initialized synchronously on the client.
    const isLoading = userAuthState.isUserLoading;
    return {
      services: services || { firebaseApp: null, firestore: null, auth: null },
      user: userAuthState.user,
      isUserLoading: isLoading,
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
  return {
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

// A hook to create stable query references, only when firestore is ready.
export const useMemoFirebase = <T, >(
  createQuery: (firestore: Firestore) => T | null,
  deps: React.DependencyList = []
): T | null => {
  const firestore = useFirestore();
  // We include firestore in the dependency array to ensure the query is re-created
  // if the firestore instance changes (which it shouldn't, but it's safe).
  // The key is that the factory function `createQuery` will not be called
  // until `firestore` is non-null.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => {
    if (!firestore) return null;
    return createQuery(firestore);
  }, [firestore, ...deps]);
};
