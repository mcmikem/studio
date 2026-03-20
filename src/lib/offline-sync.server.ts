'use server';

import { getFirebaseAdmin } from '@/firebase/server-only';
import { getPendingSyncs, removePendingSync, updateSyncRetry } from './offline-sync';

export async function syncPendingChangesToServer(): Promise<{ synced: number; failed: number }> {
  const { isOnline } = await import('./offline-sync');
  
  if (!isOnline()) {
    return { synced: 0, failed: 0 };
  }

  const pendingSyncs = await getPendingSyncs();
  let synced = 0;
  let failed = 0;

  try {
    const { firestore } = getFirebaseAdmin();

    for (const sync of pendingSyncs) {
      try {
        if (sync.type === 'create') {
          await firestore.collection(sync.collection).add(sync.data);
        } else if (sync.type === 'update') {
          await firestore.collection(sync.collection).doc(sync.data.id).set(sync.data, { merge: true });
        } else if (sync.type === 'delete') {
          const docId = sync.data?.id || sync.id;
          await firestore.collection(sync.collection).doc(docId).delete();
        }

        await removePendingSync(sync.id);
        synced++;
      } catch (error) {
        console.error('Sync failed for:', sync.id, error);
        await updateSyncRetry(sync.id);
        failed++;
      }
    }
  } catch (error) {
    console.error('Failed to get Firebase Admin:', error);
    return { synced: 0, failed: 0 };
  }

  return { synced, failed };
}
