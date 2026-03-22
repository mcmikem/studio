"use client"

import { useEffect, useRef } from 'react'
import type { UseFormReturn, FieldValues } from 'react-hook-form'

interface UseAutoSaveOptions<T extends FieldValues> {
  form: UseFormReturn<T>
  draftKey: string
  delay?: number
  enabled?: boolean
}

export function useAutoSave<T extends FieldValues>({ form, draftKey, delay = 2000, enabled = true }: UseAutoSaveOptions<T>) {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const keyRef = useRef(draftKey)
  keyRef.current = draftKey

  const saveDraft = () => {
    if (typeof window === 'undefined') return
    try {
      const values = form.getValues()
      localStorage.setItem(`sx_draft_${keyRef.current}`, JSON.stringify({
        data: values,
        savedAt: Date.now(),
      }))
    } catch {}
  }

  useEffect(() => {
    if (!enabled) return

    const handleSave = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(saveDraft, delay)
    }

    const subscription = form.watch(handleSave)

    return () => {
      subscription.unsubscribe()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [form, delay, enabled])

  return { saveDraft }
}

export function loadDraft<T>(draftKey: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(`sx_draft_${draftKey}`)
    if (!saved) return null
    const { data, savedAt } = JSON.parse(saved)
    if (Date.now() - savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(`sx_draft_${draftKey}`)
      return null
    }
    return data as T
  } catch {
    return null
  }
}

export function clearDraft(draftKey: string) {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`sx_draft_${draftKey}`)
}
