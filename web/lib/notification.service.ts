/**
 * notification.service.ts
 * Uses the Expo Push Notification HTTP API to send push notifications.
 * No Firebase setup required — works natively with expo-notifications on device.
 */

import dbConnect from './mongodb';
import NotificationToken from '@/models/NotificationToken';
import mongoose from 'mongoose';
import webPush from 'web-push';

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

// Configure Web Push VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    'mailto:admin@offersbuddy.in',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('[NotificationService] VAPID keys not configured. Web push will fail.');
}

interface ExpoPushMessage {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

/**
 * Send a push notification to one or more tokens (Expo or Web Push).
 * Automatically separates tokens and routes them to the correct service.
 */
export async function sendPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<void> {
  if (!tokens || tokens.length === 0) return;

  const expoTokens: string[] = [];
  const webSubscriptions: any[] = [];

  // Separate Expo tokens from Web subscriptions
  for (const token of tokens) {
    if (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')) {
      expoTokens.push(token);
    } else if (token.startsWith('{')) {
      try {
        webSubscriptions.push(JSON.parse(token));
      } catch (e) {
        console.warn('[NotificationService] Invalid web subscription format');
      }
    }
  }

  // --- SEND EXPO PUSH (MOBILE) ---
  if (expoTokens.length > 0) {
    const messages: ExpoPushMessage[] = expoTokens.map((token) => ({
      to: token,
      title,
      body,
      data,
      sound: 'default',
      priority: 'high',
    }));

    try {
      const response = await fetch(EXPO_PUSH_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      const tickets: ExpoPushTicket[] = result.data || [];

      // Remove invalid Expo tokens (DeviceNotRegistered)
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          const invalidToken = expoTokens[i];
          if (invalidToken) {
            await NotificationToken.updateOne({ token: invalidToken }, { isActive: false }).catch(() => {});
          }
        }
      }
    } catch (error) {
      console.error('[NotificationService] Failed to send Expo push:', error);
    }
  }

  // --- SEND WEB PUSH (BROWSER) ---
  if (webSubscriptions.length > 0 && process.env.VAPID_PUBLIC_KEY) {
    const payload = JSON.stringify({
      title,
      body,
      url: data.url || '/',
      icon: '/icon-192x192.png',
      ...data,
    });

    const webPushPromises = webSubscriptions.map((sub) =>
      webPush.sendNotification(sub, payload).catch(async (error) => {
        if (error.statusCode === 404 || error.statusCode === 410) {
          // Subscription has expired or is no longer valid
          const invalidTokenStr = JSON.stringify(sub);
          await NotificationToken.updateOne({ token: invalidTokenStr }, { isActive: false }).catch(() => {});
        } else {
          console.error('[NotificationService] Web push error:', error);
        }
      })
    );

    await Promise.all(webPushPromises);
  }
}

/**
 * Helper to send notifications to a specific user or vendor
 */
export async function sendNotificationToUserOrVendor(
  userId: string | mongoose.Types.ObjectId,
  userType: 'user' | 'vendor',
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<void> {
  try {
    await dbConnect();
    const records = await NotificationToken.find({
      userId,
      userType,
      isActive: true,
    }).lean();

    const tokens = records.map((r) => r.token);
    if (tokens.length > 0) {
      await sendPushNotification(tokens, title, body, data);
    }
  } catch (error) {
    console.error('[NotificationService] sendNotificationToUserOrVendor error:', error);
  }
}

/**
 * Send a push notification to all active devices of a specific vendor.
 */
export async function sendNotificationToVendor(
  vendorId: string | mongoose.Types.ObjectId,
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<void> {
  return sendNotificationToUserOrVendor(vendorId, 'vendor', title, body, data);
}

/**
 * Send a push notification to multiple vendors by their IDs.
 */
export async function sendNotificationToVendors(
  vendorIds: (string | mongoose.Types.ObjectId)[],
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<void> {
  if (!vendorIds.length) return;
  try {
    await dbConnect();
    const records = await NotificationToken.find({
      userId: { $in: vendorIds },
      userType: 'vendor',
      isActive: true,
    }).lean();

    const tokens = records.map((r) => r.token);
    if (tokens.length > 0) {
      await sendPushNotification(tokens, title, body, data);
    }
  } catch (error) {
    console.error('[NotificationService] sendNotificationToVendors error:', error);
  }
}
