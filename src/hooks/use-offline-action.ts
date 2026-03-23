"use client"

import { useCallback, useEffect, useState } from 'react'

interface QueuedAction {
  id: string
  actionType: string
  data: Record<string, unknown>
  timestamp: number
  retryCount: number
}

const STORAGE_KEY = 'omuto_pending_actions'

function dispatchEvent(count: number) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('omuto_actions_update', { detail: { count } }))
}

export function useOfflineAction() {
  const [pendingCount, setPendingCount] = useState(0)

  const updateCount = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const queue: QueuedAction[] = JSON.parse(saved)
        setPendingCount(queue.length)
        dispatchEvent(queue.length)
      } else {
        setPendingCount(0)
        dispatchEvent(0)
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
    window.addEventListener('omuto_actions_update', handleUpdate)
    return () => window.removeEventListener('omuto_actions_update', handleUpdate)
  }, [updateCount])

  const queueAction = useCallback((actionType: string, data: Record<string, unknown>) => {
    const queue: QueuedAction[] = []
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try { queue.push(...JSON.parse(saved)) } catch {}
    }

    const item: QueuedAction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      actionType,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    }
    queue.push(item)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
    updateCount()
  }, [updateCount])

  const getQueuedActions = useCallback((): QueuedAction[] => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  }, [])

  const removeAction = useCallback((id: string) => {
    const queue = getQueuedActions().filter(a => a.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
    updateCount()
  }, [getQueuedActions, updateCount])

  const clearActions = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    updateCount()
  }, [updateCount])

  return { queueAction, getQueuedActions, removeAction, clearActions, pendingCount, updateCount }
}
