'use client';

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, type User } from 'firebase/auth';
import { doc, setDoc, type Firestore } from 'firebase/firestore';
import type { FirebaseApp } from 'firebase/app';
import { buildUploadPath } from '@/lib/upload-paths';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

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
    throw new Error('Firebase app is not initialized. Cannot upload file.');
  }
  const storage = getStorage(app);
  const storageRef = ref(storage, path);

  try {
    const snapshot = await uploadBytes(storageRef, fileBlob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Firebase Storage upload failed:', error);
    throw new Error('File upload failed. Please try again.');
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
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are supported.');
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image is too large. Please use a file smaller than 5MB.');
  }

  if (!app) {
    throw new Error('Firebase app is not initialized. Cannot upload file.');
  }

  const extensionFromType = file.type.split('/')[1] || 'jpg';
  const safeExtension = extensionFromType.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
  const filePath = buildUploadPath.profilePicture(user.uid, safeExtension);
  const downloadURL = await uploadFile(app, file, filePath);

  await updateProfile(user, { photoURL: downloadURL });

  const userDocRef = doc(firestore, 'users', user.uid);
  await setDoc(userDocRef, { photoURL: downloadURL }, { merge: true });

  return downloadURL;
}
