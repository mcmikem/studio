'use client';

import { useEffect, useState, useCallback } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { getPendingSyncs } from '@/lib/offline-sync';

function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshCount = useCallback(async () => {
    const pending = await getPendingSyncs();
    setPendingCount(pending.length);
  }, []);

  useEffect(() => {
    setOnline(isOnline());
    refreshCount();

    const handleOnline = () => {
      setOnline(true);
      refreshCount();
    };
    
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshCount]);

  if (online && pendingCount === 0) return null;

  if (!online) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-auto">
        <div className="bg-amber-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <WifiOff className="h-5 w-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">You're offline</p>
            <p className="text-xs opacity-90">Changes will sync when connected</p>
          </div>
        </div>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-auto">
        <div className={`shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-4 ${
          isSyncing ? 'bg-blue-500' : 'bg-emerald-500'
        } text-white px-4 py-3 rounded-xl`}>
          {isSyncing ? (
            <RefreshCw className="h-5 w-5 shrink-0 animate-spin" />
          ) : (
            <button 
              onClick={() => refreshCount()}
              className="h-5 w-5 shrink-0 hover:scale-110 transition-transform"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">
              {isSyncing ? 'Syncing...' : `${pendingCount} pending ${pendingCount === 1 ? 'change' : 'changes'}`}
            </p>
            <p className="text-xs opacity-90">
              {isSyncing ? 'Uploading to server' : 'Will sync when online'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
