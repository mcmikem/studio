"use client";

import { getStorage, ref, uploadBytes, getDownloadURL, type FirebaseStorage } from "firebase/storage";
import { updateProfile, type User } from "firebase/auth";
import { doc, setDoc, getDoc, type Firestore } from "firebase/firestore";
import type { FirebaseApp } from "firebase/app";
import { buildUploadPath } from "@/lib/upload-paths";

const MAX_IMAGE_BYTES = 500 * 1024; // 500KB for base64 (Firestore limit)
const MAX_FIRESTORE_BYTES = 1024 * 1024; // 1MB hard limit in Firestore

/**
 * Converts a File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image to Firestore as base64 (free, no paid storage needed)
 * Falls back to Firebase Storage if file is too large
 */
export async function uploadImageAsBase64(
  app: FirebaseApp,
  file: File,
  userId: string,
  firestore: Firestore
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported.");
  }

  if (file.size > MAX_FIRESTORE_BYTES) {
    throw new Error(`Image too large. Maximum size is ${MAX_FIRESTORE_BYTES / 1024}KB for direct upload.`);
  }

  console.log("[Base64 Upload] Converting to base64...");
  
  // Convert to base64
  const base64 = await fileToBase64(file);
  console.log("[Base64 Upload] Base64 length:", base64.length);

  // Save to Firestore user document
  const userDocRef = doc(firestore, "users", userId);
  await setDoc(userDocRef, { 
    photoURL: base64,
    photoUpdatedAt: new Date().toISOString()
  }, { merge: true });

  console.log("[Base64 Upload] Saved to Firestore!");
  return base64;
}

/**
 * Uploads a file using Firebase Storage (requires Blaze plan)
 * OR falls back to base64 for small images
 */
export async function uploadFile(
  app: FirebaseApp,
  fileBlob: Blob,
  path: string,
  userId?: string
): Promise<string> {
  // For small images, try base64 first (free)
  if (fileBlob.size <= MAX_IMAGE_BYTES && fileBlob instanceof File) {
    try {
      const firestore = (await import("firebase/firestore")).getFirestore(app);
      const base64Url = await uploadImageAsBase64(app, fileBlob as File, userId!, firestore);
      console.log("[Upload] Used base64 method (free)");
      return base64Url;
    } catch (e) {
      console.warn("[Upload] Base64 failed, trying Storage:", e);
    }
  }

  // Fallback to Firebase Storage (requires Blaze plan)
  try {
    const storage = getStorage(app);
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, fileBlob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("[Upload] Used Firebase Storage");
    return downloadURL;
  } catch (error: any) {
    console.error("[Upload] Storage error:", error?.message);
    throw new Error(`Upload failed: ${error?.message}. Firebase Storage may require a paid plan.`);
  }
}

/**
 * Uploads an image to Firebase Storage with base64 fallback
 */
export async function uploadImageAndUpdateProfile(
  app: FirebaseApp,
  file: File,
  user: User,
  firestore: Firestore
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported.");
  }

  if (file.size > MAX_FIRESTORE_BYTES) {
    throw new Error(`Image is too large. Maximum size is ${MAX_FIRESTORE_BYTES / 1024}KB.`);
  }

  if (!app) {
    throw new Error("Firebase app is not initialized.");
  }

  console.log("[Profile Upload] Starting...");

  // Try base64 first (free, always works)
  try {
    const base64Url = await uploadImageAsBase64(app, file, user.uid, firestore);
    
    // Update auth profile
    await updateProfile(user, { photoURL: base64Url });
    
    console.log("[Profile Upload] Success via base64!");
    return base64Url;
  } catch (error) {
    console.error("[Profile Upload] Base64 failed:", error);
    throw error;
  }
}
