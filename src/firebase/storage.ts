"use client";

import { getStorage, ref, uploadBytes, getDownloadURL, type FirebaseStorage } from "firebase/storage";
import { updateProfile, type User } from "firebase/auth";
import { doc, setDoc, getDoc, collection, addDoc, Firestore } from "firebase/firestore";
import type { FirebaseApp } from "firebase/app";
import { buildUploadPath } from "@/lib/upload-paths";
import { compressImage, fileToBase64 } from "@/lib/image-utils";

const MAX_IMAGE_BYTES = 500 * 1024;
const MAX_FIRESTORE_BYTES = 1024 * 1024;
const COMPRESS_MAX_KB = 300;

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export async function uploadImageAsBase64(
  app: FirebaseApp,
  file: File,
  userId: string,
  firestore: Firestore
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported.");
  }

  console.log("[Base64 Upload] Compressing image first...");
  
  const compressedFile = await compressImage(file, COMPRESS_MAX_KB);
  console.log("[Base64 Upload] Original:", file.size, "Compressed:", compressedFile.size);

  const base64 = await fileToBase64(compressedFile);
  console.log("[Base64 Upload] Base64 length:", base64.length);

  const imageId = generateId();
  
  const imagesRef = collection(firestore, "images");
  await addDoc(imagesRef, {
    _id: imageId,
    userId: userId,
    data: base64,
    contentType: file.type,
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
  if (fileBlob.size <= MAX_IMAGE_BYTES && fileBlob instanceof File) {
    try {
      const { getFirestore } = await import("firebase/firestore");
      const firestore = getFirestore(app);
      const base64Url = await uploadImageAsBase64(app, fileBlob as File, userId!, firestore);
      console.log("[Upload] Used base64 method (free)");
      return base64Url;
    } catch (e) {
      console.warn("[Upload] Base64 failed, trying Storage:", e);
    }
  }

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

  try {
    const base64Url = await uploadImageAsBase64(app, file, user.uid, firestore);
    
    await updateProfile(user, { photoURL: base64Url });
    
    console.log("[Profile Upload] Success via base64!");
    return base64Url;
  } catch (error) {
    console.error("[Profile Upload] Base64 failed:", error);
    throw error;
  }
}
