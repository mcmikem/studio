importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const firebaseConfig = {
  projectId: "studio-3977002412-98a01",
  appId: "1:23348014627:web:05749dbde62724e11dcb96",
  storageBucket: "studio-3977002412-98a01.appspot.com",
  apiKey: "AIzaSyCM_fKRQuoAx2S7C3JPX4SPR5G6vv3uFJA",
  authDomain: "studio-3977002412-98a01.firebaseapp.com",
  messagingSenderId: "23348014627",
  measurementId: "G-1W5T5XJ41Q"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] Background message received:', payload);
  const notificationTitle = payload.notification?.title || 'Omuto Central';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: payload.data?.alertId || 'default',
    data: payload.data,
    actions: payload.data?.action ? [{ title: 'View', action: payload.data.action }] : undefined,
    requireInteraction: payload.priority === 'high' || payload.data?.type === 'Urgent',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw] Notification click:', event);
  event.notification.close();

  const action = event.action || event.notification.data?.action || '/';
  const alertId = event.notification.data?.alertId;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (alertId) {
            client.postMessage({ type: 'NOTIFICATION_CLICKED', alertId, action });
          }
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(action);
      }
    })
  );
});
