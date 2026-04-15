import { useState, useEffect } from 'react';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { app } from '@/firebase/client';

/**
 * Hook to get Firestore instance
 * Ensures Firestore is initialized before returning
 */
export function useFirestore(): Firestore | null {
  const [firestore, setFirestore] = useState<Firestore | null>(null);

  useEffect(() => {
    // Firestore is initialized in firebase/client.ts
    // We just need to get the instance
    const db = getFirestore(app);
    setFirestore(db);
  }, [app]); // Re-run if app changes (shouldn't happen in practice)

  return firestore;
}