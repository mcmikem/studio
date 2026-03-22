"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { useFirestore } from '@/firebase'
import { useOfflineSubmission } from './use-offline-submission'
import { useCurrentUser } from './use-current-user'

const LAST_SYNC_KEY = 'sx_last_sync'
const DRAFT_PREFIX = 'sx_draft_'

interface SubmitOptions {
  collectionName: string
  data: Record<string, unknown>
  idempotencyKey?: string
  draftKey?: string
}

interface SubmitResult {
  isOffline: boolean
  isQueued: boolean
  error: string | null
  docId?: string
}

function getLastSync(): Date | null {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem(LAST_SYNC_KEY)
  if (!saved) return null
  return new Date(saved)
}

function setLastSync(date: Date = new Date()) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LAST_SYNC_KEY, date.toISOString())
}

export function useLastSync() {
  const [lastSync, setLastSyncState] = useState<Date | null>(null)

  useEffect(() => {
    setLastSyncState(getLastSync())

    const handleUpdate = () => setLastSyncState(getLastSync())
    window.addEventListener('sx_sync_update', handleUpdate)
    return () => window.removeEventListener('sx_sync_update', handleUpdate)
  }, [])

  return lastSync
}

export function useFormSubmission(options?: { draftKey?: string }) {
  const firestore = useFirestore()
  const { uid, displayName, isAuthenticated } = useCurrentUser()
  const { addToQueue } = useOfflineSubmission()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const draftKey = options?.draftKey

  const clearDraft = useCallback((key: string) => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(`${DRAFT_PREFIX}${key}`)
  }, [])

  const saveDraft = useCallback((key: string, data: Record<string, unknown>) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(`${DRAFT_PREFIX}${key}`, JSON.stringify({
        data,
        savedAt: Date.now(),
      }))
    } catch {}
  }, [])

  const loadDraft = useCallback(<T,>(key: string): T | null => {
    if (typeof window === 'undefined') return null
    try {
      const saved = localStorage.getItem(`${DRAFT_PREFIX}${key}`)
      if (!saved) return null
      const { data, savedAt } = JSON.parse(saved)
      const age = Date.now() - savedAt
      if (age > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(`${DRAFT_PREFIX}${key}`)
        return null
      }
      return data as T
    } catch {
      return null
    }
  }, [])

  const submit = useCallback(async (opts: SubmitOptions): Promise<SubmitResult> => {
    setIsSubmitting(true)
    const { collectionName, data, idempotencyKey, draftKey: formDraftKey } = opts

    const createdBy = isAuthenticated && uid
      ? uid
      : displayName || 'anonymous'

    const enrichedData = {
      ...data,
      createdBy: createdBy,
      _submittedBy: displayName || undefined,
      _userId: uid || undefined,
      _idempotencyKey: idempotencyKey || undefined,
    }

    if (draftKey) clearDraft(draftKey)
    if (formDraftKey) clearDraft(formDraftKey)

    if (!navigator.onLine) {
      addToQueue(collectionName, enrichedData)
      setIsSubmitting(false)
      return { isOffline: true, isQueued: true, error: null }
    }

    if (!firestore) {
      addToQueue(collectionName, enrichedData)
      setIsSubmitting(false)
      return { isOffline: false, isQueued: true, error: 'Database unavailable' }
    }

    try {
      if (idempotencyKey) {
        const existingQuery = doc(firestore, collectionName, idempotencyKey)
        const existing = await getDoc(existingQuery)
        if (existing.exists()) {
          setIsSubmitting(false)
          return { isOffline: false, isQueued: false, error: null, docId: existing.id }
        }
        const docRef = await addDoc(collection(firestore, collectionName), {
          ...enrichedData,
          _idempotencyKey: idempotencyKey,
          createdAt: serverTimestamp(),
        })
        setLastSync()
        setIsSubmitting(false)
        return { isOffline: false, isQueued: false, error: null, docId: docRef.id }
      }

      const docRef = await addDoc(collection(firestore, collectionName), {
        ...enrichedData,
        createdAt: serverTimestamp(),
      })
      setLastSync()
      setIsSubmitting(false)
      return { isOffline: false, isQueued: false, error: null, docId: docRef.id }
    } catch {
      addToQueue(collectionName, enrichedData)
      setIsSubmitting(false)
      return { isOffline: false, isQueued: true, error: 'Submission failed — queued for sync' }
    }
  }, [firestore, uid, displayName, isAuthenticated, addToQueue, clearDraft])

  return {
    submit,
    isSubmitting,
    saveDraft,
    loadDraft,
    clearDraft,
  }
}
