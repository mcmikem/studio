
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  type Query,
  onSnapshot,
  getDocs,
  type DocumentData,
  type FirestoreError,
  type QuerySnapshot,
  query,
  limit,
  startAfter,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UsePaginatedCollectionOptions<T> {
  pageSize?: number;
  listen?: boolean;
}

export interface UsePaginatedCollectionResult<T> {
  data: WithId<T>[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: FirestoreError | Error | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

/**
 * A hook to fetch a Firestore collection with pagination support.
 * Provides load-more functionality for large datasets.
 */
export function usePaginatedCollection<T = DocumentData>(
  targetQuery: Query<DocumentData> | null | undefined,
  options: UsePaginatedCollectionOptions<T> = { pageSize: 20, listen: true }
): UsePaginatedCollectionResult<T> {
  const pageSize = options.pageSize || 20;
  const [data, setData] = useState<WithId<T>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot<DocumentData> | null>(null);

  const fetchPage = useCallback(async (queryToUse: Query<DocumentData>, isInitial = false) => {
    try {
      const snapshot = await getDocs(queryToUse);
      const results: WithId<T>[] = snapshot.docs.map(doc => ({
        ...(doc.data() as T),
        id: doc.id,
      }));

      if (isInitial) {
        setData(results);
      } else {
        setData(prev => [...prev, ...results]);
      }

      const lastDocument = snapshot.docs[snapshot.docs.length - 1];
      setLastDoc(lastDocument);
      setHasMore(results.length === pageSize);
      setError(null);
    } catch (err: any) {
      console.error('usePaginatedCollection error:', err);
      const path = (queryToUse as any)?._query?.path?.canonicalString() || 'unknown path';
      const contextualError = new FirestorePermissionError({ operation: 'list', path });
      setError(contextualError);
      errorEmitter.emit('permission-error', contextualError);
    }
  }, [pageSize]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || !targetQuery || !lastDoc) return;
    
    setIsLoadingMore(true);
    const nextQuery = query(targetQuery, startAfter(lastDoc), limit(pageSize));
    fetchPage(nextQuery, false).finally(() => setIsLoadingMore(false));
  }, [targetQuery, lastDoc, pageSize, hasMore, isLoadingMore, fetchPage]);

  const refresh = useCallback(() => {
    if (!targetQuery) return;
    setIsLoading(true);
    setData([]);
    setLastDoc(null);
    setHasMore(true);
    const initialQuery = query(targetQuery, limit(pageSize));
    fetchPage(initialQuery, true).finally(() => setIsLoading(false));
  }, [targetQuery, pageSize, fetchPage]);

  useEffect(() => {
    if (!targetQuery) {
      setIsLoading(false);
      setData([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    const initialQuery = query(targetQuery, limit(pageSize));

    if (options.listen) {
      const unsubscribe = onSnapshot(initialQuery, 
        (snapshot: QuerySnapshot<DocumentData>) => {
          const results: WithId<T>[] = snapshot.docs.map(doc => ({
            ...(doc.data() as T),
            id: doc.id,
          }));
          setData(results);
          const lastDocument = snapshot.docs[snapshot.docs.length - 1];
          setLastDoc(lastDocument);
          setHasMore(results.length === pageSize);
          setError(null);
          setIsLoading(false);
        },
        (err: FirestoreError) => {
          console.error('usePaginatedCollection listener error:', err);
          const path = (targetQuery as any)._query?.path?.canonicalString() || 'unknown path';
          const contextualError = new FirestorePermissionError({ operation: 'list', path });
          setError(contextualError);
          setIsLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      fetchPage(initialQuery, true).finally(() => setIsLoading(false));
    }
  }, [targetQuery, options.listen, pageSize, fetchPage]);

  return { data, isLoading, isLoadingMore, error, hasMore, loadMore, refresh };
}
