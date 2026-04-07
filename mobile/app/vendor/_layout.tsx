import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import MobileBottomNav from '@/components/layout/MobileBottomNav';

export default function VendorLayout() {
  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }} />
      <MobileBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
});
