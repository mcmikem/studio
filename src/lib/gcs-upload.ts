/**
 * GCS Upload Utility using Signed URLs
 * OPTIONAL: This is an enhancement when Firebase Storage is not available
 * This requires a service account with Storage permissions to be configured
 */

import { classifyUploadError, isGcsResponseError, type UploadTelemetry } from './upload-errors';

const API_UPLOAD_URL = '/api/upload/gcs-signed-url';

export interface UploadResult {
  success: boolean;
  url?: string;
  filePath?: string;
  error?: string;
  telemetry?: UploadTelemetry;
}

/**
 * Check if GCS upload is available
 */
export async function isGCSEnabled(): Promise<boolean> {
  try {
    const response = await fetch('/api/upload/gcs-signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        fileName: 'test.txt', 
        fileType: 'text/plain', 
        folder: 'test', 
        userId: 'test' 
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Upload a file to Google Cloud Storage using signed URLs
 * NOTE: This requires the SERVICE_ACCOUNT environment variable to be set
 */
export async function uploadToGCS(
  file: File,
  folder: string,
  userId: string
): Promise<UploadResult> {
  try {
    console.log('[GCS Upload] Starting upload for:', file.name, 'to folder:', folder);

    // 1. Get signed URL from our API
    const response = await fetch(API_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        folder,
        userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to get upload URL' }));
      const telemetry = isGcsResponseError(response, errorData) || classifyUploadError(new Error(errorData.error));
      console.error('[GCS Upload] Failed to get signed URL:', telemetry.kind, telemetry.message);
      return { success: false, error: telemetry.userMessage, telemetry };
    }

    const data = await response.json().catch(() => ({}));
    const { uploadUrl, downloadUrl, filePath } = data;

    if (!uploadUrl) {
      console.error('[GCS Upload] No upload URL received');
      return { success: false, error: 'GCS not configured. Please enable Firebase Storage.' };
    }

    console.log('[GCS Upload] Got signed URL, uploading...');

    // 2. Upload the file directly to GCS
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      const telemetry = isGcsResponseError(uploadResponse) || classifyUploadError(new Error(uploadResponse.statusText));
      console.error('[GCS Upload] Upload failed:', telemetry.kind);
      return { success: false, error: telemetry.userMessage, telemetry };
    }

    console.log('[GCS Upload] Success!');
    return {
      success: true,
      url: downloadUrl,
      filePath,
    };
  } catch (error: any) {
    const telemetry = classifyUploadError(error);
    console.error('[GCS Upload] Error:', telemetry.kind, telemetry.message);
    return { success: false, error: telemetry.userMessage, telemetry };
  }
}

/**
 * Upload an image specifically
 */
export async function uploadImageToGCS(
  file: File,
  folder: string,
  userId: string
): Promise<UploadResult> {
  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'Only image files are allowed' };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'Image must be smaller than 5MB' };
  }

  return uploadToGCS(file, folder, userId);
}

/**
 * Upload a video specifically
 */
export async function uploadVideoToGCS(
  file: File,
  folder: string,
  userId: string
): Promise<UploadResult> {
  if (!file.type.startsWith('video/')) {
    return { success: false, error: 'Only video files are allowed' };
  }

  if (file.size > 50 * 1024 * 1024) {
    return { success: false, error: 'Video must be smaller than 50MB' };
  }

  return uploadToGCS(file, folder, userId);
}
