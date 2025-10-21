
'use client';

import { useMemo } from 'react';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User as AuthUser } from 'firebase/auth';
import type { User as UserProfile } from '@/lib/types';


export function useUserProfile(user: AuthUser | null) {
  const firestore = useFirestore();

  // useMemo is the correct hook here, not useMemoFirebase, because this is a standard memoization
  // of a derived value (the docRef), not the result of a Firebase query itself.
  const userDocRef = useMemo(() => {
    if (user && firestore) {
      return doc(firestore, 'users', user.uid);
    }
    return null;
  }, [user, firestore]);

  // The useDoc hook is designed to be stable and will handle the Firestore subscription.
  // It will update automatically if the document changes in Firestore.
  const { data: profile, isLoading: isDocLoading, error } = useDoc<UserProfile>(userDocRef);

  // If there's no authenticated user, the hook isn't loading and there's no profile.
  const isLoading = !user ? false : isDocLoading;

  return { profile, isLoading, error };
}
