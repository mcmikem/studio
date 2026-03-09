
const admin = require('firebase-admin');
const serviceAccount = require('./secrets/serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const firestore = admin.firestore();

async function debug() {
    try {
        const snapshot = await firestore.collection('ofa-teams').limit(5).get();
        console.log('--- OFA Teams Debug ---');
        snapshot.docs.forEach(doc => {
            console.log(`ID: ${doc.id}`);
            console.log('Data:', JSON.stringify(doc.data(), null, 2));
            console.log('-------------------');
        });
    } catch (err) {
        console.error('Debug failed:', err);
    }
}

debug();
