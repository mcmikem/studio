
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
  // Use useState to ensure Firebase initializes only once on the client.
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
  
  useEffect(() => {
    // This effect runs once on component mount.
    if (!services) {
      const initializedServices = initializeFirebase();
      setServices(initializedServices);
    }
  }, [services]);

  // Effect for listening to authentication state changes.
  useEffect(() => {
    if (!services?.auth) {
      // Set loading to false if services are not available, so the app doesn't hang.
      if (!services) {
          setUserAuthState(prevState => ({ ...prevState, isUserLoading: true }));
      } else {
          setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Firebase services not available.") });
      }
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
    // The user is loading if either the auth state is being determined OR firebase services are not yet initialized.
    const isLoading = userAuthState.isUserLoading || !services;
    return {
      services: services,
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

/**
 * Creates a stable query reference that is memoized and only re-created when dependencies change.
 * Crucially, it waits for the Firestore instance to be available before creating the query.
 * @param createQuery A function that receives the Firestore instance and returns a Firestore Query.
 * @param deps A dependency array to control when the query is re-created.
 * @returns A memoized Firestore Query or null if Firestore is not yet available.
 */
export const useMemoFirebase = <T, >(
  createQuery: (db: Firestore) => T,
  deps: React.DependencyList = []
): T | null => {
  const firestore = useFirestore();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedQuery = useMemo(() => {
    if (!firestore) {
      return null;
    }
    return createQuery(firestore);
  }, [firestore, ...deps]);

  return memoizedQuery;
};
