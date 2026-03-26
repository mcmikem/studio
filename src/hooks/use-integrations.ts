'use client';

import { useState, useCallback } from 'react';
import type { UploadResult } from '@/firebase/storage';

interface UseUploadOptions {
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: string) => void;
}

interface UseUploadReturn {
  upload: (file: File, path?: string) => Promise<UploadResult | null>;
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export function useUploadWithFallback(options?: UseUploadOptions): UseUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File, path?: string): Promise<UploadResult | null> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      setProgress(20);
      
      const formData = new FormData();
      formData.append('file', file);
      if (path) formData.append('folder', path);

      // Try GCS first (via Firebase Admin)
      const response = await fetch('/api/upload/gcs-signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          folder: path || 'uploads',
          userId: 'current-user',
        }),
      });

      setProgress(50);

      if (response.ok) {
        const data = await response.json();
        if (data.uploadUrl) {
          // Upload directly to GCS
          await fetch(data.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
          });
          
          setProgress(100);
          const result: UploadResult = {
            success: true,
            url: data.downloadUrl,
            provider: 'firebase',
            filePath: data.filePath,
          };
          options?.onSuccess?.(result);
          setIsUploading(false);
          return result;
        }
      }

      // Fallback: Google Drive
      const gcsResponse = await fetch('/api/upload/google-drive', {
        method: 'POST',
        body: formData,
      });

      setProgress(70);

      if (gcsResponse.ok) {
        const gcsData = await gcsResponse.json();
        const result: UploadResult = {
          success: true,
          url: gcsData.url,
          provider: 'google-drive',
          filePath: gcsData.path,
        };
        options?.onSuccess?.(result);
        setIsUploading(false);
        return result;
      }

      // Fallback: GitHub
      const base64 = await fileToBase64(file);
      const githubResponse = await fetch('/api/upload/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          content: base64,
          folder: path || 'uploads',
        }),
      });

      setProgress(90);

      if (githubResponse.ok) {
        const githubData = await githubResponse.json();
        const result: UploadResult = {
          success: true,
          url: githubData.url,
          provider: 'github',
          filePath: githubData.path,
        };
        options?.onSuccess?.(result);
        setIsUploading(false);
        return result;
      }

      throw new Error('All upload providers failed');
    } catch (err: any) {
      const errorMsg = err.message || 'Upload failed';
      setError(errorMsg);
      options?.onError?.(errorMsg);
      setIsUploading(false);
      return null;
    }
  }, [options]);

  return { upload, isUploading, progress, error };
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useGoogleSheets() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (type: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/sheets?type=${type}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncData = useCallback(async (type: string, data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/sheets?type=${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'append', data }),
      });
      const result = await response.json();
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

  const trigger = useCallback(async (trigger: string, data: any, webhookId?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger, data, webhookId }),
      });
      return await response.json();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getWebhooks = useCallback(async () => {
    const response = await fetch('/api/webhooks');
    return await response.json();
  }, []);

  return { trigger, getWebhooks, isLoading };
}

export function useEmail() {
  const [isSending, setIsSending] = useState(false);

  const send = useCallback(async (template: string, to: string | string[], data: any) => {
    setIsSending(true);
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, to, data }),
      });
      return await response.json();
    } finally {
      setIsSending(false);
    }
  }, []);

  return { send, isSending };
}