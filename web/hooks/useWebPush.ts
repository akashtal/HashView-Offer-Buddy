import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Utility to convert Base64 VAPID key to Uint8Array required by pushManager
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useWebPush(authToken?: string | null) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const registerAndSubscribe = useCallback(async () => {
    if (!isSupported) {
      console.log('[WebPush] Push notifications are not supported in this browser.');
      return null;
    }

    try {
      // 1. Request Permission if not already granted
      let currentPerm = Notification.permission;
      if (currentPerm === 'default') {
        currentPerm = await Notification.requestPermission();
        setPermission(currentPerm);
      }

      if (currentPerm !== 'granted') {
        console.warn('[WebPush] Permission not granted for push notifications.');
        return null;
      }

      // 2. Register Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[WebPush] Service Worker registered.');

      // Wait for service worker to be ready
      const readyRegistration = await navigator.serviceWorker.ready;

      // 3. Check for existing subscription
      let subscription = await readyRegistration.pushManager.getSubscription();

      if (!subscription) {
        // We need to fetch the VAPID public key from our server first
        const vapidRes = await axios.get('/api/notifications/vapid-public-key');
        const vapidPublicKey = vapidRes.data.data.publicKey;

        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

        // 4. Subscribe to Push
        subscription = await readyRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
        console.log('[WebPush] Subscribed successfully.');
      }

      // 5. Send subscription to backend if user is logged in
      if (authToken && subscription) {
        await axios.post(
          '/api/notifications/register-token',
          { token: JSON.stringify(subscription), platform: 'web' },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('[WebPush] Subscription synced to backend.');
      }

      return subscription;
    } catch (error) {
      console.error('[WebPush] Failed to register push:', error);
      return null;
    }
  }, [isSupported, authToken]);

  return { isSupported, permission, registerAndSubscribe };
}
