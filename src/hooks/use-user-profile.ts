
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
  // Make dependency explicit on the user's UID for stability.
  }, [user?.uid, firestore]);

  const { data: profile, isLoading: isDocLoading, error } = useDoc<UserProfile>(userDocRef);

  // An additional check for when the user object is present but the profile doc is still loading.
  const isLoading = isDocLoading || (!!user && !profile && !error);
  

  return { profile, isLoading, error };
}
