
'use client';

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, type User } from 'firebase/auth';
import { doc, updateDoc, type Firestore } from 'firebase/firestore';
import type { FirebaseApp } from 'firebase/app';

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
    throw new Error("Firebase app is not initialized. Cannot upload file.");
  }
  const storage = getStorage(app);
  const storageRef = ref(storage, path);

  try {
    const snapshot = await uploadBytes(storageRef, fileBlob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
      console.error("Firebase Storage upload failed:", error);
      // Re-throw the error so the calling function can handle it.
      throw new Error("File upload failed. Please try again.");
  }
}


/**
 * Uploads an image to Firebase Storage, updates the user's Auth profile,
 * and updates their Firestore profile document.
 * @param app The initialized FirebaseApp instance.
 * @param file The image file to upload.
 * @param user The current Firebase Auth user object.
 * @param firestore A Firestore instance.
 * @returns The public URL of the uploaded image.
 */
export async function uploadImageAndUpdateProfile(
  app: FirebaseApp,
  file: File,
  user: User,
  firestore: Firestore
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File is not an image.');
  }
   if (!app) {
    throw new Error("Firebase app is not initialized. Cannot upload file.");
  }

  const fileExtension = file.name.split('.').pop() || 'jpg';
  const filePath = `profile-pictures/${user.uid}/profile.${fileExtension}`;
  const downloadURL = await uploadFile(app, file, filePath);
  
  // 3. Update the Firebase Auth user profile
  await updateProfile(user, { photoURL: downloadURL });

  // 4. Update the user's document in the 'users' collection in Firestore
  const userDocRef = doc(firestore, 'users', user.uid);
  await updateDoc(userDocRef, { photoURL: downloadURL });

  return downloadURL;
}
