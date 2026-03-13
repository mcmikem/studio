/**
 * GCS Upload Utility using Signed URLs
 * This provides a fallback when Firebase Storage fails
 */

const API_UPLOAD_URL = '/api/upload/gcs-signed-url';

export interface UploadResult {
  success: boolean;
  url?: string;
  filePath?: string;
  error?: string;
}

/**
 * Upload a file to Google Cloud Storage using signed URLs
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
      const errorData = await response.json();
      console.error('[GCS Upload] Failed to get signed URL:', errorData);
      return { success: false, error: errorData.error || 'Failed to get upload URL' };
    }

    const { uploadUrl, downloadUrl, filePath } = await response.json();
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
      console.error('[GCS Upload] Upload failed:', uploadResponse.statusText);
      return { success: false, error: 'Upload to storage failed' };
    }

    console.log('[GCS Upload] Success! URL:', downloadUrl);
    return {
      success: true,
      url: downloadUrl,
      filePath,
    };
  } catch (error: any) {
    console.error('[GCS Upload] Error:', error);
    return { success: false, error: error.message || 'Upload failed' };
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
