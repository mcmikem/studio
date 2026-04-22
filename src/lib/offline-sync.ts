import { z } from 'zod';
import { addDoc, collection, deleteDoc, doc, Firestore, setDoc } from 'firebase/firestore';

const PendingSyncSchema = z.object({
  id: z.string(),
  type: z.enum(['create', 'update', 'delete']),
  collection: z.string(),
  data: z.any(),
  timestamp: z.number(),
  retries: z.number().default(0),
});

export type PendingSync = z.infer<typeof PendingSyncSchema>;
export type SyncType = PendingSync['type'];

const DB_NAME = 'omuto-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-sync';

let db: IDBDatabase | null = null;

export async function initOfflineDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function addPendingSync(sync: Omit<PendingSync, 'retries'>): Promise<void> {
  const database = await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add({ ...sync, retries: 0 });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getPendingSyncs(): Promise<PendingSync[]> {
  const database = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function removePendingSync(id: string): Promise<void> {
  const database = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function updateSyncRetry(id: string): Promise<void> {
  const database = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const sync = getRequest.result;
      if (sync) {
        sync.retries += 1;
        const putRequest = store.put(sync);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function clearAllPendingSyncs(): Promise<void> {
  const database = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export async function syncPendingChanges(firestore: Firestore): Promise<{ synced: number; failed: number }> {
  if (!isOnline()) {
    return { synced: 0, failed: 0 };
  }

  const pendingSyncs = await getPendingSyncs();
  let synced = 0;
  let failed = 0;

  for (const sync of pendingSyncs) {
    try {
      if (sync.type === 'create') {
        await addDoc(collection(firestore, sync.collection), sync.data);
      } else if (sync.type === 'update') {
        const docId = sync.data?.id || sync.id;
        await setDoc(doc(firestore, sync.collection, docId), sync.data, { merge: true });
      } else if (sync.type === 'delete') {
        const docId = sync.data?.id || sync.id;
        await deleteDoc(doc(firestore, sync.collection, docId));
      }

      await removePendingSync(sync.id);
      synced++;
    } catch (error) {
      console.error('Sync failed for:', sync.id, error);
      await updateSyncRetry(sync.id);
      failed++;
    }
  }

  return { synced, failed };
}
