"use client";

import { getStorage, ref, uploadBytes, getDownloadURL, type FirebaseStorage } from "firebase/storage";
import { updateProfile, type User } from "firebase/auth";
import { doc, setDoc, type Firestore } from "firebase/firestore";
import type { FirebaseApp } from "firebase/app";
import { buildUploadPath } from "@/lib/upload-paths";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB

/**
 * Uploads a file using Firebase Storage.
 * This is the primary upload method.
 */
export async function uploadFile(
  app: FirebaseApp,
  fileBlob: Blob,
  path: string,
  userId?: string
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

  // Try Firebase Storage
  try {
    const storage = getStorage(app);
    const storageRef = ref(storage, path);

    console.log("[Upload] Uploading to Firebase Storage...");
    const snapshot = await uploadBytes(storageRef, fileBlob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("[Upload] Firebase Storage success!");
    return downloadURL;
  } catch (firebaseError: any) {
    console.error("[Upload] Firebase Storage error:", firebaseError?.message || firebaseError);
    
    // Provide specific error messages based on the error
    if (firebaseError?.code === 'storage/unauthorized') {
      throw new Error("Upload not authorized. Please log out and log back in, then try again.");
    }
    if (firebaseError?.code === 'storage/canceled') {
      throw new Error("Upload was cancelled. Please try again.");
    }
    if (firebaseError?.code === 'storage/quota-exceeded') {
      throw new Error("Storage quota exceeded. Please contact the administrator.");
    }
    if (firebaseError?.code === 'storage/object-not-found') {
      throw new Error("Storage bucket not found. Please contact the administrator to enable Firebase Storage.");
    }
    
    // Generic error - suggest enabling Firebase Storage
    const errorMsg = firebaseError?.message || 'Unknown error';
    throw new Error(`Upload failed: ${errorMsg}. Please ensure Firebase Storage is enabled in the Firebase Console.`);
  }
}

/**
 * Uploads an image to Firebase Storage and updates the user's profile
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
  const safeExtension = extensionFromType.replace(/[^a-zA-Z0-9]/g, "") || "jpg";

  const filePath = buildUploadPath.profilePicture(user.uid, safeExtension);

  console.log("[Profile Upload] Starting upload...");
  
  const downloadURL = await uploadFile(app, file, filePath, user.uid);

  console.log("[Profile Upload] Updating profile...");
  
  // Update Firebase Auth profile
  await updateProfile(user, { photoURL: downloadURL });

  // Update Firestore user document
  const userDocRef = doc(firestore, "users", user.uid);
  await setDoc(userDocRef, { photoURL: downloadURL }, { merge: true });

  console.log("[Profile Upload] Success!");
  return downloadURL;
}
