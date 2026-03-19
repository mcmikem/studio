'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { requestNotificationPermission, getFirebaseMessaging } from '@/firebase/client';
import { doc, updateDoc } from 'firebase/firestore';
import { onMessage, MessagePayload } from 'firebase/messaging';

export function NotificationManager() {
    const { user } = useUser();
    const firestore = useFirestore();

    useEffect(() => {
        if (!user || !firestore) return;

        const setupNotifications = async () => {
            if ('serviceWorker' in navigator) {
                try {
                    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                    console.log('[FCM] Service worker registered:', reg.scope);
                } catch (err) {
                    console.warn('[FCM] Service worker registration failed:', err);
                }
            }

            const messaging = await getFirebaseMessaging();
            if (messaging) {
                onMessage(messaging, (payload: MessagePayload) => {
                    console.log('[FCM] Foreground message received:', payload);
                    if (Notification.permission === 'granted') {
                        const title = payload.notification?.title || 'Omuto Central';
                        const options: NotificationOptions = {
                            body: payload.notification?.body || '',
                            icon: '/icon-192x192.png',
                            badge: '/icon-192x192.png',
                            tag: payload.data?.alertId || 'default',
                            data: payload.data,
                        };
                        new Notification(title, options);
                    }
                });
            }

            const token = await requestNotificationPermission();
            if (token) {
                const userRef = doc(firestore, 'users', user.uid);
                await updateDoc(userRef, {
                    fcmToken: token,
                    notificationsEnabled: true,
                    fcmTokenUpdatedAt: new Date(),
                });
                console.log('[FCM] Token synchronized for background alerts.');
            }
        };

        setupNotifications();
    }, [user, firestore]);

    return null;
}
