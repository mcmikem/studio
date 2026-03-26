'use client';

import { useState, useCallback } from 'react';
import { useFirebaseApp } from '@/firebase';
import type { UploadResult } from '@/firebase/storage';

export interface UploadOptions {
  folder?: string;
  onProgress?: (progress: number) => void;
  onSuccess?: (url: string, provider: string) => void;
  onError?: (error: string, provider: string) => void;
}

export function useFileUpload(options?: UploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<UploadResult | null>(null);
  const app = useFirebaseApp();

  const upload = useCallback(async (file: File): Promise<string | null> => {
    if (!app) {
      setError('Firebase not initialized');
      return null;
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const { uploadFileWithFallback } = await import('@/firebase/storage');
      const path = `${options?.folder || 'uploads'}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const result = await uploadFileWithFallback(app, file, path);
      
      setLastResult(result);
      
      if (result.success && result.url) {
        setProgress(100);
        options?.onSuccess?.(result.url, result.provider || 'unknown');
        return result.url;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Upload failed';
      setError(errorMsg);
      options?.onError?.(errorMsg, 'all');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [app, options]);

  return {
    upload,
    isUploading,
    progress,
    error,
    lastResult,
  };
}

export function useGoogleSheets() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (type: 'expenses' | 'income' | 'beneficiaries') => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sheets?type=${type}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncData = useCallback(async (type: string, data: Record<string, any>) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sheets?type=${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'append', data }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchData, syncData, isLoading, error };
}

export function useWebhooks() {
  const [isLoading, setIsLoading] = useState(false);

  const trigger = useCallback(async (trigger: string, data: Record<string, any>) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger, data }),
      });
      return await res.json();
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { trigger, isLoading };
}

export function useEmail() {
  const [isSending, setIsSending] = useState(false);

  const send = useCallback(async (
    template: 'expense_approved' | 'expense_rejected' | 'new_expense' | 'income_received' | 'daily_checkin_reminder',
    to: string | string[],
    data: Record<string, any>
  ) => {
    setIsSending(true);
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, to, data }),
      });
      return await res.json();
    } finally {
      setIsSending(false);
    }
  }, []);

  return { send, isSending };
}