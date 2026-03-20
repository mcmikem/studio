'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { initOfflineDB, getPendingSyncs, removePendingSync, syncPendingChanges, type PendingSync } from '@/lib/offline-sync';
import { useToast } from '@/hooks/use-toast';

interface OfflineContextValue {
  isOnline: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  isSyncing: boolean;
  syncNow: () => Promise<void>;
  pendingSyncs: PendingSync[];
}

const OfflineContext = createContext<OfflineContextValue>({
  isOnline: true,
  pendingCount: 0,
  lastSyncTime: null,
  isSyncing: false,
  syncNow: async () => {},
  pendingSyncs: [],
});

export function useOffline() {
  return useContext(OfflineContext);
}

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncs, setPendingSyncs] = useState<PendingSync[]>([]);
  const { toast } = useToast();
  const syncInProgressRef = useRef(false);

  const refreshPending = useCallback(async () => {
    try {
      const pending = await getPendingSyncs();
      setPendingCount(pending.length);
      setPendingSyncs(pending);
    } catch (e) {
      console.warn('[Offline] Failed to get pending syncs:', e);
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (syncInProgressRef.current || !navigator.onLine) return;
    syncInProgressRef.current = true;
    setIsSyncing(true);

    try {
      const { synced, failed } = await syncPendingChanges();
      setLastSyncTime(new Date());
      await refreshPending();

      if (synced > 0) {
        toast({
          title: 'Synced',
          description: `${synced} item${synced > 1 ? 's' : ''} uploaded${failed > 0 ? `, ${failed} failed` : ''}.`,
        });
      }
    } catch (e) {
      console.warn('[Offline] Sync error:', e);
    } finally {
      syncInProgressRef.current = false;
      setIsSyncing(false);
    }
  }, [refreshPending, toast]);

  useEffect(() => {
    initOfflineDB().then(() => refreshPending()).catch(console.warn);

    const handleOnline = () => {
      setIsOnline(true);
      syncPendingChanges().then(() => refreshPending()).catch(console.warn);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    setIsOnline(navigator.onLine);
    if (navigator.onLine) {
      syncPendingChanges().then(() => refreshPending()).catch(console.warn);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshPending]);

  const value: OfflineContextValue = {
    isOnline,
    pendingCount,
    lastSyncTime,
    isSyncing,
    syncNow,
    pendingSyncs,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}
