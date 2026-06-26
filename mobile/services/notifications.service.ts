/**
 * notifications.service.ts
 * Handles Expo push notification token registration and API syncing.
 * Uses expo-notifications to get the device Expo Push Token (EPT),
 * then sends it to our backend for storage.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions and get the Expo push token.
 * Returns the token string or null if permission is denied.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications don't work on web or simulators - only real devices
  if (!Device.isDevice) {
    console.warn('[Notifications] Not a real device. Push notifications may not work.');
  }

  // Check current permission status
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Push notification permission denied.');
    return null;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('vendor-alerts', {
      name: 'Vendor Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Get Expo push token
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn('[Notifications] No EAS projectId found for push token generation.');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data; // e.g. "ExponentPushToken[xxxxxx]"
  } catch (error) {
    console.error('[Notifications] Error getting Expo push token:', error);
    if (!Device.isDevice) {
      console.warn('Must use physical device for Push Notifications');
    }
    return null;
  }
}

/**
 * Register the push token with our backend.
 * Call this after the user logs in.
 */
export async function syncPushTokenWithBackend(
  token: string,
  authToken: string
): Promise<void> {
  try {
    const platform =
      Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

    await axios.post(
      `${API_URL}/api/notifications/register-token`,
      { token, platform },
      {}
    );
    console.log('[Notifications] Push token registered with backend.');
  } catch (error) {
    console.warn('[Notifications] Failed to register push token with backend:', error);
  }
}

/**
 * Unregister the push token from our backend on logout.
 */
export async function unregisterPushToken(
  token: string,
  authToken: string
): Promise<void> {
  try {
    await axios.delete(`${API_URL}/api/notifications/unregister-token`, {
      data: { token },
      
    });
    console.log('[Notifications] Push token unregistered from backend.');
  } catch (error) {
    console.warn('[Notifications] Failed to unregister push token:', error);
  }
}
