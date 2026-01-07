
'use client';

import { useState, useEffect } from 'react';
import {
  type Query,
  onSnapshot,
  getDocs,
  type DocumentData,
  type FirestoreError,
  type QuerySnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UseCollectionOptions<T> {
  listen?: boolean;
  onData?: (data: WithId<T>[] | null) => void;
}

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * A hook to fetch a Firestore collection.
 * It can fetch data once or listen for real-time updates.
 */
export function useCollection<T = DocumentData>(
  targetQuery: Query<DocumentData> | null | undefined,
  options: UseCollectionOptions<T> = { listen: true }
): UseCollectionResult<T> | (() => void) {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!targetQuery) {
      setIsLoading(false);
      setData(null);
      setError(null);
      if(options.onData) options.onData(null);
      return;
    }

    setIsLoading(true);

    const processSnapshot = (snapshot: QuerySnapshot<DocumentData>) => {
      const results: WithId<T>[] = snapshot.docs.map(doc => ({
        ...(doc.data() as T),
        id: doc.id,
      }));
      if (options.onData) {
        options.onData(results);
      } else {
        setData(results);
      }
      setError(null);
      setIsLoading(false);
    };

    const handleError = (err: FirestoreError) => {
      console.error('useCollection error:', err);
      const path = (targetQuery as any)._query?.path?.canonicalString() || 'unknown path';
      const contextualError = new FirestorePermissionError({ operation: 'list', path });
      setError(contextualError);
      if (options.onData) {
        options.onData(null);
      } else {
        setData(null);
      }
      setIsLoading(false);
      errorEmitter.emit('permission-error', contextualError);
    };

    if (options.listen) {
      const unsubscribe = onSnapshot(targetQuery, processSnapshot, handleError);
      return () => unsubscribe();
    } else {
      getDocs(targetQuery)
        .then(processSnapshot)
        .catch(handleError)
    }
  }, [targetQuery, options.listen, options.onData]);

  if(options.onData) {
    // When using onData, the component calling the hook manages its own state.
    // We return a no-op function for the cleanup phase, as the useEffect handles it.
    // This hook becomes a 'fire-and-forget' data fetcher in this mode.
    return () => {};
  }

  return { data, isLoading, error };
}
