'use client';
     
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  type CollectionReference,
  type DocumentReference,
  type SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { addPendingSync, isOnline } from '@/lib/offline-sync';

const MAX_RETRIES = 5;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function shouldQueue(error: unknown): boolean {
  if (!isOnline()) return true;
  const err = error as { code?: string };
  return err.code === 'unavailable' || err.code === 'deadline-exceeded';
}

export function setDocumentNonBlocking(
  docRef: DocumentReference,
  data: any,
  options?: SetOptions
) {
  const operation = options && 'merge' in options ? 'update' : 'create';
  const syncId = `${docRef.path}-${Date.now()}`;

  return setDoc(docRef, data, options || {}).then(() => {
    return { id: docRef.id, syncId, status: 'synced' as const };
  }).catch(async (error) => {
    if (shouldQueue(error)) {
      const pending = {
        id: syncId,
        type: 'create' as const,
        collection: docRef.path.includes('/') ? docRef.path.split('/')[0] : docRef.path,
        data: { id: docRef.id, ...data },
        timestamp: Date.now(),
      };
      try {
        await addPendingSync(pending);
        return { id: docRef.id, syncId, status: 'queued' as const };
      } catch (queueError) {
        console.error('Failed to queue offline:', queueError);
      }
    }

    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation,
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw error;
  });
}

export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const syncId = generateId();
  const collectionName = colRef.path;

  return addDoc(colRef, data).then((docRef) => {
    return { id: docRef.id, syncId, status: 'synced' as const };
  }).catch(async (error) => {
    if (shouldQueue(error)) {
      const pending = {
        id: syncId,
        type: 'create' as const,
        collection: collectionName,
        data,
        timestamp: Date.now(),
      };
      try {
        await addPendingSync(pending);
        return { id: syncId, syncId, status: 'queued' as const, pending: true };
      } catch (queueError) {
        console.error('Failed to queue offline:', queueError);
      }
    }

    const permissionError = new FirestorePermissionError({
      path: collectionName,
      operation: 'create',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw error;
  });
}

export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  const syncId = `${docRef.path}-${Date.now()}`;

  return updateDoc(docRef, data).then(() => {
    return { id: docRef.id, syncId, status: 'synced' as const };
  }).catch(async (error) => {
    if (shouldQueue(error)) {
      const pending = {
        id: syncId,
        type: 'update' as const,
        collection: docRef.path.includes('/') ? docRef.path.split('/')[0] : docRef.path,
        data: { id: docRef.id, ...data },
        timestamp: Date.now(),
      };
      try {
        await addPendingSync(pending);
        return { id: docRef.id, syncId, status: 'queued' as const };
      } catch (queueError) {
        console.error('Failed to queue offline:', queueError);
      }
    }

    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw error;
  });
}

export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  const syncId = `${docRef.path}-${Date.now()}`;

  return deleteDoc(docRef).then(() => {
    return { id: docRef.id, syncId, status: 'synced' as const };
  }).catch(async (error) => {
    if (shouldQueue(error)) {
      const pending = {
        id: syncId,
        type: 'delete' as const,
        collection: docRef.path.includes('/') ? docRef.path.split('/')[0] : docRef.path,
        data: { id: docRef.id },
        timestamp: Date.now(),
      };
      try {
        await addPendingSync(pending);
        return { id: docRef.id, syncId, status: 'queued' as const };
      } catch (queueError) {
        console.error('Failed to queue offline:', queueError);
      }
    }

    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw error;
  });
}
