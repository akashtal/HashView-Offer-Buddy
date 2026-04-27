import { Stack } from 'expo-router';
import { View } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { LocationProvider } from '@/context/LocationContext';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import AnimatedSplashScreen from '@/components/ui/AnimatedSplashScreen';
import { registerForPushNotifications, syncPushTokenWithBackend } from '@/services/notifications.service';

// Connect Axios to the web backend using the environment variable defined in mobile/.env
const API_URL = process.env.EXPO_PUBLIC_API_URL;
axios.defaults.baseURL = API_URL;

export default function RootLayout() {
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const [appReady, setAppReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await fetchUser();
      } catch (_) {
        // Ignore errors — app still launches
      } finally {
        setAppReady(true);
      }
    })();
  }, [fetchUser]);

  // Request Notification Permissions & Sync Token when authenticated
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (appReady && isAuthenticated && token) {
      (async () => {
        const pushToken = await registerForPushNotifications();
        if (pushToken) {
          await syncPushTokenWithBackend(pushToken, token);
        }
      })();
    }
  }, [appReady, isAuthenticated, token]);

  // While native splash is up, render a black screen to prevent white flash
  if (!appReady) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  return (
    <LocationProvider>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#FFF' },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <Toast />

        {/* Custom animated splash sits on top until animation completes */}
        {!splashDone && (
          <AnimatedSplashScreen onFinish={() => setSplashDone(true)} />
        )}
      </View>
    </LocationProvider>
  );
}