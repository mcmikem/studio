
'use client';

import { useMemo } from 'react';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User as AuthUser } from 'firebase/auth';
import type { User as UserProfile } from '@/lib/types';


export function useUserProfile(user: AuthUser | null) {
  const firestore = useFirestore();

  const userDocRef = useMemo(() => {
    // Ensure both user UID and firestore instance are available.
    if (user?.uid && firestore) {
      return doc(firestore, 'users', user.uid);
    }
    return null;
  // Make dependency explicit on the user's UID and the firestore instance.
  }, [user?.uid, firestore]);

  const { data: profile, isLoading: isDocLoading, error } = useDoc<UserProfile>(userDocRef);

  // A more robust loading state check.
  const isLoading = isDocLoading || (!!user && !profile && !error);
  

  return { profile, isLoading, error };
}

