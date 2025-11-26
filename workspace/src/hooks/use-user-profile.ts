
'use client';

import { useMemo } from 'react';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User as AuthUser } from 'firebase/auth';
import type { User as UserProfile } from '@/lib/types';


export function useUserProfile(user: AuthUser | null) {
  const firestore = useFirestore();

  const userDocRef = useMemo(() => {
    if (user?.uid && firestore) {
      return doc(firestore, 'users', user.uid);
    }
    return null;
  }, [user?.uid, firestore]);

  const { data: profile, isLoading: isDocLoading, error } = useDoc<UserProfile>(userDocRef);

  // Loading is true ONLY if we are expecting a user but haven't loaded their profile doc yet.
  const isLoading = !!user && isDocLoading;
  
  return { profile, isLoading, error };
}
