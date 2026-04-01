import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useLocation } from '@/context/LocationContext';

export default function Header() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const wishlistCount = useWishlistStore((state) => state.getCount());

  const { location, isLoading: locationLoading, requestLocation } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const locationLabel = location
    ? [location.city, location.state].filter(Boolean).join(', ')
    : 'Set Location';

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}` as any);
    }
  };

  const handleProfilePress = () => {
    if (isAuthenticated) {
      if (user?.role === 'vendor') router.push('/vendor/dashboard');
      else if (user?.role === 'admin') router.push('/admin/dashboard');
      else router.push('/profile' as any);
    } else {
      router.push('/signin' as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topRow}>
          {/* Logo */}
          <Image source={require('@/assets/images/logo.jpeg')} style={styles.logo} resizeMode="contain" />

          {/* Location */}
          <TouchableOpacity style={styles.locationWrap} onPress={requestLocation}>
            <Feather name="map-pin" size={14} color="#FDB913" />
            {locationLoading ? (
              <ActivityIndicator size="small" color="#FFF" style={{ marginHorizontal: 6 }} />
            ) : (
              <Text style={styles.locationText} numberOfLines={1}>{locationLabel}</Text>
            )}
            <Feather name="chevron-down" size={14} color="#FFF" />
          </TouchableOpacity>

          {/* Actions */}
          <View style={styles.actionsWrap}>
            <TouchableOpacity onPress={() => router.push('/wishlist' as any)} style={styles.iconBtn}>
              <Feather name="heart" size={20} color="#333" />
              {wishlistCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{wishlistCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleProfilePress} style={styles.iconBtn}>
              <Feather name="user" size={20} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Feather name="search" size={18} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for products..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#1F2937', // Dark gradient fallback matching web's from-secondary to-secondary
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1F2937',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  locationWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  locationText: {
    color: '#FFF',
    fontSize: 14,
    marginHorizontal: 4,
    fontWeight: '500',
  },
  actionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#FFF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchRow: {
    flexDirection: 'row',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: '#333',
  },
});
