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

  const { data, isLoading: isDocLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    if (isDocLoading) {
      setIsLoading(true);
      return;
    }
    if (data) {
      setProfile(data);
    } else {
      // If no doc, create a default profile structure.
      // This is a fallback and might indicate a race condition on sign-up.
      if (user) {
        setProfile({
          id: user.uid,
          name: user.displayName || 'User',
          email: user.email || '',
          role: 'Staff',
        });
      } else {
        setProfile(null);
      }
    }
    setIsLoading(false);
  }, [data, isDocLoading, user]);

  return { profile, isLoading };
}
