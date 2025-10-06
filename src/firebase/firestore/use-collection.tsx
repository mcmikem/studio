'use client';

import { useState, useEffect }from 'react';
import {
  type Query,
  onSnapshot,
  type DocumentData,
  type FirestoreError,
  type QuerySnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useFirestore } from '@/firebase/provider';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * A stable hook to listen to a Firestore collection.
 * It now relies on the globally stable Firestore instance provided by the context.
 */
export function useCollection<T = DocumentData>(
  targetQuery: Query<DocumentData> | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  // This hook ensures that the Firestore instance is available from the provider,
  // but we don't need to use the returned value in the dependency array anymore
  // because we've made it a stable singleton.
  useFirestore();

  useEffect(() => {
    // If the query is not ready, set the state to not loading and no data.
    if (!targetQuery) {
      setIsLoading(false);
      setData(null);
      setError(null);
      return;
    }

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      targetQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        // Map the documents to include their ID.
        const results: WithId<T>[] = snapshot.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id,
        }));
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        console.error('useCollection error:', err);

        // Try to get a more specific path from the query object for better error reporting.
        const path = (targetQuery as any)._query?.path?.canonicalString() || 'unknown path';

        const contextualError = new FirestorePermissionError({
          operation: 'list', // 'list' is the correct operation for collection queries
          path: path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        // Emit the error for global handling (e.g., showing a toast).
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    // The cleanup function provided by onSnapshot will be called when the
    // component unmounts or when the query changes, preventing memory leaks.
    return () => unsubscribe();
    
    // The dependency array now correctly depends on the query object itself.
    // It is still critical to use `useMemoFirebase` in the calling component
    // to stabilize the query object and prevent unnecessary re-subscriptions.
  }, [targetQuery]);

  return { data, isLoading, error };
}
