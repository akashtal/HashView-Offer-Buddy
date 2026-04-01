import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useVendorStore } from '@/store/vendorStore';
import { useChatStore } from '@/store/chatStore';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';

const { width } = Dimensions.get('window');

// Formatting util map
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function VendorDashboardScreen() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const { activeConversationId } = useChatStore();
    const {
        myVendorProfile,
        myProducts,
        myAnalytics,
        isLoading,
        error,
        fetchMyProfile,
        deleteProduct
    } = useVendorStore();

    const { tab } = useLocalSearchParams();
    const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'analytics' | 'messages'>('overview');

    useEffect(() => {
        if (tab && ['overview', 'products', 'analytics', 'messages'].includes(tab as string)) {
            setActiveTab(tab as any);
        }
    }, [tab]);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'vendor') {
            router.push('/(tabs)/signin');
            return;
        }
        fetchMyProfile();
    }, [isAuthenticated, user, fetchMyProfile, router]);

    useEffect(() => {
        if (error === 'Vendor profile not found' || error?.includes('not found')) {
            router.push('/vendor/onboarding');
        }
    }, [error, router]);

    if (isLoading || !myVendorProfile) {
        return (
            <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
        );
    }

    const stats = [
        { label: 'Total Products', value: myVendorProfile.analytics?.totalProducts || 0, icon: "package", color: '#2563EB', bgColor: '#DBEAFE' },
        { label: 'Total Views', value: myVendorProfile.analytics?.totalViews || 0, icon: "eye", color: '#16A34A', bgColor: '#DCFCE7' },
        { label: 'Total Contacts', value: myVendorProfile.analytics?.totalContacts || 0, icon: "phone", color: '#9333EA', bgColor: '#F3E8FF' },
        { label: 'Shop Rating', value: myVendorProfile.rating?.toFixed(1) || 'N/A', icon: "trending-up", color: '#CA8A04', bgColor: '#FEF08A' },
    ];

    const handleDeleteProduct = (productId: string) => {
        Alert.alert(
            "Delete Product",
            "Are you sure you want to delete this product?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteProduct(productId);
                        } catch (err) {
                            Alert.alert("Error", "Failed to delete product");
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.headerBox}>
                <View style={styles.headerContent}>
                    <View style={styles.headerInfoRow}>
                        {myVendorProfile.shopLogo ? (
                            <Image source={{ uri: myVendorProfile.shopLogo }} style={styles.shopLogoImg} />
                        ) : (
                            <View style={styles.shopLogoFallback}>
                                <Text style={styles.shopLogoFallbackTxt}>{myVendorProfile.shopName?.[0]}</Text>
                            </View>
                        )}
                        <View style={styles.headerTextCol}>
                            <Text style={styles.headerShopName} numberOfLines={1}>{myVendorProfile.shopName}</Text>
                            <View style={styles.headerBadges}>
                                <View style={[styles.badge, myVendorProfile.isApproved ? styles.badgeSuccess : styles.badgeWarning]}>
                                    <Text style={[styles.badgeTxt, myVendorProfile.isApproved ? styles.badgeTxtSuccess : styles.badgeTxtWarning]}>
                                        {myVendorProfile.isApproved ? 'Approved' : 'Pending Approval'}
                                    </Text>
                                </View>
                                <View style={[styles.badge, myVendorProfile.isActive ? styles.badgeSuccess : styles.badgeDanger]}>
                                    <Text style={[styles.badgeTxt, myVendorProfile.isActive ? styles.badgeTxtSuccess : styles.badgeTxtDanger]}>
                                        {myVendorProfile.isActive ? 'Active' : 'Inactive'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.headerActionsRow}>
                        <TouchableOpacity onPress={() => router.push(`/vendors/${myVendorProfile._id}` as any)} style={styles.headerBtnOutline}>
                            <Text style={styles.headerBtnOutlineTxt}>View Public Profile</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/vendor/settings')} style={styles.headerBtnPrimary}>
                            <Feather name="edit" size={14} color="#FFF" style={{ marginRight: 4 }} />
                            <Text style={styles.headerBtnPrimaryTxt}>Edit Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Approval Warning */}
                {!myVendorProfile.isApproved && (
                    <View style={styles.warningBox}>
                        <Text style={styles.warningTxt}>
                            ⚠️ Your vendor account is pending approval. You can add products, but they won't be visible to users until your account is approved by an admin.
                        </Text>
                    </View>
                )}

                {/* Stats Cards */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScrollContent}>
                    {stats.map((stat, idx) => (
                        <View key={stat.label} style={[styles.statCard, { marginRight: idx === stats.length - 1 ? 0 : 12 }]}>
                            <View style={styles.statContent}>
                                <View style={styles.statLeft}>
                                    <Text style={styles.statLabel}>{stat.label}</Text>
                                    <Text style={styles.statValue}>{stat.value}</Text>
                                </View>
                                <View style={[styles.statIconBox, { backgroundColor: stat.bgColor }]}>
                                    <Feather name={stat.icon as any} size={20} color={stat.color} />
                                </View>
                            </View>
                        </View>
                    ))}
                </ScrollView>

                {/* Tabs */}
                <View style={styles.tabsWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {[
                            { id: 'overview', label: 'Overview' },
                            { id: 'products', label: `Products (${myProducts.length})` },
                            { id: 'analytics', label: 'Analytics' },
                            { id: 'messages', label: 'Messages' },
                        ].map((t) => (
                            <TouchableOpacity
                                key={t.id}
                                onPress={() => setActiveTab(t.id as any)}
                                style={[styles.tabBtn, activeTab === t.id && styles.activeTabBtn]}
                            >
                                <Text style={[styles.tabBtnTxt, activeTab === t.id && styles.activeTabBtnTxt]}>{t.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Content */}
                <View style={styles.tabContentArea}>

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <View style={styles.gap16}>
                            <View style={styles.card}>
                                <Text style={styles.cardHeaderTxt}>Quick Actions</Text>
                                <View style={styles.quickActionsGrid}>
                                    <TouchableOpacity onPress={() => router.push('/vendor/products/new')} style={styles.qaBtnPrimary}>
                                        <Feather name="plus" size={16} color="#FFF" />
                                        <Text style={styles.qaBtnPrimaryTxt}>Add New Product</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => router.push('/vendor/settings')} style={styles.qaBtnOutline}>
                                        <Feather name="edit" size={16} color="#4F46E5" />
                                        <Text style={styles.qaBtnOutlineTxt}>Edit Shop Profile</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {myAnalytics?.topProducts && myAnalytics.topProducts.length > 0 && (
                                <View style={styles.card}>
                                    <Text style={styles.cardHeaderTxt}>Top Performing Products</Text>
                                    <View style={styles.gap12}>
                                        {myAnalytics.topProducts.map((p: any) => (
                                            <View key={p._id} style={styles.topProdRow}>
                                                <Image source={{ uri: p.images?.[0] || 'https://via.placeholder.com/100' }} style={styles.topProdImg} />
                                                <View style={styles.topProdInfo}>
                                                    <Text style={styles.topProdTitle} numberOfLines={1}>{p.title}</Text>
                                                    <View style={styles.topProdMetaRow}>
                                                        <View style={styles.metaRowItem}>
                                                            <Feather name="eye" size={12} color="#6B7280" />
                                                            <Text style={styles.metaRowText}>{p.analytics?.views || 0} views</Text>
                                                        </View>
                                                        <View style={styles.metaRowItem}>
                                                            <Feather name="phone" size={12} color="#6B7280" />
                                                            <Text style={styles.metaRowText}>{p.analytics?.contacts || 0} contacts</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                                <TouchableOpacity onPress={() => router.push(`/vendor/products/${p._id}/edit`)} style={styles.topProdEditBtn}>
                                                    <Feather name="edit" size={16} color="#6B7280" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* PRODUCTS TAB */}
                    {activeTab === 'products' && (
                        <View>
                            <View style={styles.prodsHeaderRow}>
                                <Text style={styles.prodsHeaderTxt}>Your Products</Text>
                                <TouchableOpacity onPress={() => router.push('/vendor/products/new')} style={styles.headerBtnPrimary}>
                                    <Feather name="plus" size={14} color="#FFF" style={{ marginRight: 4 }} />
                                    <Text style={styles.headerBtnPrimaryTxt}>Add Product</Text>
                                </TouchableOpacity>
                            </View>

                            {myProducts.length === 0 ? (
                                <View style={styles.emptyCard}>
                                    <Feather name="package" size={48} color="#9CA3AF" />
                                    <Text style={styles.emptyCardHdr}>No products yet</Text>
                                    <Text style={styles.emptyCardSub}>Start by adding your first product or offer</Text>
                                    <TouchableOpacity onPress={() => router.push('/vendor/products/new')} style={[styles.qaBtnPrimary, { marginTop: 16 }]}>
                                        <Feather name="plus" size={16} color="#FFF" />
                                        <Text style={styles.qaBtnPrimaryTxt}>Add Your First Product</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.prodsGrid}>
                                    {myProducts.map((product: any) => (
                                        <View key={product._id} style={styles.prodCard}>
                                            <View style={styles.prodCardImgBox}>
                                                <Image source={{ uri: product.images?.[0] || 'https://via.placeholder.com/200' }} style={styles.prodCardImg} />
                                                {!product.isActive && (
                                                    <View style={styles.prodInactiveOverlay}>
                                                        <View style={[styles.badge, styles.badgeWarning]}><Text style={[styles.badgeTxt, styles.badgeTxtWarning]}>Inactive</Text></View>
                                                    </View>
                                                )}
                                            </View>
                                            <View style={styles.prodCardBody}>
                                                <Text style={styles.prodCardTitle} numberOfLines={2}>{product.title}</Text>
                                                {product.price && (
                                                    <Text style={styles.prodCardPrice}>
                                                        {formatCurrency(product.price.discounted || product.price.original)}
                                                    </Text>
                                                )}
                                                <View style={styles.prodCardMeta}>
                                                    <View style={styles.metaRowItem}>
                                                        <Feather name="eye" size={14} color="#6B7280" />
                                                        <Text style={styles.metaRowText}>{product.analytics?.views || 0}</Text>
                                                    </View>
                                                    <View style={styles.metaRowItem}>
                                                        <Feather name="phone" size={14} color="#6B7280" />
                                                        <Text style={styles.metaRowText}>{product.analytics?.contacts || 0}</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.prodCardActions}>
                                                    <TouchableOpacity onPress={() => router.push(`/vendor/products/${product._id}/edit`)} style={[styles.qaBtnOutline, { flex: 1, paddingVertical: 8 }]}>
                                                        <Feather name="edit" size={14} color="#4F46E5" />
                                                        <Text style={[styles.qaBtnOutlineTxt, { fontSize: 13 }]}>Edit</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => handleDeleteProduct(product._id)} style={styles.prodCardDelBtn}>
                                                        <Feather name="trash-2" size={18} color="#DC2626" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {/* ANALYTICS TAB */}
                    {activeTab === 'analytics' && myAnalytics && (
                        <View style={styles.gap16}>
                            {/* LineCharts are not supported nativly without extra libs. Using a simple text-based fallback to preserve logic and data without breaking builds */}
                            <View style={styles.card}>
                                <Text style={styles.cardHeaderTxt}>Views Over Time</Text>
                                <View style={styles.analyticsList}>
                                    {myAnalytics.viewsData?.map((item: any, idx: number) => (
                                        <View key={idx} style={styles.analyticsListItem}>
                                            <Text style={styles.analyticsListDate}>{item.date}</Text>
                                            <Text style={styles.analyticsListValue}>{item.views} Views</Text>
                                        </View>
                                    ))}
                                    {(!myAnalytics.viewsData || myAnalytics.viewsData.length === 0) && (
                                        <Text style={styles.noDataText}>No views data available.</Text>
                                    )}
                                </View>
                            </View>

                            <View style={styles.card}>
                                <Text style={styles.cardHeaderTxt}>Contacts Over Time</Text>
                                <View style={styles.analyticsList}>
                                    {myAnalytics.contactsData?.map((item: any, idx: number) => (
                                        <View key={idx} style={styles.analyticsListItem}>
                                            <Text style={styles.analyticsListDate}>{item.date}</Text>
                                            <Text style={styles.analyticsListValue}>{item.contacts} Contacts</Text>
                                        </View>
                                    ))}
                                    {(!myAnalytics.contactsData || myAnalytics.contactsData.length === 0) && (
                                        <Text style={styles.noDataText}>No contacts data available.</Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    )}

                    {/* MESSAGES TAB */}
                    {activeTab === 'messages' && (
                        <View style={styles.messagesContainer}>
                            {/* If activeConversationId is present, we show ChatWindow, else ChatList. Simple mobile view logic mapping */}
                            {activeConversationId ? (
                                <View style={styles.flx1}>
                                    <ChatWindow />
                                </View>
                            ) : (
                                <View style={styles.flx1}>
                                    <ChatList />
                                </View>
                            )}
                        </View>
                    )}

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14, color: '#4B5563' },

    headerBox: { backgroundColor: '#1E293B', paddingTop: 24, paddingBottom: 24, paddingHorizontal: 16 },
    headerContent: { flex: 1 },
    headerInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    shopLogoImg: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF' },
    shopLogoFallback: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#3730A3', justifyContent: 'center', alignItems: 'center' },
    shopLogoFallbackTxt: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
    headerTextCol: { marginLeft: 16, flex: 1 },
    headerShopName: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
    headerBadges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    badgeSuccess: { backgroundColor: '#DCFCE7' },
    badgeWarning: { backgroundColor: '#FEF08A' },
    badgeDanger: { backgroundColor: '#FEE2E2' },
    badgeTxt: { fontSize: 10, fontWeight: 'bold' },
    badgeTxtSuccess: { color: '#16A34A' },
    badgeTxtWarning: { color: '#CA8A04' },
    badgeTxtDanger: { color: '#DC2626' },
    headerActionsRow: { flexDirection: 'row', gap: 12 },
    headerBtnOutline: { flex: 1, borderWidth: 1, borderColor: '#FFF', borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
    headerBtnOutlineTxt: { color: '#FFF', fontWeight: '500', fontSize: 13 },
    headerBtnPrimary: { flex: 1, flexDirection: 'row', backgroundColor: '#4F46E5', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
    headerBtnPrimaryTxt: { color: '#FFF', fontWeight: '500', fontSize: 13 },

    scrollContent: { paddingVertical: 16 },
    warningBox: { backgroundColor: '#FEFCE8', borderWidth: 1, borderColor: '#FEF08A', marginHorizontal: 16, padding: 16, borderRadius: 8, marginBottom: 16 },
    warningTxt: { color: '#854D0E', fontWeight: '500', fontSize: 13, lineHeight: 20 },

    statsScrollContent: { paddingHorizontal: 16, paddingBottom: 16 },
    statCard: { width: width * 0.6, backgroundColor: '#FFF', borderRadius: 8, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    statContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statLeft: { flex: 1 },
    statLabel: { fontSize: 12, color: '#4B5563', marginBottom: 4 },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
    statIconBox: { width: 48, height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

    tabsWrapper: { borderBottomWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, marginBottom: 16 },
    tabBtn: { paddingVertical: 12, marginRight: 24, borderBottomWidth: 2, borderColor: 'transparent' },
    activeTabBtn: { borderColor: '#4F46E5' },
    tabBtnTxt: { fontSize: 14, fontWeight: '500', color: '#4B5563' },
    activeTabBtnTxt: { color: '#4F46E5' },

    tabContentArea: { paddingHorizontal: 16 },
    gap16: { gap: 16 },
    gap12: { gap: 12 },
    card: { backgroundColor: '#FFF', borderRadius: 8, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    cardHeaderTxt: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 16 },
    quickActionsGrid: { flexDirection: 'row', gap: 12 },
    qaBtnPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5', paddingVertical: 10, borderRadius: 6, gap: 6 },
    qaBtnPrimaryTxt: { color: '#FFF', fontWeight: '500', fontSize: 13 },
    qaBtnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#4F46E5', backgroundColor: '#EEF2FF', paddingVertical: 10, borderRadius: 6, gap: 6 },
    qaBtnOutlineTxt: { color: '#4F46E5', fontWeight: '500', fontSize: 13 },

    topProdRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8 },
    topProdImg: { width: 56, height: 56, borderRadius: 6, backgroundColor: '#E5E7EB', marginRight: 12 },
    topProdInfo: { flex: 1 },
    topProdTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 6 },
    topProdMetaRow: { flexDirection: 'row', gap: 12 },
    metaRowItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaRowText: { fontSize: 12, color: '#4B5563' },
    topProdEditBtn: { padding: 8 },

    prodsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    prodsHeaderTxt: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
    emptyCard: { backgroundColor: '#FFF', padding: 32, alignItems: 'center', borderRadius: 8 },
    emptyCardHdr: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginTop: 16, marginBottom: 8 },
    emptyCardSub: { fontSize: 14, color: '#4B5563', textAlign: 'center' },
    prodsGrid: { gap: 16 },
    prodCard: { backgroundColor: '#FFF', borderRadius: 8, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    prodCardImgBox: { height: 160, backgroundColor: '#F3F4F6', position: 'relative' },
    prodCardImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    prodInactiveOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    prodCardBody: { padding: 16 },
    prodCardTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 8 },
    prodCardPrice: { fontSize: 18, fontWeight: 'bold', color: '#4F46E5', marginBottom: 12 },
    prodCardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    prodCardActions: { flexDirection: 'row', gap: 12 },
    prodCardDelBtn: { padding: 8, justifyContent: 'center', alignItems: 'center' },

    analyticsList: { borderTopWidth: 1, borderColor: '#F3F4F6' },
    analyticsListItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F3F4F6' },
    analyticsListDate: { fontSize: 14, color: '#4B5563' },
    analyticsListValue: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
    noDataText: { paddingVertical: 16, color: '#6B7280', fontSize: 13, textAlign: 'center' },

    messagesContainer: { height: Dimensions.get('window').height * 0.6, backgroundColor: '#FFF', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
    flx1: { flex: 1 },
});
