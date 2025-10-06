'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  collection,
  query,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useFirestore } from '..';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {Query<DocumentData> | null | undefined} targetQuery -
 * The Firestore Query. Waits if null/undefined. The query object SHOULD be memoized with useMemo.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
  targetQuery: Query<DocumentData> | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const firestore = useFirestore(); // Get firestore instance from context

  const queryRef = useRef(targetQuery);

  useEffect(() => {
    // Check if the query has actually changed.
    // This is a simple string comparison of the query's internal representation.
    // NOTE: This might not catch all changes if the query object is mutated,
    // which is why memoizing the query with useMemo is still the best practice.
    const queryChanged =
      queryRef.current?.toString() !== targetQuery?.toString();

    if (queryChanged) {
      queryRef.current = targetQuery;
    }
  }, [targetQuery]);


  useEffect(() => {
    const currentQuery = queryRef.current;
    if (!currentQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      currentQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = snapshot.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id
        }));
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        console.error("useCollection error:", err);
        const path = (currentQuery as any)._query?.path?.canonicalString() || 'unknown path';
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [firestore, queryRef.current]);

  return { data, isLoading, error };
}
