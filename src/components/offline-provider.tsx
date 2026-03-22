"use client"

import { useEffect } from 'react'
import { OfflineStatus, SyncStatusBadge } from '@/components/ui/offline-status'
import { useOfflineSubmission, initOfflineSync } from '@/hooks/use-offline-submission'

export function OfflineProvider() {
  const { syncQueue } = useOfflineSubmission()

  useEffect(() => {
    const cleanup = initOfflineSync(syncQueue)
    return cleanup
  }, [syncQueue])

  return (
    <>
      <div className="sticky top-[3.5rem] z-20 px-2 sm:px-0 -mx-2 sm:mx-0">
        <OfflineStatus className="sm:hidden" showSyncTime={false} />
      </div>
      <SyncStatusBadge />
    </>
  )
}
