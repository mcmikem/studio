
'use client';

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { type FirebaseApp } from 'firebase/app';
import { type Firestore } from 'firebase/firestore';
import { type Auth, onAuthStateChanged, type User } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { initializeFirebase, type FirebaseServices } from '@/firebase/client';
import { useCollection as useCollectionHook } from './firestore/use-collection';
import { useDoc as useDocHook } from './firestore/use-doc';
import { addDocumentNonBlocking as addDocNonBlocking, updateDocumentNonBlocking as updateDocNonBlocking, deleteDocumentNonBlocking as deleteDocNonBlocking } from './non-blocking-updates';

interface FirebaseContextState {
  services: FirebaseServices | null;
  user: User | null;
  isUserLoading: boolean; 
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

interface FirebaseProviderProps {
  children: React.ReactNode;
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
  
  useEffect(() => {
    if (typeof window !== 'undefined' && !services) {
      const initializedServices = initializeFirebase();
      if (initializedServices) {
        setServices(initializedServices);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!services?.auth) {
      setUserAuthState(prevState => ({ ...prevState, isUserLoading: true }));
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

export const useFirebaseStorage = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebaseStorage must be used within a FirebaseProvider.');
  }
  return context.services?.storage ?? null;
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

export const useMemoFirebase = <T, >(
  createQuery: (db: Firestore) => T | null,
  deps: React.DependencyList = []
): T | null => {
  const firestore = useFirestore();

  const memoizedQuery = useMemo(() => {
    if (!firestore) {
      return null;
    }
    return createQuery(firestore);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore, ...deps]);

  return memoizedQuery;
};

export const useCollection = useCollectionHook;
export const useDoc = useDocHook;
export const addDocumentNonBlocking = addDocNonBlocking;
export const updateDocumentNonBlocking = updateDocNonBlocking;
export const deleteDocumentNonBlocking = deleteDocNonBlocking;
