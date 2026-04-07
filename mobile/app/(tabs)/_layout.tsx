import { Tabs, usePathname } from 'expo-router';
import { View } from 'react-native';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import Header from '@/components/layout/Header';

export default function TabLayout() {
  const pathname = usePathname();

  // Hide the global Header on admin pages (admin has its own)
  const showHeader = !pathname.startsWith('/admin');

  return (
    <View style={{ flex: 1 }}>
      {showHeader && <Header />}
      <Tabs
        tabBar={(props) => <MobileBottomNav />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="products/index" />
        <Tabs.Screen name="products/[id]" />
        <Tabs.Screen name="suppliers" />
        <Tabs.Screen name="categories" />
        <Tabs.Screen name="cart" />

        {/* 
          Hidden from the physical bottom bar by ignoring them in MobileBottomNav,
          but they get the bottom nav layout contexts.
        */}
        <Tabs.Screen name="wishlist" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="signin" />
        <Tabs.Screen name="signup" />
        <Tabs.Screen name="forgot-password" />
        <Tabs.Screen name="reset-password" />
        <Tabs.Screen name="vendor-login" />
        <Tabs.Screen name="vendor-register" />
        <Tabs.Screen name="vendors/[id]" />
        <Tabs.Screen name="chat/index" />
        <Tabs.Screen name="chat/[id]" />
      </Tabs>
    </View>
  );
}