"use client";

import { useEffect, useCallback, useRef, useState } from "react";

interface UseAutosaveOptions {
  /** Storage key for localStorage */
  storageKey: string;
  /** Debounce delay in ms (default: 2000) */
  debounceMs?: number;
  /** Callback when data is saved */
  onSave?: (data: any) => void;
  /** Whether autosave is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Hook to persist form data to localStorage for recovery.
 * Useful for long forms where users might lose data.
 */
export function useAutosave<T = any>({
  storageKey,
  debounceMs = 2000,
  onSave,
  enabled = true,
}: UseAutosaveOptions) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef<T | null>(null);

  // Load saved data on mount
  useEffect(() => {
    if (!enabled) return;
    
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        dataRef.current = JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to load autosaved data:", e);
    }
  }, [storageKey, enabled]);

  /** Save data to localStorage */
  const saveData = useCallback(
    (data: T) => {
      if (!enabled) return;

      setIsSaving(true);
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
        dataRef.current = data;
        setLastSaved(new Date());
        onSave?.(data);
      } catch (e) {
        console.warn("Failed to autosave data:", e);
      } finally {
        setIsSaving(false);
      }
    },
    [storageKey, onSave, enabled]
  );

  /** Debounced save function */
  const debouncedSave = useCallback(
    (data: T) => {
      if (!enabled) return;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        saveData(data);
      }, debounceMs);
    },
    [debounceMs, saveData, enabled]
  );

  /** Clear saved data (after successful submission) */
  const clearSaved = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      dataRef.current = null;
    } catch (e) {
      console.warn("Failed to clear autosaved data:", e);
    }
  }, [storageKey]);

  /** Get the last saved data */
  const getSavedData = useCallback((): T | null => {
    return dataRef.current;
  }, []);

  /** Check if there's saved data */
  const hasSavedData = useCallback((): boolean => {
    try {
      return localStorage.getItem(storageKey) !== null;
    } catch {
      return false;
    }
  }, [storageKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    saveData,
    debouncedSave,
    clearSaved,
    getSavedData,
    hasSavedData,
    lastSaved,
    isSaving,
  };
}