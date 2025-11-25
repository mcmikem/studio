
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
  isUserLoading: boolean; // This now ONLY tracks auth state changes.
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// --- Provider Component ---

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  // Initialize services immediately on the client.
  const [services, setServices] = useState<FirebaseServices | null>(() => initializeFirebase());

  const [userAuthState, setUserAuthState] = useState<{
    user: User | null; 
    isUserLoading: boolean;
    userError: Error | null;
  }>({
    user: null, 
    isUserLoading: true, // Start as true until first auth check completes.
    userError: null,
  });
  
  // Effect for listening to authentication state changes.
  useEffect(() => {
    if (!services) {
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
    return {
      services,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
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
    services: context.services, // Expose services for the AuthProvider check
  };
};
