'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPendingSyncs, removePendingSync, isOnline, addPendingSync } from '@/lib/offline-sync';
import { useFirestore } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export function useOfflineSync(options?: { onSyncComplete?: () => void }) {
  const [isOnlineState, setIsOnlineState] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const firestore = useFirestore();

  const refreshCount = useCallback(async () => {
    const pending = await getPendingSyncs();
    setPendingCount(pending.length);
  }, []);

  useEffect(() => {
    setIsOnlineState(isOnline());
    refreshCount();

    const handleOnline = () => {
      setIsOnlineState(true);
      syncPending();
    };
    
    const handleOffline = () => setIsOnlineState(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshCount]);

  const syncPending = useCallback(async () => {
    if (!isOnlineState || !firestore) return;
    
    setIsSyncing(true);
    const pending = await getPendingSyncs();
    
    for (const item of pending) {
      try {
        if (item.type === 'create') {
          await addDoc(collection(firestore, item.collection), item.data);
        } else if (item.type === 'update') {
          await updateDoc(doc(firestore, item.collection, item.id), item.data);
        } else if (item.type === 'delete') {
          await deleteDoc(doc(firestore, item.collection, item.id));
        }
        
        await removePendingSync(item.id);
        options?.onSyncComplete?.();
      } catch (error: any) {
        console.error('Sync failed for item:', item.id, error);
      }
    }
    
    await refreshCount();
    setIsSyncing(false);
  }, [firestore, isOnlineState, options, refreshCount]);

  const queueOfflineAction = useCallback(async (
    type: 'create' | 'update' | 'delete',
    collectionName: string,
    data: any,
    id?: string
  ) => {
    await addPendingSync({
      id: id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type,
      collection: collectionName,
      data,
      timestamp: Date.now(),
    });
    
    if (isOnlineState) {
      syncPending();
    }
    
    await refreshCount();
  }, [isOnlineState, syncPending, refreshCount]);

  return {
    isOnline: isOnlineState,
    pendingCount,
    isSyncing,
    syncPending,
    queueOfflineAction,
    refreshCount,
  };
}
