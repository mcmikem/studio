'use server';

import { auth } from 'firebase-admin';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';

const apps = getApps();
if (!apps.length) {
  initializeApp({
    credential: applicationDefault(),
  });
}

export async function getUsers() {
  const users = await auth().listUsers();
  return users.users.map((user) => ({
    uid: user.uid,
    email: user.email,
    disabled: user.disabled,
  }));
}

export async function deleteUser(uid) {
  await auth().deleteUser(uid);
}

export async function getUser(uid) {
  const user = await auth().getUser(uid);
  return { uid: user.uid, email: user.email };
}

export async function updateUser(uid, email) {
  await auth().updateUser(uid, { email });
}

export async function updateUserStatus(uid, disabled) {
  await auth().updateUser(uid, { disabled });
}
