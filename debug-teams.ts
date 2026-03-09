
import { getFirebaseAdmin } from './src/firebase/server';

const debugTeams = async () => {
    try {
        const { firestore } = getFirebaseAdmin();
        const snapshot = await firestore.collection('ofa-teams').limit(5).get();
        
        console.log('--- OFA Teams Debug ---');
        snapshot.docs.forEach(doc => {
            console.log(`ID: ${doc.id}`);
            console.log('Data:', JSON.stringify(doc.data(), null, 2));
            console.log('-------------------');
        });
    } catch (err) {
        console.error('Debug script failed:', err);
    }
    process.exit(0);
};

debugTeams();
