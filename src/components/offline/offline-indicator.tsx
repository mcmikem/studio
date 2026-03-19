'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CloudOff, CheckCircle } from 'lucide-react';
import { useOffline } from '@/components/providers/offline-provider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export function OfflineIndicator() {
  const { isOnline, pendingCount, lastSyncTime, isSyncing, syncNow } = useOffline();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isOnline) setDismissed(false);
  }, [isOnline]);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] animate-in slide-in-from-top duration-300">
      {!isOnline ? (
        <div className="bg-destructive/95 text-white px-4 py-2 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-bold">
            <WifiOff className="h-4 w-4" />
            <span>No connection — working offline. Your data is saved locally.</span>
            {pendingCount > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {pendingCount} pending
              </span>
            )}
          </div>
        </div>
      ) : pendingCount > 0 && !dismissed ? (
        <div className="bg-omuto-yellow/90 text-omuto-navy px-4 py-2 text-center shadow-sm">
          <div className="flex items-center justify-center gap-2 text-sm font-bold">
            <CloudOff className="h-4 w-4" />
            <span>
              {pendingCount} item{pendingCount > 1 ? 's' : ''} waiting to upload
              {lastSyncTime && (
                <span className="font-normal opacity-70 ml-1">
                  · Last sync: {format(lastSyncTime, 'h:mm a')}
                </span>
              )}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={syncNow}
              disabled={isSyncing}
              className="h-6 px-2 text-[11px] font-black bg-white/20 hover:bg-white/30 text-omuto-navy ml-2"
            >
              <RefreshCw className={cn('h-3 w-3 mr-1', isSyncing && 'animate-spin')} />
              {isSyncing ? 'Syncing...' : 'Sync now'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="h-6 w-6 p-0 text-omuto-navy/50 hover:text-omuto-navy ml-1"
            >
              ✕
            </Button>
          </div>
        </div>
      ) : isSyncing ? (
        <div className="bg-primary/95 text-white px-4 py-2 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-bold">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Syncing your changes...</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SyncBadge() {
  const { pendingCount, isSyncing } = useOffline();

  if (pendingCount === 0 && !isSyncing) return null;

  if (isSyncing) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-primary">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        <span className="text-[11px] font-semibold">Syncing</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-sm text-omuto-yellow">
      <CloudOff className="h-3.5 w-3.5" />
      <span className="text-[11px] font-semibold">{pendingCount}</span>
    </div>
  );
}
