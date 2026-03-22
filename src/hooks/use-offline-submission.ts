"use client"

import { useCallback, useEffect, useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { useFirestore } from '@/firebase'

interface OfflineQueueItem {
  id: string
  collection: string
  data: Record<string, unknown>
  timestamp: number
  retryCount: number
}

const STORAGE_KEY = 'sx_pending_sync'
const LAST_SYNC_KEY = 'sx_last_sync'

function dispatchSyncEvent(count: number) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('sx_sync_update', { detail: { count } }))
}

function setLastSync(date: Date = new Date()) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LAST_SYNC_KEY, date.toISOString())
}

export function useOfflineSubmission() {
  const firestore = useFirestore()
  const [pendingCount, setPendingCount] = useState(0)

  const updateCount = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const queue: OfflineQueueItem[] = JSON.parse(saved)
        setPendingCount(queue.length)
        dispatchSyncEvent(queue.length)
      } else {
        setPendingCount(0)
        dispatchSyncEvent(0)
      }
    } catch {
      setPendingCount(0)
    }
  }, [])

  useEffect(() => {
    updateCount()

    const handleUpdate = (e: Event) => {
      const ce = e as CustomEvent
      setPendingCount(ce.detail?.count ?? 0)
    }

    window.addEventListener('sx_sync_update', handleUpdate)
    return () => window.removeEventListener('sx_sync_update', handleUpdate)
  }, [updateCount])

  const addToQueue = useCallback((collectionName: string, data: Record<string, unknown>) => {
    const queue: OfflineQueueItem[] = []
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        queue.push(...JSON.parse(saved))
      } catch {}
    }

    const item: OfflineQueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      collection: collectionName,
      data: { ...data, createdAt: new Date().toISOString() },
      timestamp: Date.now(),
      retryCount: 0,
    }
    queue.push(item)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
    updateCount()
  }, [updateCount])

  const syncQueue = useCallback(async () => {
    if (typeof window === 'undefined') return
    if (!navigator.onLine) return
    if (!firestore) return

    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return

    let queue: OfflineQueueItem[] = []
    try {
      queue = JSON.parse(saved)
    } catch {
      return
    }

    if (queue.length === 0) return

    const remaining: OfflineQueueItem[] = []

    for (const item of queue) {
      try {
        await addDoc(collection(firestore, item.collection), {
          ...item.data,
          queuedOffline: true,
          syncedAt: serverTimestamp(),
        })
      } catch {
        if (item.retryCount < 3) {
          remaining.push({ ...item, retryCount: item.retryCount + 1 })
        }
      }
    }

    if (remaining.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }

    if (remaining.length < queue.length) {
      setLastSync()
    }

    updateCount()
  }, [firestore, updateCount])

  return { addToQueue, syncQueue, pendingCount }
}

export function initOfflineSync(syncFn: () => Promise<void>) {
  if (typeof window === 'undefined') return

  const handleOnline = () => {
    setTimeout(() => {
      syncFn()
    }, 2000)
  }

  window.addEventListener('online', handleOnline)

  if (navigator.onLine) {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const queue: OfflineQueueItem[] = JSON.parse(saved)
        if (queue.length > 0) {
          syncFn()
        }
      } catch {}
    }
  }

  return () => window.removeEventListener('online', handleOnline)
}
