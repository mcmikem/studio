"use client";

import { getStorage, ref, uploadBytes, getDownloadURL, type FirebaseStorage } from "firebase/storage";
import { updateProfile, type User } from "firebase/auth";
import { doc, setDoc, type Firestore } from "firebase/firestore";
import type { FirebaseApp } from "firebase/app";
import { buildUploadPath } from "@/lib/upload-paths";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB

/**
 * Uploads a file Blob to a specified path in Firebase Storage.
 * @param app The initialized FirebaseApp instance.
 * @param fileBlob The file blob to upload.
 * @param path The full path in storage, including file name and extension.
 * @returns The public URL of the uploaded file.
 */
export async function uploadFile(
  app: FirebaseApp,
  fileBlob: Blob,
  path: string
): Promise<string> {
  if (!app) {
    throw new Error("Firebase app is not initialized. Please refresh the page and try again.");
  }

  if (!path?.trim()) {
    throw new Error("Upload path is missing. Please try again.");
  }

  if (!fileBlob || fileBlob.size <= 0) {
    throw new Error("Selected file is empty. Please choose a valid file.");
  }

  if (fileBlob.size > MAX_UPLOAD_BYTES) {
    throw new Error("File is too large. Please keep uploads under 25MB.");
  }

  console.log("[Upload] Starting upload to path:", path);
  console.log("[Upload] File size:", fileBlob.size, "bytes");

  let storage: FirebaseStorage;
  try {
    storage = getStorage(app);
    console.log("[Upload] Storage initialized successfully");
  } catch (storageError: any) {
    console.error("[Upload] Failed to initialize storage:", storageError);
    throw new Error("Storage service unavailable. Please check your internet connection and try again.");
  }

  const storageRef = ref(storage, path);

  try {
    console.log("[Upload] Uploading bytes...");
    const snapshot = await uploadBytes(storageRef, fileBlob);
    console.log("[Upload] Upload complete, getting download URL...");

    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("[Upload] Success! URL:", downloadURL.substring(0, 50) + "...");

    return downloadURL;
  } catch (error: any) {
    console.error("[Upload] Firebase Storage upload failed:", error);
    
    // Provide more specific error messages based on the error
    if (error.code === 'storage/unauthorized') {
      throw new Error("Upload not authorized. Please log out and log back in, then try again.");
    }
    if (error.code === 'storage/canceled') {
      throw new Error("Upload was cancelled. Please try again.");
    }
    if (error.code === 'storage/quota-exceeded') {
      throw new Error("Storage quota exceeded. Please contact the administrator.");
    }
    if (error.code === 'storage/invalid-chunk-size' || error.message?.includes('net::ERR_CONNECTION')) {
      throw new Error("Network error. Please check your internet connection and try again.");
    }
    if (error.code === 'storage/object-not-found') {
      throw new Error("Storage bucket not found. Please contact the administrator.");
    }
    
    // Generic fallback
    const errorMessage = error.message || "Unknown error occurred";
    throw new Error(`Upload failed: ${errorMessage}`);
  }
}

/**
 * Uploads an image to Firebase Storage, updates the user's Auth profile,
 * and upserts their Firestore profile document.
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

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large. Please use a file smaller than 5MB.");
  }

  if (!app) {
    throw new Error("Firebase app is not initialized. Please refresh the page and try again.");
  }

  const extensionFromType = file.type.split("/")[1] || "jpg";
  const safeExtension =
    extensionFromType.replace(/[^a-zA-Z0-9]/g, "") || "jpg";

  // Keep centralized upload path helper
  const filePath = buildUploadPath.profilePicture(user.uid, safeExtension);

  const downloadURL = await uploadFile(app, file, filePath);

  await updateProfile(user, { photoURL: downloadURL });

  const userDocRef = doc(firestore, "users", user.uid);
  await setDoc(userDocRef, { photoURL: downloadURL }, { merge: true });

  return downloadURL;
}
