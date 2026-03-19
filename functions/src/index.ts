/**
 * Omuto Central — Firebase Cloud Functions
 * 
 * ACTIVE:
 * - onAlertCreated   — Sends push notifications when alerts are created
 * - onboardingNudge  — Notifies team when new users join
 * 
 * DISABLED (need Cloud Scheduler = billing required):
 * - dailyCheckinReminder
 * - dailyCheckoutAlert
 * - weeklyLeaderboardPost
 * - overdueTaskAlert
 * 
 * Deploy: firebase deploy --only functions
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { format } from 'date-fns';

admin.initializeApp();
const db = admin.firestore();

const STAFF_ROLES = ['Executive Director', 'Programs & Partnerships Manager', 'Operations & Field Manager', 'Media & Finance Lead', 'Resource Mobilization Lead', 'Administrator', 'Accountant/Finance', 'Essentials Manager', 'Youth Center Manager'];

async function createAlert(message: string, type: string = 'Info', priority: string = 'Medium', action?: string) {
  await db.collection('alerts').add({
    type,
    priority,
    message,
    action: action || '/',
    creatorId: 'system',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    readBy: [],
  });
}

// ──────────────────────────────────────────────────────────────────
// DISABLED — Requires Cloud Scheduler (billing needed)
// ──────────────────────────────────────────────────────────────────
// export const dailyCheckinReminder = functions.pubsub
//   .schedule('30 6 * * 1-5')
//   .timeZone('Africa/Nairobi')
//   .onRun(async () => { ... });

// export const dailyCheckoutAlert = functions.pubsub
//   .schedule('0 15 * * 1-5')
//   .timeZone('Africa/Nairobi')
//   .onRun(async () => { ... });

// export const weeklyLeaderboardPost = functions.pubsub
//   .schedule('0 5 * * 1')
//   .timeZone('Africa/Nairobi')
//   .onRun(async () => { ... });

// export const overdueTaskAlert = functions.pubsub
//   .schedule('0 5 * * *')
//   .timeZone('Africa/Nairobi')
//   .onRun(async () => { ... });

// ──────────────────────────────────────────────────────────────────
// 1. Onboarding Nudge (triggered on new user document creation)
// ──────────────────────────────────────────────────────────────────
export const onboardingNudge = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap) => {
    const user = snap.data() as { name?: string; role?: string; email?: string };
    const name = user.name || 'New Team Member';
    const role = user.role || 'Volunteer';

    await createAlert(
      `🎉 New ${role} joined: ${name} (${user.email}). Please reach out to welcome them and assign tasks.`,
      'Info',
      'Low',
      '/management/users'
    );

    console.log(`[onboardingNudge] Alert sent for new user: ${name}`);
  });

// ──────────────────────────────────────────────────────────────────
// 2. Push Notifications (Triggered on new alert creation)
// ──────────────────────────────────────────────────────────────────
export const onAlertCreated = functions.firestore
  .document('alerts/{alertId}')
  .onCreate(async (snap) => {
    const alert = snap.data() as {
      type?: string;
      priority?: string;
      message?: string;
      action?: string;
      targetUserIds?: string[];
    };
    const isTargeted = alert.targetUserIds && alert.targetUserIds.length > 0;

    let tokens: string[] = [];

    if (isTargeted) {
      const usersSnapshot = await db.collection('users')
        .where(admin.firestore.FieldPath.documentId(), 'in', alert.targetUserIds)
        .get();
      usersSnapshot.forEach(doc => {
        const userData = doc.data() as { fcmToken?: string };
        if (userData.fcmToken) tokens.push(userData.fcmToken);
      });
    } else {
      const allUsersSnapshot = await db.collection('users').where('fcmToken', '!=', null).get();
      allUsersSnapshot.forEach(doc => {
        const userData = doc.data() as { fcmToken?: string };
        if (userData.fcmToken && typeof userData.fcmToken === 'string') {
          tokens.push(userData.fcmToken);
        }
      });
    }

    if (tokens.length === 0) {
      console.log('[onAlertCreated] No FCM tokens found.');
      return;
    }

    const titleMap: Record<string, string> = {
      Urgent: '🚨 URGENT: Omuto Central',
      Warning: '⚠️ Alert: Omuto Central',
      Info: '🔔 Omuto Central',
    };

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: titleMap[alert.type || ''] || '🔔 Omuto Central',
        body: alert.message || '',
      },
      webpush: {
        fcmOptions: { link: alert.action || '/' },
        notification: {
          icon: 'https://omuto-central.web.app/icon-192x192.png',
          badge: 'https://omuto-central.web.app/icon-192x192.png',
        }
      },
      data: {
        alertId: snap.id,
        action: alert.action || '/',
        priority: alert.priority || 'Medium',
        type: alert.type || 'Info',
      },
      android: {
        priority: alert.priority === 'High' || alert.type === 'Urgent' ? 'high' : 'normal',
      }
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`[onAlertCreated] Sent ${response.successCount}/${tokens.length} push notifications.`);
      if (response.failureCount > 0) {
        response.responses.forEach((res, i) => {
          if (!res.success) {
            console.warn(`[onAlertCreated] Failed token ${i}:`, res.error?.message);
          }
        });
      }
    } catch (error) {
      console.error('[onAlertCreated] FCM Error:', error);
    }
  });
