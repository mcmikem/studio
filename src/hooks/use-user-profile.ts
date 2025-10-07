'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User as AuthUser } from 'firebase/auth';
import type { User as UserProfile } from '@/lib/types';

export function useUserProfile(user: AuthUser | null) {
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (firestore && user) {
      return doc(firestore, 'users', user.uid);
    }
    return null;
  }, [firestore, user]);

  const { data: profile, isLoading: isDocLoading, error } = useDoc<UserProfile>(userDocRef);

  // This hook now correctly returns the data and loading state from useDoc,
  // which handles the logic of fetching the user profile.
  // We no longer create a temporary "fake" profile, which was the source of UI flashes.
  
  // If there's no authenticated user, the hook isn't loading and there's no profile.
  const isLoading = !user ? false : isDocLoading;

  useEffect(() => {
    if (error) {
        console.error("Error loading user profile:", error);
    }
  }, [error]);

  return { profile, isLoading };
}
