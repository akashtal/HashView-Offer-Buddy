import { Tabs } from 'expo-router';
import MobileBottomNav from '@/components/layout/MobileBottomNav';

export default function TabLayout() {
  return (
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
    </Tabs>
  );
}