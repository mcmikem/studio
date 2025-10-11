
'use client';

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, type User } from 'firebase/auth';
import { doc, updateDoc, type Firestore } from 'firebase/firestore';

/**
 * Uploads an image to Firebase Storage, updates the user's Auth profile,
 * and updates their Firestore profile document.
 * @param file The image file to upload.
 * @param user The current Firebase Auth user object.
 * @param firestore A Firestore instance.
 * @returns The public URL of the uploaded image.
 */
export async function uploadImageAndUpdateProfile(
  file: File,
  user: User,
  firestore: Firestore
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File is not an image.');
  }

  const storage = getStorage();
  const filePath = `profile-pictures/${user.uid}/${file.name}`;
  const storageRef = ref(storage, filePath);

  // 1. Upload the file to Firebase Storage
  const snapshot = await uploadBytes(storageRef, file);

  // 2. Get the public download URL
  const downloadURL = await getDownloadURL(snapshot.ref);

  // 3. Update the Firebase Auth user profile
  await updateProfile(user, { photoURL: downloadURL });

  // 4. Update the user's document in the 'users' collection in Firestore
  const userDocRef = doc(firestore, 'users', user.uid);
  await updateDoc(userDocRef, { photoURL: downloadURL });

  return downloadURL;
}

    