
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
import {FirestorePermissionError} from '@/firebase/errors';


/**
 * Initiates a setDoc operation for a document reference.
 * It catches permission errors and emits them globally.
 * Returns the promise from the setDoc operation.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options?: SetOptions) {
  const operation = options && 'merge' in options ? 'update' : 'create';
  return setDoc(docRef, data, options || {}).catch(error => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: operation,
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    // Let the original error propagate for local handling if needed
    throw error;
  });
}


/**
 * Initiates an addDoc operation for a collection reference.
 * It catches permission errors and emits them globally.
 * Returns the promise which resolves with the new DocumentReference.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  return addDoc(colRef, data).catch(error => {
    console.error("addDocumentNonBlocking failed:", error);
    const permissionError = new FirestorePermissionError({
      path: colRef.path,
      operation: 'create',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    // Let the original error propagate
    throw error;
  });
}


/**
 * Initiates an updateDoc operation for a document reference.
 * It catches permission errors and emits them globally.
 * Returns the promise from the updateDoc operation.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  return updateDoc(docRef, data).catch(error => {
    console.error("updateDocumentNonBlocking failed:", error);
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    // Let the original error propagate
    throw error;
  });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * It catches permission errors and emits them globally.
 * Returns the promise from the deleteDoc operation.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  return deleteDoc(docRef).catch(error => {
    console.error("deleteDocumentNonBlocking failed:", error);
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    // Let the original error propagate
    throw error;
  });
}
