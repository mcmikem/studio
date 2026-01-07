'use server';

import { auth } from 'firebase-admin';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';

const apps = getApps();
if (!apps.length) {
  initializeApp({
    credential: applicationDefault(),
  });
}

export async function createUser(email, password) {
  try {
    const user = await auth().createUser({ email, password });
    return { user };
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      return { error: 'The email address is already in use by another account.' };
    }
    throw error;
  }
}
