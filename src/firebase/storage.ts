"use client";

import { getStorage, ref, uploadBytes, getDownloadURL, type FirebaseStorage } from "firebase/storage";
import { updateProfile, type User } from "firebase/auth";
import { doc, setDoc, getDoc, collection, addDoc, Firestore } from "firebase/firestore";
import type { FirebaseApp } from "firebase/app";
import { buildUploadPath } from "@/lib/upload-paths";
import { compressImage, fileToBase64 } from "@/lib/image-utils";

const MAX_IMAGE_BYTES = 500 * 1024;       // 500KB — threshold for base64 path
const MAX_FIRESTORE_BYTES = 1024 * 1024;   // 1MB — max for Firestore doc
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;  // 5MB — hard limit for any upload
const COMPRESS_MAX_KB = 300;               // Target compression size

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * Validate and compress an image file before upload.
 * Returns the compressed file ready for upload.
 */
async function prepareImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported. Please select a JPG, PNG, or WebP image.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `This image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please use an image smaller than 5MB.`
    );
  }

  // Always compress images to save bandwidth and storage
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
  console.log("[Base64 Upload] Base64 length:", base64.length);

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
  await setDoc(userDocRef, { 
    photoURL: `base64:${imageId}`,
    photoUpdatedAt: new Date().toISOString()
  }, { merge: true });

  console.log("[Base64 Upload] Saved to Firestore images collection!");
  return base64;
}

export async function getBase64Image(imageRef: string, firestore: Firestore): Promise<string | null> {
  if (!imageRef.startsWith("base64:")) {
    return imageRef;
  }

  const imageId = imageRef.replace("base64:", "");
  
  const imagesRef = collection(firestore, "images");
  const q = doc(imagesRef, imageId);
  
  try {
    const snapshot = await getDoc(q);
    if (snapshot.exists()) {
      return snapshot.data().data;
    }
  } catch (e) {
    console.error("Error fetching base64 image:", e);
  }
  
  return null;
}

export async function uploadFile(
  app: FirebaseApp,
  fileBlob: Blob,
  path: string,
  userId?: string
): Promise<string> {
  // Pre-validate file size
  if (fileBlob.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `This file is too large (${(fileBlob.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed size is 5MB.`
    );
  }

  // Auto-compress images before upload
  let processedBlob = fileBlob;
  if (fileBlob instanceof File && fileBlob.type.startsWith("image/")) {
    processedBlob = await prepareImageForUpload(fileBlob);
  }

  // Try base64 for small images (free tier friendly)
  if (processedBlob.size <= MAX_IMAGE_BYTES && processedBlob instanceof File) {
    try {
      const { getFirestore } = await import("firebase/firestore");
      const firestore = getFirestore(app);
      const base64Url = await uploadImageAsBase64(app, processedBlob as File, userId!, firestore);
      console.log("[Upload] Used base64 method (free)");
      return base64Url;
    } catch (e) {
      console.warn("[Upload] Base64 failed, trying Storage:", e);
    }
  }

  // Fall back to Firebase Storage
  try {
    const storage = getStorage(app);
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, processedBlob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("[Upload] Used Firebase Storage");
    return downloadURL;
  } catch (error: any) {
    console.error("[Upload] Storage error:", error?.message);
    
    // User-friendly error messages
    if (error?.code === 'storage/unauthorized') {
      throw new Error("You don't have permission to upload files. Please check your login status.");
    }
    if (error?.code === 'storage/canceled') {
      throw new Error("Upload was cancelled. Please try again.");
    }
    if (error?.code === 'storage/unknown' || error?.message?.includes('billing')) {
      throw new Error("File storage is temporarily unavailable. Your image was too large for the free method. Please try a smaller image or contact support.");
    }
    throw new Error("Upload failed. Please check your internet connection and try again.");
  }
}

export async function uploadImageAndUpdateProfile(
  app: FirebaseApp,
  file: File,
  user: User,
  firestore: Firestore
): Promise<string> {
  // Validate using shared function
  await prepareImageForUpload(file); // validates type + size

  if (!app) {
    throw new Error("App is not ready. Please wait a moment and try again.");
  }

  console.log("[Profile Upload] Starting...");

  try {
    const base64Url = await uploadImageAsBase64(app, file, user.uid, firestore);
    
    // FIX: Store the reference ID in Auth photoURL, NOT the raw base64 string.
    // Firebase Auth photoURL has a ~20KB limit. We store the reference pointer.
    // The actual base64 data is in the Firestore "images" collection.
    // The user doc already has the `base64:imageId` reference from uploadImageAsBase64.
    // We set Auth photoURL to a short placeholder to signal "has custom photo".
    await updateProfile(user, { photoURL: `base64:${user.uid}` });
    
    console.log("[Profile Upload] Success! Stored reference in Auth, data in Firestore.");
    return base64Url;
  } catch (error: any) {
    console.error("[Profile Upload] Failed:", error);
    throw new Error(error?.message || "Could not update your profile picture. Please try a smaller image.");
  }
}
