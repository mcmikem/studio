
'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { requestNotificationPermission } from '@/firebase/index';
import { doc, updateDoc } from 'firebase/firestore';

export function NotificationManager() {
    const { user } = useUser();
    const firestore = useFirestore();

    useEffect(() => {
        if (!user || !firestore) return;

        const setupNotifications = async () => {
            const token = await requestNotificationPermission();
            if (token) {
                const userRef = doc(firestore, 'users', user.uid);
                await updateDoc(userRef, {
                    fcmToken: token,
                    notificationsEnabled: true,
                    lastTokenSync: new Date()
                });
                console.log('FCM Token Synchronized for background alerts.');
            }
        };

        setupNotifications();
    }, [user, firestore]);

    return null;
}
