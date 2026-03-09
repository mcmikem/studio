/**
 * Omuto Central — Firebase Cloud Functions
 * 
 * Automations:
 * 1. dailyCheckinReminder        — 9:30 AM EAT, Mon–Fri
 * 2. dailyCheckoutAlert          — 6:00 PM EAT, Mon–Fri
 * 3. weeklyLeaderboardPost       — Every Monday 8:00 AM EAT
 * 4. overdueTaskAlert            — Daily 8:00 AM EAT
 * 5. onboardingNudge             — Triggered on new user creation
 * 
 * Deploy: firebase deploy --only functions
 * Requires Firebase Blaze (pay-as-you-go) plan.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { format } from 'date-fns';

admin.initializeApp();
const db = admin.firestore();

// EAT = UTC+3. Cron in UTC, so 9:30 AM EAT = 6:30 UTC, 6 PM EAT = 15:00 UTC, 8 AM EAT = 5:00 UTC.
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
// 1. Daily Check-in Reminder (9:30 AM EAT = 6:30 AM UTC, Mon–Fri)
// ──────────────────────────────────────────────────────────────────
export const dailyCheckinReminder = functions.pubsub
  .schedule('30 6 * * 1-5')
  .timeZone('Africa/Nairobi')
  .onRun(async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Get all staff users
    const usersSnapshot = await db.collection('users')
      .where('role', 'in', STAFF_ROLES)
      .get();

    const checkedInUsers = new Set<string>();

    const checkinsSnapshot = await db.collection('checkins')
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(todayStart))
      .get();

    checkinsSnapshot.forEach(doc => checkedInUsers.add(doc.data().userId));

    // Alert for users who haven't checked in
    const promises = usersSnapshot.docs
      .filter(doc => !checkedInUsers.has(doc.id))
      .map(doc => {
        const user = doc.data();
        return createAlert(
          `⏰ ${user.name} has not checked in yet today. Please check in to confirm field deployment.`,
          'Warning',
          'Medium',
          '/daily-plan'
        );
      });

    await Promise.all(promises);
    console.log(`[dailyCheckinReminder] Sent ${promises.length} check-in reminders.`);
  });

// ──────────────────────────────────────────────────────────────────
// 2. Daily Check-out Alert (6:00 PM EAT = 15:00 UTC, Mon–Fri)
// ──────────────────────────────────────────────────────────────────
export const dailyCheckoutAlert = functions.pubsub
  .schedule('0 15 * * 1-5')
  .timeZone('Africa/Nairobi')
  .onRun(async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Find staff who checked in today
    const checkinsSnapshot = await db.collection('checkins')
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(todayStart))
      .get();

    const checkedInUsers = new Map<string, string>();
    checkinsSnapshot.forEach(doc => {
      const d = doc.data();
      checkedInUsers.set(d.userId, d.name || 'Unknown');
    });

    // Find staff who also checked out today
    const checkoutsSnapshot = await db.collection('checkouts')
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(todayStart))
      .get();

    const checkedOutUsers = new Set<string>();
    checkoutsSnapshot.forEach(doc => checkedOutUsers.add(doc.data().userId));

    // Alert for those who checked in but not out
    const promises: Promise<any>[] = [];
    checkedInUsers.forEach((name, userId) => {
      if (!checkedOutUsers.has(userId)) {
        promises.push(createAlert(
          `🔔 ${name} checked in today but has not checked out. Please confirm their safe return.`,
          'Warning',
          'High',
          '/stream'
        ));
      }
    });

    await Promise.all(promises);
    console.log(`[dailyCheckoutAlert] Sent ${promises.length} check-out alerts.`);
  });

// ──────────────────────────────────────────────────────────────────
// 3. Weekly Leaderboard Post (Monday 8:00 AM EAT = 5:00 AM UTC)
// ──────────────────────────────────────────────────────────────────
export const weeklyLeaderboardPost = functions.pubsub
  .schedule('0 5 * * 1')
  .timeZone('Africa/Nairobi')
  .onRun(async () => {
    // Read from the existing leaderboard or compute from activities
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const checkoutsSnapshot = await db.collection('checkouts')
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .get();

    const scores: Record<string, { name: string; score: number }> = {};
    checkoutsSnapshot.forEach(doc => {
      const d = doc.data();
      const uid = d.userId;
      if (!scores[uid]) scores[uid] = { name: d.name || 'Unknown', score: 0 };
      scores[uid].score += 10; // 10 pts per checkout
    });

    const sorted = Object.entries(scores)
      .sort(([, a], [, b]) => b.score - a.score)
      .slice(0, 3);

    if (sorted.length === 0) {
      console.log('[weeklyLeaderboardPost] No data to post.');
      return;
    }

    const medal = ['🥇', '🥈', '🥉'];
    const lines = sorted.map(([, { name, score }], i) => `${medal[i]} ${name}: ${score} pts`).join(' | ');
    const weekLabel = format(new Date(), "'Week of' MMM d");

    await createAlert(
      `🏆 Impact Stars — ${weekLabel}: ${lines}. Keep pushing!`,
      'Info',
      'Low',
      '/team-performance'
    );

    console.log('[weeklyLeaderboardPost] Posted weekly leaderboard.');
  });

// ──────────────────────────────────────────────────────────────────
// 4. Overdue Task Alert (Daily 8:00 AM EAT = 5:00 AM UTC)
// ──────────────────────────────────────────────────────────────────
export const overdueTaskAlert = functions.pubsub
  .schedule('0 5 * * *')
  .timeZone('Africa/Nairobi')
  .onRun(async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const usersSnapshot = await db.collection('users').get();
    const promises: Promise<any>[] = [];

    for (const userDoc of usersSnapshot.docs) {
      const tasksSnapshot = await db.collection('users').doc(userDoc.id).collection('tasks')
        .where('completed', '==', false)
        .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(threeDaysAgo))
        .limit(1)
        .get();

      if (!tasksSnapshot.empty) {
        const task = tasksSnapshot.docs[0].data();
        promises.push(createAlert(
          `⚠️ ${userDoc.data().name} has a task overdue by 3+ days: "${task.title}". Please follow up.`,
          'Warning',
          'Medium',
          '/profile?tab=tasks'
        ));
      }
    }

    await Promise.all(promises);
    console.log(`[overdueTaskAlert] Alert sent for ${promises.length} overdue tasks.`);
  });

// ──────────────────────────────────────────────────────────────────
// 5. Onboarding Nudge (triggered on new user document creation)
// ──────────────────────────────────────────────────────────────────
export const onboardingNudge = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap) => {
    const user = snap.data();
    const name = user.name || 'New Team Member';
    const role = user.role || 'Volunteer';

    // Notify Operations Manager of new signup
    await createAlert(
      `🎉 New ${role} joined: ${name} (${user.email}). Please reach out to welcome them and assign tasks.`,
      'Info',
      'Low',
      '/management/users'
    );

    console.log(`[onboardingNudge] Alert sent for new user: ${name}`);
  });

// ──────────────────────────────────────────────────────────────────
// 6. Push Notifications (Triggered on new alert creation)
// ──────────────────────────────────────────────────────────────────
export const onAlertCreated = functions.firestore
  .document('alerts/{alertId}')
  .onCreate(async (snap) => {
    const alert = snap.data();
    if (!alert.targetUserIds || !Array.isArray(alert.targetUserIds) || alert.targetUserIds.length === 0) {
        console.log('[onAlertCreated] No target users specified for this alert.');
        return;
    }

    const targetUserIds = alert.targetUserIds;
    
    // Fetch user documents to get FCM tokens
    const usersSnapshot = await db.collection('users')
      .where(admin.firestore.FieldPath.documentId(), 'in', targetUserIds)
      .get();

    const tokens: string[] = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.fcmToken) {
        tokens.push(userData.fcmToken);
      }
    });

    if (tokens.length === 0) {
      console.log('[onAlertCreated] No FCM tokens found for target users.');
      return;
    }

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: alert.type === 'Urgent' ? '🚨 URGENT: Omuto Central' : '🔔 Omuto Notification',
        body: alert.message,
      },
      webpush: {
        fcmOptions: {
            link: alert.action || '/',
        },
        notification: {
            icon: 'https://omuto-central.web.app/icon-192x192.png' // Use public app icon if available
        }
      },
      // Data payload for potential in-app handling
      data: {
        alertId: snap.id,
        action: alert.action || '/',
      }
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`[onAlertCreated] Successfully sent ${response.successCount} push notifications.`);
      if (response.failureCount > 0) {
        console.warn(`[onAlertCreated] Failed to send ${response.failureCount} notifications.`);
      }
      
      // NOTE: WhatsApp/SMS integration would be triggered here if Twilio/Meta API was configured.
      // Example: await sendWhatsAppMessage(phones, alert.message);
      
    } catch (error) {
      console.error('[onAlertCreated] FCM Error:', error);
    }
  });
