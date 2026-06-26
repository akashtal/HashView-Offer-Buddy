import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, Linking } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import axios from 'axios';

type KYCFilter = 'all' | 'pending' | 'approved' | 'rejected';

interface Store {
    _id: string;
    shopName: string;
    vendorId?: { name?: string; email?: string; phone?: string };
    category?: { name?: string };
    kycDocuments?: {
        idProof?: { url: string; type: string; uploadedAt: string };
        businessDocument?: { url: string; type: string; uploadedAt: string };
        status: string;
        reviewedAt?: string;
        rejectionReason?: string;
    };
    createdAt: string;
}

export default function AdminVendorKYCScreen() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    const [vendors, setVendors] = useState<Store[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<KYCFilter>('pending');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectModal, setRejectModal] = useState<{ storeId: string; shopName: string } | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const loadVendors = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`/api/admin/vendors/kyc?status=${filter}`);
            setVendors(res.data?.data || []);
        } catch (error) {
            console.error('Failed to load vendors:', error);
            // Alert.alert('Error', 'Failed to load KYC data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/(tabs)/signin');
        } else {
            loadVendors();
        }
    }, [isAuthenticated, user, router, filter]);

    const handleApprove = (storeId: string, shopName: string) => {
        Alert.alert(
            "Approve KYC",
            `Approve KYC documents for ${shopName}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Approve",
                    onPress: async () => {
                        setActionLoading(storeId);
                        try {
                            await axios.post(`/api/admin/vendors/${storeId}/kyc/approve`);
                            Alert.alert('Success', 'KYC Approved');
                            loadVendors();
                        } catch (error: any) {
                            Alert.alert('Error', error.response?.data?.error || error.message);
                        } finally {
                            setActionLoading(null);
                        }
                    }
                }
            ]
        );
    };

    const handleRejectConfirm = async () => {
        if (!rejectModal || !rejectReason.trim()) {
            Alert.alert('Validation Error', 'Please provide a rejection reason');
            return;
        }
        setActionLoading(rejectModal.storeId);
        try {
            await axios.post(`/api/admin/vendors/${rejectModal.storeId}/kyc/reject`, { reason: rejectReason });
            Alert.alert('Success', 'KYC Rejected');
            setRejectModal(null);
            setRejectReason('');
            loadVendors();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const getDocTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            aadhaar: 'Aadhaar Card',
            pan: 'PAN Card',
            voter_id: 'Voter ID',
            passport: 'Passport',
            gst_certificate: 'GST Certificate',
            trade_license: 'Trade License',
            udyam: 'Udyam Registration',
            other: 'Other Document',
        };
        return labels[type] || type;
    };

    const openLink = (url: string) => {
        Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open document link"));
    };

    if (!isAuthenticated || user?.role !== 'admin') {
        return <Loading fullScreen />;
    }

    const renderItem = ({ item }: { item: Store }) => {
        const kycStatus = item.kycDocuments?.status;
        const isPending = kycStatus === 'pending';

        return (
            <Card style={styles.card}>
                <CardHeader>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.shopTitle} numberOfLines={1}>{item.shopName}</Text>
                        <View style={[styles.badge,
                        kycStatus === 'approved' ? styles.badgeSuccess :
                            kycStatus === 'rejected' ? styles.badgeDanger :
                                styles.badgeWarning]}>
                            <Text style={[styles.badgeText,
                            kycStatus === 'approved' ? styles.badgeTextSuccess :
                                kycStatus === 'rejected' ? styles.badgeTextDanger :
                                    styles.badgeTextWarning]}>
                                {kycStatus === 'approved' ? 'Approved' : kycStatus === 'rejected' ? 'Rejected' : kycStatus === 'pending' ? 'Pending' : 'Not Submitted'}
                            </Text>
                        </View>
                    </View>
                </CardHeader>
                <CardBody>
                    <View style={styles.infoRow}>
                        <View style={styles.infoCol}>
                            <Text style={styles.infoLabel}>Owner:</Text>
                            <Text style={styles.infoValue}>{item.vendorId?.name || 'N/A'}</Text>
                        </View>
                        <View style={styles.infoCol}>
                            <Text style={styles.infoLabel}>Phone:</Text>
                            <Text style={styles.infoValue}>{item.vendorId?.phone || 'N/A'}</Text>
                        </View>
                        <View style={styles.infoCol}>
                            <Text style={styles.infoLabel}>Category:</Text>
                            <Text style={styles.infoValue}>{item.category?.name || 'N/A'}</Text>
                        </View>
                    </View>

                    <Text style={styles.docSectionTitle}>Documents</Text>

                    {/* ID Proof */}
                    <View style={styles.docRow}>
                        <Feather name="file-text" size={20} color="#3B82F6" />
                        <View style={styles.docInfo}>
                            <Text style={styles.docTitle}>ID Proof</Text>
                            {item.kycDocuments?.idProof?.url ? (
                                <Text style={styles.docSubType}>{getDocTypeLabel(item.kycDocuments.idProof.type)}</Text>
                            ) : (
                                <Text style={styles.docMissing}>Not uploaded</Text>
                            )}
                        </View>
                        {item.kycDocuments?.idProof?.url && (
                            <TouchableOpacity onPress={() => openLink(item.kycDocuments!.idProof!.url!)} style={styles.viewBtn}>
                                <Text style={styles.viewBtnText}>View</Text>
                                <Feather name="external-link" size={14} color="#002B4E" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Business Doc */}
                    <View style={styles.docRow}>
                        <Feather name="file-text" size={20} color="#10B981" />
                        <View style={styles.docInfo}>
                            <Text style={styles.docTitle}>Business Document</Text>
                            {item.kycDocuments?.businessDocument?.url ? (
                                <Text style={styles.docSubType}>{getDocTypeLabel(item.kycDocuments.businessDocument.type)}</Text>
                            ) : (
                                <Text style={styles.docMissing}>Not uploaded</Text>
                            )}
                        </View>
                        {item.kycDocuments?.businessDocument?.url && (
                            <TouchableOpacity onPress={() => openLink(item.kycDocuments!.businessDocument!.url!)} style={styles.viewBtn}>
                                <Text style={styles.viewBtnText}>View</Text>
                                <Feather name="external-link" size={14} color="#002B4E" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {item.kycDocuments?.rejectionReason && (
                        <View style={styles.rejectionBox}>
                            <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
                            <Text style={styles.rejectionText}>{item.kycDocuments.rejectionReason}</Text>
                        </View>
                    )}

                    {isPending && (
                        <View style={styles.actionRow}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Button
                                    variant="outline"
                                    onPress={() => setRejectModal({ storeId: item._id, shopName: item.shopName })}
                                    disabled={actionLoading === item._id}
                                    style={{ borderColor: '#EF4444' }}
                                >
                                    Reject
                                </Button>
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Button
                                    variant="primary"
                                    onPress={() => handleApprove(item._id, item.shopName)}
                                    isLoading={actionLoading === item._id}
                                    style={{ backgroundColor: '#10B981' }}
                                >
                                    Approve
                                </Button>
                            </View>
                        </View>
                    )}
                </CardBody>
            </Card>
        );
    };

    return (
        <View style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerTitle}>KYC Verification</Text>
                        <Text style={styles.headerSub}>Review and verify documents</Text>
                    </View>
                </View>

                {/* Filter Tabs */}
                <View style={styles.filterTabs}>
                    {(['pending', 'all', 'approved', 'rejected'] as KYCFilter[]).map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterTab, filter === f && styles.filterTabActive]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#002B4E" />
                    <Text style={styles.loadingText}>Loading KYC data...</Text>
                </View>
            ) : (
                <FlashList
                    data={vendors}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Feather name="file-text" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No vendors match the selected filter</Text>
                        </View>
                    }
                />
            )}

            {/* Reject Modal */}
            <Modal visible={!!rejectModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Reject KYC</Text>
                        <Text style={styles.modalDesc}>
                            Please provide a reason for rejecting {rejectModal?.shopName}&apos;s KYC documents.
                        </Text>

                        <TextInput
                            style={styles.textArea}
                            value={rejectReason}
                            onChangeText={setRejectReason}
                            placeholder="Enter rejection reason..."
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />

                        <View style={styles.modalActions}>
                            <View style={{ flex: 1, marginRight: 6 }}>
                                <Button variant="ghost" onPress={() => setRejectModal(null)}>Cancel</Button>
                            </View>
                            <View style={{ flex: 1, marginLeft: 6 }}>
                                <Button
                                    variant="primary"
                                    onPress={handleRejectConfirm}
                                    isLoading={actionLoading === rejectModal?.storeId}
                                    style={{ backgroundColor: '#EF4444' }}
                                >
                                    Confirm Reject
                                </Button>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F3F4F6' },

    header: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#E5E7EB' },
    headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    headerSub: { fontSize: 12, color: '#6B7280' },

    filterTabs: { flexDirection: 'row', backgroundColor: '#F9FAFB', padding: 4, borderRadius: 8, borderWidth: 1, borderColor: '#F3F4F6' },
    filterTab: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6 },
    filterTabActive: { backgroundColor: '#002B4E', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    filterTabText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
    filterTabTextActive: { color: '#FFF' },

    loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#6B7280' },

    listContent: { padding: 16, paddingBottom: 40 },

    card: { marginBottom: 16 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    shopTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', flex: 1, marginRight: 8 },

    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeSuccess: { backgroundColor: '#DCFCE7' },
    badgeDanger: { backgroundColor: '#FEF2F2' },
    badgeWarning: { backgroundColor: '#FFFBEB' },
    badgeText: { fontSize: 11, fontWeight: '600' },
    badgeTextSuccess: { color: '#16A34A' },
    badgeTextDanger: { color: '#DC2626' },
    badgeTextWarning: { color: '#D97706' },

    infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
    infoCol: { width: '45%' },
    infoLabel: { fontSize: 11, color: '#6B7280', marginBottom: 2 },
    infoValue: { fontSize: 13, color: '#111827', fontWeight: '500' },

    docSectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#374151', marginBottom: 8, borderTopWidth: 1, borderColor: '#F3F4F6', paddingTop: 12 },

    docRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#F3F4F6' },
    docInfo: { flex: 1, marginLeft: 12 },
    docTitle: { fontSize: 13, fontWeight: '600', color: '#111827' },
    docSubType: { fontSize: 11, color: '#6B7280' },
    docMissing: { fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' },
    viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
    viewBtnText: { fontSize: 12, color: '#002B4E', fontWeight: '600' },

    rejectionBox: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA', marginTop: 4, marginBottom: 12 },
    rejectionLabel: { fontSize: 12, fontWeight: 'bold', color: '#B91C1C', marginBottom: 2 },
    rejectionText: { fontSize: 13, color: '#991B1B' },

    actionRow: { flexDirection: 'row', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderColor: '#F3F4F6' },

    emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { color: '#6B7280', fontSize: 14, marginTop: 12 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
    modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, width: '100%', maxWidth: 400 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
    modalDesc: { fontSize: 14, color: '#4B5563', marginBottom: 16 },
    textArea: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 14, color: '#111827', minHeight: 100, marginBottom: 16, backgroundColor: '#F9FAFB' },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
});
