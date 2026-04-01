import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { Feather } from '@expo/vector-icons';

export default function AdminLayout() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, logout, isLoading: authLoading } = useAuthStore();

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
            router.push('/(tabs)/signin');
        }
    }, [isAuthenticated, user, authLoading, router]);

    if (authLoading || !user || user.role !== 'admin') {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    const navItems = [
        { name: 'Overview', href: '/admin/dashboard', icon: 'bar-chart-2' },
        { name: 'Vendors', href: '/admin/vendors', icon: 'shopping-bag' },
        { name: 'Products', href: '/admin/products', icon: 'package' },
        { name: 'Categories', href: '/admin/categories', icon: 'grid' },
        { name: 'Users', href: '/admin/users', icon: 'users' },
    ];

    const handleLogout = async () => {
        await logout();
        router.push('/(tabs)/signin');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Top Admin Header Bar */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Admin Panel</Text>
                    <Text style={styles.headerSubtitle}>{user.name}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Feather name="log-out" size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>

            {/* Horizontal Scrollable Nav */}
            <View style={styles.navContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navScroll}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <TouchableOpacity
                                key={item.name}
                                style={[styles.navItem, isActive && styles.navItemActive]}
                                onPress={() => router.push(item.href as any)}
                            >
                                <Feather name={item.icon as any} size={16} color={isActive ? '#FFF' : '#4B5563'} />
                                <Text style={[styles.navText, isActive && styles.navTextActive]}>{item.name}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Main Content Area */}
            <View style={styles.content}>
                <Slot />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', padding: 16 },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    headerSubtitle: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
    logoutBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8 },
    navContainer: { backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E5E7EB' },
    navScroll: { paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
    navItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
    navItemActive: { backgroundColor: '#4F46E5' },
    navText: { fontSize: 13, fontWeight: '500', color: '#4B5563' },
    navTextActive: { color: '#FFF' },
    content: { flex: 1 }
});
