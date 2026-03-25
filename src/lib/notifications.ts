import { collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase';

export interface AlertData {
  type: 'Info' | 'Urgent' | 'Warning';
  priority: 'Low' | 'Medium' | 'High';
  message: string;
  action?: string;
  targetUserIds?: string[];
  creatorId: string;
}

/**
 * Creates a system-wide alert in Firestore.
 * This will trigger the 'onAlertCreated' Cloud Function to send push notifications.
 */
export async function createSystemAlert(db: any, data: AlertData) {
  if (!db) return;

  const alertDoc = {
    ...data,
    action: data.action || '/',
    targetUserIds: data.targetUserIds || [],
    readBy: [],
    createdAt: serverTimestamp() as Timestamp,
  };

  return addDocumentNonBlocking(collection(db, 'alerts'), alertDoc);
}
