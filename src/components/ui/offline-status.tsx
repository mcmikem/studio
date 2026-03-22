"use client"

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, CloudOff, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OfflineStatusProps {
  className?: string
  showSyncTime?: boolean
}

export function OfflineStatus({ className, showSyncTime = true }: OfflineStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const saved = localStorage.getItem('sx_pending_sync')
    if (saved) {
      try {
        const queue = JSON.parse(saved)
        setPendingCount(Array.isArray(queue) ? queue.length : 0)
      } catch {
        setPendingCount(0)
      }
    }

    const handleSyncUpdate = (e: Event) => {
      const ce = e as CustomEvent
      setPendingCount(ce.detail?.count ?? 0)
    }
    window.addEventListener('sx_sync_update', handleSyncUpdate)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('sx_sync_update', handleSyncUpdate)
    }
  }, [])

  if (isOnline && pendingCount === 0) {
    return (
      <div className={cn('flex items-center gap-2 text-xs font-bold text-green-600', className)}>
        <Wifi className="h-3.5 w-3.5" />
        <span>Online</span>
      </div>
    )
  }

  if (!isOnline) {
    return (
      <div className={cn('flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2', className)}>
        <WifiOff className="h-3.5 w-3.5" />
        <span>Offline</span>
        {pendingCount > 0 && (
          <span className="bg-orange-200 text-orange-800 text-[10px] font-black px-1.5 py-0.5 rounded-full">
            {pendingCount} queued
          </span>
        )}
        <span className="text-orange-500 font-normal text-[10px]">Will sync when connected</span>
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div className={cn('flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2', className)}>
        <CloudOff className="h-3.5 w-3.5" />
        <span>{pendingCount} item{pendingCount !== 1 ? 's' : ''} pending sync</span>
        <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />
      </div>
    )
  }

  return null
}

export function SyncStatusBadge() {
  const [pendingCount, setPendingCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const saved = localStorage.getItem('sx_pending_sync')
    if (saved) {
      try {
        const queue = JSON.parse(saved)
        setPendingCount(Array.isArray(queue) ? queue.length : 0)
      } catch {
        setPendingCount(0)
      }
    }

    const handleSyncUpdate = (e: Event) => {
      const ce = e as CustomEvent
      setPendingCount(ce.detail?.count ?? 0)
    }
    window.addEventListener('sx_sync_update', handleSyncUpdate)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('sx_sync_update', handleSyncUpdate)
    }
  }, [])

  if (pendingCount === 0 && isOnline) return null

  if (!isOnline) {
    return (
      <div className="fixed bottom-20 right-4 z-50 bg-orange-500 text-white rounded-full px-4 py-2 text-xs font-black shadow-lg flex items-center gap-2">
        <WifiOff className="h-4 w-4" />
        Offline · {pendingCount > 0 ? `${pendingCount} queued` : 'no connection'}
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div className="fixed bottom-20 right-4 z-50 bg-amber-500 text-white rounded-full px-4 py-2 text-xs font-black shadow-lg flex items-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Syncing {pendingCount} item{pendingCount !== 1 ? 's' : ''}...
      </div>
    )
  }

  return null
}
