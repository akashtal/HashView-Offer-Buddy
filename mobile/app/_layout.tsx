import { Stack, router } from 'expo-router';
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
console.log("RESOLVED API_URL IS:", API_URL);
axios.defaults.baseURL = API_URL;

// Global Interceptors
axios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle Network/Offline Errors globally
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      Toast.show({
        type: 'error',
        text1: 'No Internet Connection',
        text2: 'Please check your network and try again.',
        position: 'top',
        visibilityTime: 4000,
      });
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      if (!url.includes('/api/auth/login') && !url.includes('/api/auth/me')) {
        console.log('[Axios Interceptor] 401 detected, logging out user.');
        await useAuthStore.getState().logout();
        router.replace('/(tabs)/signin');
      }
    }
    return Promise.reject(error);
  }
);

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
    if (appReady) {
      (async () => {
        // Request permissions immediately on app launch, regardless of login state
        const pushToken = await registerForPushNotifications();
        
        // Only sync to backend if user is authenticated
        if (pushToken && isAuthenticated && token) {
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