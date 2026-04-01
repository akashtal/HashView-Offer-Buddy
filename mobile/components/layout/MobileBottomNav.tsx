import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useCartStore } from '@/store/cartStore';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const cartCount = useCartStore((state) => state.getItemCount());

  const navItems = [
    { name: 'Home', href: '/(tabs)', icon: 'home' as const },
    { name: 'Shop', href: '/products', icon: 'grid' as const },
    { name: 'Suppliers', href: '/suppliers', icon: 'users' as const },
    { name: 'Categories', href: '/categories', icon: 'tag' as const },
    { name: 'Cart', href: '/cart', icon: 'shopping-cart' as const, badge: cartCount },
  ];

  const isActive = (path: string) => {
    if (path === '/(tabs)' || path === '/') return pathname === '/' || pathname === '/(tabs)';
    return pathname.startsWith(path);
  };

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <TouchableOpacity
            key={item.name}
            style={styles.item}
            onPress={() => router.push(item.href as any)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <Feather
                name={item.icon}
                size={22}
                color={active ? '#FDB913' : '#666'}
              />
              {item.badge !== undefined && item.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#E53935',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  labelActive: {
    color: '#FDB913',
    fontWeight: 'bold',
  },
});
