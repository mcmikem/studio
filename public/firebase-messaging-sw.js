// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
const firebaseConfig = {
  "projectId": "studio-3977002412-98a01",
  "appId": "1:23348014627:web:05749dbde62724e11dcb96",
  "storageBucket": "studio-3977002412-98a01.appspot.com",
  "apiKey": "AIzaSyCM_fKRQuoAx2S7C3JPX4SPR5G6vv3uFJA",
  "authDomain": "studio-3977002412-98a01.firebaseapp.com",
  "measurementId": "G-1W5T5XJ41Q",
  "messagingSenderId": "23348014627"
};

firebase.initializeApp(firebaseConfig);


// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
