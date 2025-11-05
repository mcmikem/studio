
'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  doc,
  writeBatch,
  getDocs,
  query,
  limit,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';
import { samplePrograms, samplePartnerships, sampleProjects, sampleImpactMetrics, sampleAlerts, sampleCalendarEvents, sampleTeamWeeklyPlans, sampleHistoricalIncome, sampleHistoricalExpenses, sampleTaskTemplates } from '@/lib/data';

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
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    // Let the original error propagate
    throw error;
  });
}

export async function seedInitialData(db: any, userId: string) {
  console.log("Checking if initial data seeding is needed...")
  
  // This is the very first user signup. Seed the entire database.
  console.log("Seeding all initial data...")
  const batch = writeBatch(db)

  const collectionsToSeed = [
    { name: "programs", data: samplePrograms },
    { name: "partnerships", data: samplePartnerships },
    { name: "projects", data: sampleProjects },
    { name: "impact-metrics", data: sampleImpactMetrics },
    { name: "alerts", data: sampleAlerts },
    { name: "events", data: sampleCalendarEvents },
    { name: "team-workplans", data: sampleTeamWeeklyPlans },
    { name: 'income', data: sampleHistoricalIncome },
    { name: 'expenses', data: sampleHistoricalExpenses },
    { name: 'task-templates', data: sampleTaskTemplates },
     { name: "proposals", data: [
        { title: 'GlobalGiving Youth Empowerment Grant', partnerName: 'GlobalGiving', amountRequested: 5000000, status: 'Submitted', submissionDate: '2025-09-15', createdAt: new Date() },
        { title: 'Local District Education Fund', partnerName: 'Mpigi District', amountRequested: 2500000, status: 'Draft', submissionDate: '2025-10-20', createdAt: new Date() },
      ]
    },
  ]

  for (const coll of collectionsToSeed) {
    for (const item of coll.data) {
      const docRef = doc(collection(db, coll.name))
      batch.set(docRef, item)
    }
  }

  try {
    await batch.commit()
    console.log("Initial data seeded successfully.")
  } catch (error) {
    console.error("Error seeding data: ", error)
  }
}
