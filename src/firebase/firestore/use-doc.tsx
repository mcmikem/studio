'use client';

import { useState, useEffect } from 'react';
import {
  type DocumentReference,
  onSnapshot,
  type DocumentData,
  type FirestoreError,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useFirestore } from '@/firebase/provider';

type WithId<T> = T & { id: string };

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * A stable hook to listen to a single Firestore document.
 * It now relies on the globally stable Firestore instance.
 */
export function useDoc<T = DocumentData>(
  docRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  // Ensure the provider is available, but we don't need the firestore instance
  // in the dependency array as it's now a stable singleton.
  useFirestore();

  useEffect(() => {
    // If the document reference is not ready, reset the state.
    if (!docRef) {
      setIsLoading(false);
      setData(null);
      setError(null);
      return;
    }

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          // If the document exists, set the data including the document ID.
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          // If the document does not exist, set data to null.
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        console.error('useDoc error:', err);
        const contextualError = new FirestorePermissionError({
          operation: 'get', // 'get' is the correct operation for single document reads
          path: docRef.path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);
        // Emit the error for global handling (e.g., toasts).
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    // The cleanup function from onSnapshot will detach the listener on unmount.
    return () => unsubscribe();
    
    // The dependency array correctly depends on the docRef object.
    // It is critical to use `useMemoFirebase` in the calling component
    // to stabilize this reference and prevent re-subscriptions.
  }, [docRef]);

  return { data, isLoading, error };
}
