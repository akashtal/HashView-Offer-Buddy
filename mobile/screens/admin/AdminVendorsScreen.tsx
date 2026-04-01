import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime } from '@/utils/utils';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';

export default function AdminVendorsScreen() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const { vendors, fetchVendors, approveVendor, rejectVendor, hardDeleteVendor, toggleVendorStatus, isLoading } = useAdminStore();

    const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Limits editing state
    const [limitsVendor, setLimitsVendor] = useState<any | null>(null);
    const [limitsForm, setLimitsForm] = useState({ maxSubcategories: '5', maxProductsPerSubcategory: '20' });
    const [savingLimits, setSavingLimits] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/(tabs)/signin');
        } else {
            fetchVendors();
        }
    }, [isAuthenticated, user, fetchVendors, router]);

    const filteredVendors = vendors.filter((v: any) => {
        const matchesFilter = filter === 'all'
            ? true
            : filter === 'pending' ? !v.isApproved : v.isApproved;

        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            v.shopName?.toLowerCase().includes(searchLower) ||
            v.contactInfo?.email?.toLowerCase().includes(searchLower) ||
            v.contactInfo?.phone?.includes(searchTerm);

        return matchesFilter && matchesSearch;
    });

    const handleApprove = async (id: string, name: string) => {
        Alert.alert(
            "Approve Vendor",
            `Are you sure you want to approve ${name}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Approve",
                    onPress: async () => {
                        try {
                            await approveVendor(id);
                        } catch (e: any) { Alert.alert("Error", e.message); }
                    }
                }
            ]
        );
    };

    const handleReject = async (id: string, name: string) => {
        Alert.alert(
            "Reject Vendor",
            `This will mark ${name} as rejected/inactive. Continue?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reject",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await rejectVendor(id);
                        } catch (e: any) { Alert.alert("Error", e.message); }
                    }
                }
            ]
        );
    };

    const handleHardDelete = (id: string, name: string) => {
        Alert.alert(
            'WARNING: Permanent Delete',
            `This will PERMANENTLY DELETE vendor ${name} and all their products. This action cannot be undone. Continue?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Permanently',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await hardDeleteVendor(id);
                        } catch (e: any) { Alert.alert("Error", e.message); }
                    }
                }
            ]
        );
    };

    const handleToggleStatus = (id: string, currentStatus: boolean, name: string) => {
        Alert.alert(
            currentStatus ? 'Suspend Vendor' : 'Activate Vendor',
            `Are you sure you want to ${currentStatus ? 'suspend' : 'activate'} ${name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            await toggleVendorStatus(id, !currentStatus);
                        } catch (e: any) { Alert.alert("Error", e.message); }
                    }
                }
            ]
        );
    };

    const handleLimitsStart = (vendor: any) => {
        setLimitsVendor(vendor);
        setLimitsForm({
            maxSubcategories: (vendor.limits?.maxSubcategories || 5).toString(),
            maxProductsPerSubcategory: (vendor.limits?.maxProductsPerSubcategory || 20).toString(),
        });
    };

    const handleLimitsSave = async () => {
        if (!limitsVendor) return;
        setSavingLimits(true);
        try {
            const maxSub = parseInt(limitsForm.maxSubcategories) || 5;
            const maxProd = parseInt(limitsForm.maxProductsPerSubcategory) || 20;

            const response = await fetch(`/api/admin/vendors/${limitsVendor._id}/limits`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ maxSubcategories: maxSub, maxProductsPerSubcategory: maxProd }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to update limits');

            await fetchVendors();
            setLimitsVendor(null);
            Alert.alert("Success", "Limits updated successfully");
        } catch (e: any) {
            Alert.alert("Error", e.message);
        } finally {
            setSavingLimits(false);
        }
    };

    if (!isAuthenticated || user?.role !== 'admin') {
        return <Loading fullScreen />;
    }

    if (isLoading && vendors.length === 0) return <Loading fullScreen text="Loading vendors..." />;

    const renderItem = ({ item }: { item: any }) => {
        const getStatusBadge = (v: any) => {
            if (!v.isActive) return { bg: '#FEF2F2', text: '#DC2626', label: 'Suspended' };
            if (v.isApproved) return { bg: '#DCFCE7', text: '#16A34A', label: 'Active' };
            return { bg: '#FFFBEB', text: '#D97706', label: 'Pending Approval' };
        };

        const status = getStatusBadge(item);

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <Text style={styles.shopName} numberOfLines={1}>{item.shopName}</Text>
                        <Text style={styles.joinedText}>Joined {formatRelativeTime(item.createdAt)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: status.text }]}>{status.label}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <View style={styles.infoCol}>
                        <Feather name="map-pin" size={12} color="#9CA3AF" />
                        <Text style={styles.infoText} numberOfLines={2}>
                            {item.location?.city ? `${item.location.city}, ` : ''}{item.location?.state ? `${item.location.state}` : 'No address'}
                        </Text>
                    </View>
                    <View style={styles.infoCol}>
                        <Feather name="phone" size={12} color="#9CA3AF" />
                        <Text style={styles.infoText}>{item.contactInfo?.phone || 'No phone'}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.actionsBox}>
                    <View style={styles.actionRowPrimary}>
                        {!item.isApproved && item.isActive && (
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }]} onPress={() => handleApprove(item._id, item.shopName)}>
                                <Feather name="check" size={14} color="#FFF" />
                                <Text style={styles.actionBtnTextSolid}>Approve</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.actionBtnOutline, { borderColor: '#D1D5DB' }]}
                            onPress={() => router.push(`/admin/vendor-detail?id=${item._id}`)} // Or where the detail/edit screen is
                        >
                            <Feather name="edit" size={14} color="#374151" />
                            <Text style={styles.actionBtnTextOutline}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionBtnOutline, { borderColor: '#D1D5DB' }]} onPress={() => handleLimitsStart(item)}>
                            <Feather name="settings" size={14} color="#374151" />
                            <Text style={styles.actionBtnTextOutline}>Limits</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.actionRowDanger}>
                        <TouchableOpacity
                            style={[styles.actionBtnOutline, { borderColor: item.isActive ? '#F59E0B' : '#10B981' }]}
                            onPress={() => handleToggleStatus(item._id, item.isActive, item.shopName)}
                        >
                            <Text style={[styles.actionBtnTextOutline, { color: item.isActive ? '#D97706' : '#059669' }]}>
                                {item.isActive ? 'Suspend' : 'Activate'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionBtnDanger} onPress={() => handleHardDelete(item._id, item.shopName)}>
                            <Feather name="trash-2" size={14} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Feather name="arrow-left" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Vendor Management</Text>
                </View>

                <View style={styles.searchFilterContainer}>
                    <View style={styles.searchBox}>
                        <Feather name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search vendors..."
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                            placeholderTextColor="#9CA3AF"
                        />
                        {searchTerm.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearSearch}>
                                <Feather name="x" size={16} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.filterTabs}>
                        <TouchableOpacity
                            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
                            onPress={() => setFilter('all')}
                        >
                            <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
                            onPress={() => setFilter('active')}
                        >
                            <Text style={[styles.filterTabText, filter === 'active' && { color: '#16A34A' }]}>Active</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
                            onPress={() => setFilter('pending')}
                        >
                            <Text style={[styles.filterTabText, filter === 'pending' && { color: '#D97706' }]}>Pending</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <FlatList
                data={filteredVendors}
                keyExtractor={item => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Feather name="shopping-bag" size={48} color="#D1D5DB" />
                        <Text style={styles.emptyText}>No vendors found.</Text>
                    </View>
                }
            />

            {/* Limits Modal */}
            <Modal visible={!!limitsVendor} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Limits: {limitsVendor?.shopName}</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Max Subcategories</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={limitsForm.maxSubcategories}
                                onChangeText={(val) => setLimitsForm(prev => ({ ...prev, maxSubcategories: val }))}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Max Products Per Subcategory</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={limitsForm.maxProductsPerSubcategory}
                                onChangeText={(val) => setLimitsForm(prev => ({ ...prev, maxProductsPerSubcategory: val }))}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <Button variant="ghost" onPress={() => setLimitsVendor(null)}>Cancel</Button>
                            <Button variant="primary" onPress={handleLimitsSave} isLoading={savingLimits}>Save</Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F3F4F6' },

    header: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#E5E7EB' },
    headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    backBtn: { padding: 4, marginRight: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

    searchFilterContainer: { gap: 12 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, height: 40 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: '#111827' },
    clearSearch: { padding: 4 },

    filterTabs: { flexDirection: 'row', backgroundColor: '#F9FAFB', padding: 4, borderRadius: 8, borderWidth: 1, borderColor: '#F3F4F6' },
    filterTab: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6 },
    filterTabActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    filterTabText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
    filterTabTextActive: { color: '#111827' },

    listContent: { padding: 16, paddingBottom: 40 },

    card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    cardHeaderLeft: { flex: 1, marginRight: 12 },
    shopName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
    joinedText: { fontSize: 12, color: '#6B7280' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusBadgeText: { fontSize: 11, fontWeight: '600' },

    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 12 },
    infoCol: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
    infoText: { fontSize: 12, color: '#4B5563', flex: 1 },

    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

    actionsBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    actionRowPrimary: { flexDirection: 'row', gap: 8 },
    actionRowDanger: { flexDirection: 'row', gap: 8 },

    actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, gap: 4 },
    actionBtnTextSolid: { color: '#FFF', fontSize: 12, fontWeight: '500' },

    actionBtnOutline: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, backgroundColor: '#FFF', gap: 4 },
    actionBtnTextOutline: { color: '#374151', fontSize: 12, fontWeight: '500' },

    actionBtnDanger: { backgroundColor: '#EF4444', padding: 8, borderRadius: 6 },

    emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { color: '#6B7280', fontSize: 14, marginTop: 12 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
    modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, width: '100%', maxWidth: 400 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
    modalInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, color: '#111827' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
});
