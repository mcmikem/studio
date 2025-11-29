
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

export interface UseCollectionOptions {
  listen?: boolean;
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
  options: UseCollectionOptions = { listen: true }
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!targetQuery) {
      setIsLoading(false);
      setData(null);
      setError(null);
      return;
    }

    setIsLoading(true);

    if (options.listen) {
      // Real-time listener
      const unsubscribe = onSnapshot(
        targetQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const results: WithId<T>[] = snapshot.docs.map(doc => ({
            ...(doc.data() as T),
            id: doc.id,
          }));
          setData(results);
          setError(null);
          setIsLoading(false);
        },
        (err: FirestoreError) => {
          console.error('useCollection (onSnapshot) error:', err);
          const path = (targetQuery as any)._query?.path?.canonicalString() || 'unknown path';
          const contextualError = new FirestorePermissionError({ operation: 'list', path });
          setError(contextualError);
          setData(null);
          setIsLoading(false);
          errorEmitter.emit('permission-error', contextualError);
        }
      );
      return () => unsubscribe();
    } else {
      // Fetch once
      getDocs(targetQuery)
        .then((snapshot) => {
          const results: WithId<T>[] = snapshot.docs.map(doc => ({
            ...(doc.data() as T),
            id: doc.id,
          }));
          setData(results);
          setError(null);
        })
        .catch((err: FirestoreError) => {
          console.error('useCollection (getDocs) error:', err);
          const path = (targetQuery as any)._query?.path?.canonicalString() || 'unknown path';
          const contextualError = new FirestorePermissionError({ operation: 'list', path });
          setError(contextualError);
          setData(null);
          errorEmitter.emit('permission-error', contextualError);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [targetQuery, options.listen]);

  return { data, isLoading, error };
}
