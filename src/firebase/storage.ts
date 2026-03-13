"use client";

import { getStorage, ref, uploadBytes, getDownloadURL, type FirebaseStorage } from "firebase/storage";
import { updateProfile, type User } from "firebase/auth";
import { doc, setDoc, type Firestore } from "firebase/firestore";
import type { FirebaseApp } from "firebase/app";
import { buildUploadPath } from "@/lib/upload-paths";
import { uploadToGCS } from "@/lib/gcs-upload";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB

/**
 * Uploads a file Blob to a specified path in Firebase Storage.
 * Falls back to GCS signed URLs if Firebase Storage fails.
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

  // Try Firebase Storage first
  try {
    const storage = getStorage(app);
    const storageRef = ref(storage, path);

    console.log("[Upload] Trying Firebase Storage...");
    const snapshot = await uploadBytes(storageRef, fileBlob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("[Upload] Firebase Storage success!");
    return downloadURL;
  } catch (firebaseError: any) {
    console.warn("[Upload] Firebase Storage failed, trying GCS fallback:", firebaseError?.message || firebaseError);
    
    // Fallback to GCS signed URLs
    if (userId) {
      try {
        console.log("[Upload] Trying GCS fallback...");
        const folder = path.split('/')[0];
        const fileName = path.split('/').pop() || 'file';
        
        // Convert Blob to File if needed
        const file = fileBlob instanceof File ? fileBlob : new File([fileBlob], fileName);
        
        const result = await uploadToGCS(file, folder, userId);
        
        if (result.success && result.url) {
          console.log("[Upload] GCS fallback success!");
          return result.url;
        }
        
        throw new Error(result.error || 'GCS upload failed');
      } catch (gcsError: any) {
        console.error("[Upload] GCS fallback also failed:", gcsError);
        throw new Error(`Upload failed: ${gcsError?.message || 'Unknown error'}`);
      }
    }
    
    // No userId for fallback
    throw new Error(`Upload failed: ${firebaseError?.message || 'Firebase Storage unavailable'}`);
  }
}

/**
 * Uploads an image to Firebase Storage with GCS fallback
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

  const downloadURL = await uploadFile(app, file, filePath, user.uid);

  await updateProfile(user, { photoURL: downloadURL });

  const userDocRef = doc(firestore, "users", user.uid);
  await setDoc(userDocRef, { photoURL: downloadURL }, { merge: true });

  return downloadURL;
}
