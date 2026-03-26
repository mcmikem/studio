'use client';

import { getStorage, ref, uploadBytes, getDownloadURL, type FirebaseStorage } from "firebase/storage";
import { updateProfile, type User } from "firebase/auth";
import { doc, setDoc, getDoc, collection, addDoc, Firestore } from "firebase/firestore";
import type { FirebaseApp } from "firebase/app";
import { buildUploadPath } from "@/lib/upload-paths";
import { compressImage, fileToBase64 } from "@/lib/image-utils";
import { classifyUploadError, throwUploadError, isGcsResponseError } from "@/lib/upload-errors";

const MAX_IMAGE_BYTES = 500 * 1024;
const MAX_FIRESTORE_BYTES = 1024 * 1024;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const COMPRESS_MAX_KB = 300;

export type UploadProvider = 'firebase' | 'google-drive' | 'github' | 'base64';
export interface UploadResult {
  success: boolean;
  url?: string;
  provider?: UploadProvider;
  error?: string;
  filePath?: string;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

async function prepareImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported. Please select a JPG, PNG, or WebP image.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`This image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please use an image smaller than 5MB.`);
  }
  console.log("[Upload] Compressing:", file.name, "Original size:", (file.size / 1024).toFixed(0) + "KB");
  const compressed = await compressImage(file, COMPRESS_MAX_KB);
  console.log("[Upload] Compressed to:", (compressed.size / 1024).toFixed(0) + "KB");
  return compressed;
}

export async function uploadImageAsBase64(
  app: FirebaseApp,
  file: File,
  userId: string,
  firestore: Firestore
): Promise<string> {
  const compressed = await prepareImageForUpload(file);
  const base64 = await fileToBase64(compressed);
  const imageId = generateId();
  
  const imagesRef = collection(firestore, "images");
  await addDoc(imagesRef, {
    _id: imageId,
    userId: userId,
    data: base64,
    contentType: compressed.type,
    createdAt: new Date().toISOString()
  });

  const userDocRef = doc(firestore, "users", userId);
  await setDoc(userDocRef, { photoURL: `base64:${imageId}`, photoUpdatedAt: new Date().toISOString() }, { merge: true });

  console.log("[Base64 Upload] Saved to Firestore images collection!");
  return base64;
}

export async function getBase64Image(imageRef: string, firestore: Firestore): Promise<string | null> {
  if (!imageRef.startsWith("base64:")) return imageRef;
  const imageId = imageRef.replace("base64:", "");
  const imagesRef = collection(firestore, "images");
  const q = doc(imagesRef, imageId);
  try {
    const snapshot = await getDoc(q);
    if (snapshot.exists()) return snapshot.data().data;
  } catch (e) { console.error("Error fetching base64 image:", e); }
  return null;
}

async function uploadToGoogleDrive(file: File, folder?: string): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);
    
    const response = await fetch('/api/upload/google-drive', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) throw new Error('Google Drive upload failed');
    const data = await response.json();
    return { success: true, url: data.url, provider: 'google-drive', filePath: data.path };
  } catch (error: any) {
    console.error('[Google Drive] Upload failed:', error);
    return { success: false, error: error.message };
  }
}

async function uploadToGitHub(file: File, repo?: string): Promise<UploadResult> {
  try {
    const response = await fetch('/api/upload/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, content: await fileToBase64(file) }),
    });
    
    if (!response.ok) throw new Error('GitHub upload failed');
    const data = await response.json();
    return { success: true, url: data.url, provider: 'github', filePath: data.path };
  } catch (error: any) {
    console.error('[GitHub] Upload failed:', error);
    return { success: false, error: error.message };
  }
}

async function uploadToFirebase(app: FirebaseApp, fileBlob: Blob, path: string): Promise<UploadResult> {
  try {
    const storage = getStorage(app);
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, fileBlob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return { success: true, url: downloadURL, provider: 'firebase', filePath: path };
  } catch (error: any) {
    console.error('[Firebase] Upload failed:', error);
    return { success: false, error: error.message };
  }
}

async function uploadToFirestoreBase64(app: FirebaseApp, file: File, userId: string): Promise<UploadResult> {
  try {
    const firestore = await import("firebase/firestore").then(m => m.getFirestore(app));
    const base64Url = await uploadImageAsBase64(app, file, userId, firestore);
    return { success: true, url: base64Url, provider: 'base64', filePath: `base64/${userId}` };
  } catch (error: any) {
    console.error('[Firestore Base64] Upload failed:', error);
    return { success: false, error: error.message };
  }
}

export async function uploadFileWithFallback(
  app: FirebaseApp,
  fileBlob: Blob,
  path: string,
  userId?: string
): Promise<UploadResult> {
  const isImage = fileBlob instanceof File && fileBlob.type.startsWith("image/");
  
  if (isImage && fileBlob.size > MAX_IMAGE_BYTES) {
    fileBlob = await prepareImageForUpload(fileBlob as File);
  }

  console.log('[Upload] Starting upload with fallback chain...');

  // 1. Try Firebase Storage first
  try {
    const result = await uploadToFirebase(app, fileBlob, path);
    if (result.success) {
      console.log('[Upload] ✓ Firebase succeeded');
      return result;
    }
    console.log('[Upload] Firebase failed, trying next provider...');
  } catch (e) { console.log('[Upload] Firebase error:', e); }

  // 2. Try Google Drive
  if (isImage) {
    try {
      const result = await uploadToGoogleDrive(fileBlob as File, path.split('/')[0]);
      if (result.success) {
        console.log('[Upload] ✓ Google Drive succeeded');
        return result;
      }
      console.log('[Upload] Google Drive failed, trying next provider...');
    } catch (e) { console.log('[Upload] Google Drive error:', e); }
  }

  // 3. Try GitHub (for any file type)
  try {
    const result = await uploadToGitHub(fileBlob as File);
    if (result.success) {
      console.log('[Upload] ✓ GitHub succeeded');
      return result;
    }
    console.log('[Upload] GitHub failed, trying last resort...');
  } catch (e) { console.log('[Upload] GitHub error:', e); }

  // 4. Fallback: Base64 in Firestore (only for small images)
  if (isImage && fileBlob.size <= MAX_FIRESTORE_BYTES && userId) {
    try {
      const result = await uploadToFirestoreBase64(app, fileBlob as File, userId);
      if (result.success) {
        console.log('[Upload] ✓ Base64 fallback succeeded');
        return result;
      }
    } catch (e) { console.log('[Upload] Base64 error:', e); }
  }

  return { success: false, error: 'All upload providers failed. Please try a smaller file.' };
}

export async function uploadFile(
  app: FirebaseApp,
  fileBlob: Blob,
  path: string,
  userId?: string
): Promise<string> {
  if (fileBlob.size > MAX_UPLOAD_BYTES) {
    throw new Error(`This file is too large (${(fileBlob.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed size is 5MB.`);
  }

  let processedBlob = fileBlob;
  if (fileBlob instanceof File && fileBlob.type.startsWith("image/")) {
    processedBlob = await prepareImageForUpload(fileBlob);
  }

  if (processedBlob.size <= MAX_IMAGE_BYTES && processedBlob instanceof File && userId) {
    try {
      const { getFirestore } = await import("firebase/firestore");
      const firestore = getFirestore(app);
      const base64Url = await uploadImageAsBase64(app, processedBlob as File, userId!, firestore);
      console.log("[Upload] Used base64 method (free)");
      return base64Url;
    } catch (e) {
      console.warn("[Upload] Base64 failed, trying Firebase:", e);
    }
  }

  try {
    const storage = getStorage(app);
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, processedBlob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("[Upload] Used Firebase Storage");
    return downloadURL;
  } catch (error: any) {
    if (error?.message && (error.message.includes('HEIC') || error.message.includes('supported') || error.message.includes('too large'))) {
      throw error;
    }
    throwUploadError(error, { fileName: fileBlob instanceof File ? fileBlob.name : undefined, fileSize: fileBlob.size, path, userId });
  }
}

export async function uploadImageAndUpdateProfile(
  app: FirebaseApp,
  file: File,
  user: User,
  firestore: Firestore
): Promise<string> {
  await prepareImageForUpload(file);
  if (!app) throw new Error("App is not ready. Please wait a moment and try again.");
  console.log("[Profile Upload] Starting...");
  try {
    const base64Url = await uploadImageAsBase64(app, file, user.uid, firestore);
    await updateProfile(user, { photoURL: `base64:${user.uid}` });
    console.log("[Profile Upload] Success!");
    return base64Url;
  } catch (error: any) {
    console.error("[Profile Upload] Failed:", error);
    throw new Error(error?.message || "Could not update your profile picture.");
  }
}