'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    setLastSynced(new Date());

    const handleOnline = () => {
      setIsOnline(true);
      setLastSynced(new Date());
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        setLastSynced(new Date());
      }
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, []);

  if (isOnline && !lastSynced) return null;

  const timeAgo = lastSynced 
    ? Math.floor((Date.now() - lastSynced.getTime()) / 60000)
    : null;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
      isOnline 
        ? "bg-green-50 text-green-700 border border-green-200" 
        : "bg-amber-50 text-amber-700 border border-amber-200",
      className
    )}>
      {isOnline ? (
        <>
          <Wifi className="h-3.5 w-3.5" />
          {timeAgo !== null && (
            <span>Synced {timeAgo < 1 ? 'just now' : `${timeAgo}m ago`}</span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span>Offline - changes will sync when connected</span>
        </>
      )}
    </div>
  );
}
