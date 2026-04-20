/**
 * notification.service.ts
 * Uses the Expo Push Notification HTTP API to send push notifications.
 * No Firebase setup required — works natively with expo-notifications on device.
 */

import dbConnect from './mongodb';
import NotificationToken from '@/models/NotificationToken';
import mongoose from 'mongoose';

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

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
 * Send a push notification to one or more Expo push tokens.
 */
export async function sendPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<ExpoPushTicket[]> {
  if (!tokens || tokens.length === 0) return [];

  // Filter to only valid Expo tokens
  const validTokens = tokens.filter(
    (t) => t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken[')
  );

  if (validTokens.length === 0) return [];

  const messages: ExpoPushMessage[] = validTokens.map((token) => ({
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

    // Remove invalid tokens (DeviceNotRegistered)
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (
        ticket.status === 'error' &&
        ticket.details?.error === 'DeviceNotRegistered'
      ) {
        const invalidToken = validTokens[i];
        if (invalidToken) {
          await NotificationToken.updateOne(
            { token: invalidToken },
            { isActive: false }
          ).catch(() => {});
        }
      }
    }

    return tickets;
  } catch (error) {
    console.error('[NotificationService] Failed to send push:', error);
    return [];
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
  try {
    await dbConnect();
    const records = await NotificationToken.find({
      userId: vendorId,
      userType: 'vendor',
      isActive: true,
    }).lean();

    const tokens = records.map((r) => r.token);
    if (tokens.length > 0) {
      await sendPushNotification(tokens, title, body, data);
    }
  } catch (error) {
    console.error('[NotificationService] sendNotificationToVendor error:', error);
  }
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
      // Send in batches of 100 (Expo limit)
      for (let i = 0; i < tokens.length; i += 100) {
        const batch = tokens.slice(i, i + 100);
        await sendPushNotification(batch, title, body, data);
      }
    }
  } catch (error) {
    console.error('[NotificationService] sendNotificationToVendors error:', error);
  }
}
