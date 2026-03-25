
// 1. Export core firebase app instances
export { app, auth, db, storage, messaging, initializeFirebase, requestNotificationPermission } from './client';

// 2. Export Provider Hooks (The main way components interact with Firebase)
// We explicitely exclude re-exporting the utility functions here to avoid conflict
export { 
    FirebaseProvider, 
    useFirebaseServices, 
    useAuth, 
    useFirestore, 
    useFirebaseApp, 
    useFirebaseStorage,
    useUser, 
    useMemoFirebase,
    useCollection,
    useDoc
} from './provider';

// 3. Export Utility functions directly from their source
export { 
    addDocumentNonBlocking, 
    updateDocumentNonBlocking, 
    deleteDocumentNonBlocking 
} from './non-blocking-updates';

// 4. Export Paginated Collection Hook
export { usePaginatedCollection } from './firestore/use-paginated-collection';
