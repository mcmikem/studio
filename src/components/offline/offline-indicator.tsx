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
    <div className="fixed bottom-4 right-4 z-[200] animate-in slide-in-from-bottom-4 duration-300">
      {!isOnline ? (
        <div className="bg-destructive text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">Offline</span>
          {pendingCount > 0 && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
              {pendingCount} pending
            </span>
          )}
        </div>
      ) : pendingCount > 0 && !dismissed ? (
        <div className="bg-omuto-yellow text-omuto-navy px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2">
          <CloudOff className="h-4 w-4" />
          <span className="text-sm font-medium">
            {pendingCount} pending
          </span>
          {lastSyncTime && (
            <span className="text-xs opacity-70">
              Last sync: {format(lastSyncTime, 'h:mm a')}
            </span>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={syncNow}
            disabled={isSyncing}
            className="h-7 px-2 text-xs font-bold bg-white/20 hover:bg-white/30 ml-1"
          >
            <RefreshCw className={cn('h-3 w-3 mr-1', isSyncing && 'animate-spin')} />
            {isSyncing ? 'Syncing' : 'Sync'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="h-7 w-7 p-0 text-xs text-omuto-navy/50 hover:text-omuto-navy ml-1"
          >
            ✕
          </Button>
        </div>
      ) : isSyncing ? (
        <div className="bg-primary text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Syncing...</span>
        </div>
      ) : null}
    </div>
  );
}

export function SyncBadge() {
  const { pendingCount, isSyncing, isOnline } = useOffline();

  if (pendingCount === 0 && !isSyncing) return null;

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-destructive">
        <WifiOff className="h-3.5 w-3.5" />
        <span className="text-[11px] font-semibold">Offline</span>
      </div>
    );
  }

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
