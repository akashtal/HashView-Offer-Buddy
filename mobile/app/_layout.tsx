import { Stack } from 'expo-router';
import { View } from 'react-native';
import Header from '@/components/layout/Header';
import { usePathname } from 'expo-router';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { LocationProvider } from '@/context/LocationContext';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import AnimatedSplashScreen from '@/components/ui/AnimatedSplashScreen';



// Connect Axios to the web backend using the environment variable defined in mobile/.env
const API_URL = process.env.EXPO_PUBLIC_API_URL;
axios.defaults.baseURL = API_URL;

export default function RootLayout() {
  const pathname = usePathname();
  const fetchUser = useAuthStore((state) => state.fetchUser);

  const [appReady, setAppReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Pre-load auth state before showing anything
        await fetchUser();
      } catch (_) {
        // Ignore errors — app still launches
      } finally {
        setAppReady(true);
      }
    })();
  }, [fetchUser]);

  const isAdminPage = pathname.startsWith('/admin') || pathname.startsWith('/vendor/dashboard');
  const showHeader = !isAdminPage;

  // While native splash is up, render a black screen to prevent white flash
  if (!appReady) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  return (
    <LocationProvider>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Main app (rendered behind splash so it initialises early) */}
        {splashDone && showHeader && <Header />}
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