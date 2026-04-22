import { useState, useEffect, useCallback } from 'react';
import { openDB, IDBPDatabase } from 'idb';

interface QueueItem {
  id: string;
  type: string;
  data: Record<string, any>;
  createdAt: number;
  retries: number;
}

interface OfflineQueueDB {
  offlineQueue: {
    key: string;
    value: QueueItem;
  };
}

const DB_NAME = 'omuto-offline';
const DB_VERSION = 2;
const STORE_NAME = 'offlineQueue';
const LEGACY_SYNC_STORE = 'pending-sync';

async function getDB(): Promise<IDBPDatabase<OfflineQueueDB>> {
  return openDB<OfflineQueueDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(LEGACY_SYNC_STORE)) {
        db.createObjectStore(LEGACY_SYNC_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updatePendingCount = useCallback(async () => {
    try {
      const db = await getDB();
      const count = await db.count(STORE_NAME);
      setPendingCount(count);
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  }, []);

  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  const addToQueue = useCallback(async (type: string, data: Record<string, any>) => {
    const item: QueueItem = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      createdAt: Date.now(),
      retries: 0,
    };

    try {
      const db = await getDB();
      await db.add(STORE_NAME, item);
      await updatePendingCount();
      return item.id;
    } catch (error) {
      console.error('Failed to add to queue:', error);
      throw error;
    }
  }, [updatePendingCount]);

  const removeFromQueue = useCallback(async (id: string) => {
    try {
      const db = await getDB();
      await db.delete(STORE_NAME, id);
      await updatePendingCount();
    } catch (error) {
      console.error('Failed to remove from queue:', error);
      throw error;
    }
  }, [updatePendingCount]);

  const syncQueue = useCallback(async (syncFunction: (item: QueueItem) => Promise<void>) => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    try {
      const db = await getDB();
      const items = await db.getAll(STORE_NAME);

      for (const item of items) {
        try {
          await syncFunction(item);
          await db.delete(STORE_NAME, item.id);
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          
          if (item.retries >= 3) {
            await db.delete(STORE_NAME, item.id);
            console.error(`Item ${item.id} removed after max retries`);
          } else {
            await db.put(STORE_NAME, {
              ...item,
              retries: item.retries + 1,
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to sync queue:', error);
    } finally {
      setIsSyncing(false);
      await updatePendingCount();
    }
  }, [isSyncing, isOnline, updatePendingCount]);

  const getPendingItems = useCallback(async (): Promise<QueueItem[]> => {
    try {
      const db = await getDB();
      return db.getAll(STORE_NAME);
    } catch (error) {
      console.error('Failed to get pending items:', error);
      return [];
    }
  }, []);

  const clearQueue = useCallback(async () => {
    try {
      const db = await getDB();
      await db.clear(STORE_NAME);
      await updatePendingCount();
    } catch (error) {
      console.error('Failed to clear queue:', error);
      throw error;
    }
  }, [updatePendingCount]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    addToQueue,
    removeFromQueue,
    syncQueue,
    getPendingItems,
    clearQueue,
    refreshCount: updatePendingCount,
  };
}

export type { QueueItem };
