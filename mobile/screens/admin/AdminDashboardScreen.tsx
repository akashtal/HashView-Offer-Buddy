import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useAdminStore } from '@/store/adminStore';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';

export default function AdminDashboardScreen() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const { stats, fetchStats, isLoading } = useAdminStore();

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/(tabs)/signin');
        } else {
            fetchStats();
        }
    }, [isAuthenticated, user, fetchStats, router]);

    if (!isAuthenticated || user?.role !== 'admin') {
        return <Loading fullScreen />;
    }

    if (isLoading || !stats) {
        return <Loading fullScreen text="Loading stats..." />;
    }

    const StatCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: any; color: string }) => (
        <View style={styles.statCardWrapper}>
            <View style={[styles.statCard, { borderLeftColor: color }]}>
                <View style={styles.statContent}>
                    <View>
                        <Text style={styles.statTitle}>{title}</Text>
                        <Text style={[styles.statValue, { color }]}>{value}</Text>
                    </View>
                    <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
                        <Feather name={icon} size={24} color={color} />
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="menu" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Admin Dashboard</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.welcomeBox}>
                    <Text style={styles.welcomeTitle}>Dashboard Overview</Text>
                    <Text style={styles.welcomeSub}>Welcome back, {user?.name}</Text>
                </View>

                {/* Stats Grid */}
                <View style={styles.grid}>
                    <StatCard title="Total Users" value={stats.summary.totalUsers} icon="users" color="#3B82F6" />
                    <StatCard title="Total Vendors" value={stats.summary.totalVendors} icon="shopping-bag" color="#10B981" />
                    <StatCard title="Total Products" value={stats.summary.totalProducts} icon="package" color="#8B5CF6" />
                    <StatCard title="Pending Approvals" value={stats.summary.pendingVendors} icon="clock" color="#F59E0B" />
                </View>

                {/* System Status */}
                <Card style={styles.cardSpacing}>
                    <CardHeader>
                        <Text style={styles.cardHeaderTitle}>System Status</Text>
                    </CardHeader>
                    <CardBody>
                        <View style={styles.statusRow}>
                            <Text style={styles.statusText}>Server Status</Text>
                            <View style={styles.statusBadgeGreen}>
                                <Text style={styles.statusBadgeTextGreen}>Operational</Text>
                            </View>
                        </View>
                        <View style={styles.statusRow}>
                            <Text style={styles.statusText}>Database Connection</Text>
                            <View style={styles.statusBadgeGreen}>
                                <Text style={styles.statusBadgeTextGreen}>Connected</Text>
                            </View>
                        </View>
                        <View style={[styles.statusRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                            <Text style={styles.statusText}>Last Backup</Text>
                            <Text style={styles.statusValueDark}>Today, 04:00 AM</Text>
                        </View>
                    </CardBody>
                </Card>

                {/* Recent Signups */}
                <Card style={styles.cardSpacing}>
                    <CardHeader>
                        <Text style={styles.cardHeaderTitle}>Recent Signups</Text>
                    </CardHeader>
                    <CardBody>
                        <View style={styles.emptyActivity}>
                            <Feather name="activity" size={32} color="#D1D5DB" />
                            <Text style={styles.emptyActivityText}>No recent activity to display.</Text>
                        </View>
                    </CardBody>
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F3F4F6' },

    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#E5E7EB' },
    backBtn: { padding: 4, marginRight: 12 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

    scrollContent: { padding: 16, paddingBottom: 40 },

    welcomeBox: { marginBottom: 20 },
    welcomeTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
    welcomeSub: { fontSize: 14, color: '#6B7280', marginTop: 4 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    statCardWrapper: { width: '48%', marginBottom: 12 },
    statCard: { backgroundColor: '#FFF', borderRadius: 8, padding: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
    statContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statTitle: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
    statValue: { fontSize: 22, fontWeight: 'bold', marginTop: 4 },
    iconBox: { padding: 8, borderRadius: 20 },

    cardSpacing: { marginBottom: 16 },
    cardHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },

    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#F3F4F6', paddingBottom: 12, marginBottom: 12 },
    statusText: { fontSize: 14, color: '#4B5563' },
    statusValueDark: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
    statusBadgeGreen: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    statusBadgeTextGreen: { color: '#16A34A', fontSize: 12, fontWeight: '600' },

    emptyActivity: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
    emptyActivityText: { color: '#6B7280', fontSize: 14, marginTop: 8 }
});
