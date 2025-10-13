'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User as AuthUser } from 'firebase/auth';
import type { User as UserProfile } from '@/lib/types';


export function useUserProfile(user: AuthUser | null) {
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (user && firestore) {
      return doc(firestore, 'users', user.uid);
    }
    return null;
  }, [user, firestore]);

  const { data: profile, isLoading: isDocLoading, error } = useDoc<UserProfile>(userDocRef);

  // If there's no authenticated user, the hook isn't loading and there's no profile.
  const isLoading = !user ? false : isDocLoading;

  useEffect(() => {
    // This effect specifically handles the case where useDoc returns an error.
    // We will transform it into the specialized FirestorePermissionError if it's a permission issue.
    if (error && userDocRef) {
        // The useDoc hook already wraps the error in FirestorePermissionError and emits it.
        // We log here for server-side visibility during development but the primary
        // error handling path is through the global emitter.
        console.error("Error loading user profile in useUserProfile:", error.message);
        
        // Although useDoc already emits, we ensure it's handled here as a fallback
        // in case the error structure changes. This check is for robustness.
        if (!(error instanceof FirestorePermissionError)) {
             const permissionError = new FirestorePermissionError({
                operation: 'get',
                path: userDocRef.path,
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    }
  }, [error, userDocRef]);

  return { profile, isLoading, error };
}
