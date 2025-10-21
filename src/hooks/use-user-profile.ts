
'use client';

import { useMemo } from 'react';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User as AuthUser } from 'firebase/auth';
import type { User as UserProfile } from '@/lib/types';


export function useUserProfile(user: AuthUser | null) {
  const firestore = useFirestore();

  // The dependency array now uses `user?.uid` which is a stable string.
  // This prevents the hook from re-running on every render due to object reference changes.
  const userDocRef = useMemo(() => {
    if (user?.uid && firestore) {
      return doc(firestore, 'users', user.uid);
    }
    return null;
  }, [user?.uid, firestore]);

  // The useDoc hook is designed to be stable and will handle the Firestore subscription.
  const { data: profile, isLoading: isDocLoading, error } = useDoc<UserProfile>(userDocRef);

  // If there's no authenticated user, the hook isn't loading and there's no profile.
  const isLoading = user ? isDocLoading : false;

  return { profile, isLoading, error };
}
