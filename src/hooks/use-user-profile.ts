'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User as AuthUser } from 'firebase/auth';
import type { User as UserProfile } from '@/lib/types';

export function useUserProfile(user: AuthUser | null) {
  const firestore = useFirestore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userDocRef = useMemoFirebase(() => {
    if (firestore && user) {
      return doc(firestore, 'users', user.uid);
    }
    return null;
  }, [firestore, user]);

  const { data, isLoading: isDocLoading, error } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    setIsLoading(true);
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    if (isDocLoading) {
      return; // Wait for the doc to load
    }
    
    if (data) {
      setProfile(data);
    } else if (!isDocLoading && !data) {
      // If loading is finished and there's still no data,
      // it's likely a new user whose profile doc hasn't been created yet.
      // We'll provide a temporary, safe-to-render profile.
      setProfile({
        id: user.uid,
        name: user.displayName || 'New User',
        email: user.email || '',
        role: 'Staff', // Default role
      });
    }

    setIsLoading(false);

  }, [data, user, isDocLoading, error]);

  return { profile, isLoading };
}
