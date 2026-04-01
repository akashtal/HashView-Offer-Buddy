import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';

export default function VendorProductsScreen() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalProducts, setTotalProducts] = useState(0);

    const fetchProducts = async (pageNum: number = 1, isLoadMore = false) => {
        try {
            if (isLoadMore) setIsLoadingMore(true);
            else setIsLoading(true);

            const res = await axios.get(`/api/products?vendorProducts=true&page=${pageNum}&limit=20`);
            const data = res.data;

            if (data?.data?.products) {
                if (isLoadMore) {
                    setProducts(prev => [...prev, ...data.data.products]);
                } else {
                    setProducts(data.data.products);
                }
                setPage(pageNum);
                setHasMore(data.data.pagination?.hasMore ?? false);
                setTotalProducts(data.data.pagination?.total ?? 0);
            }
        } catch (error) {
            console.error('Failed to load products:', error);
            Alert.alert('Error', 'Failed to load products');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'vendor') {
            router.push('/(tabs)/signin');
            return;
        }
        fetchProducts(1);
    }, [isAuthenticated, user, router]);

    const handleLoadMore = () => {
        if (!hasMore || isLoadingMore) return;
        fetchProducts(page + 1, true);
    };

    const handleDelete = (productId: string) => {
        Alert.alert(
            'Delete Product',
            'Are you sure you want to delete this product?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await axios.delete(`/api/products/${productId}`);
                            if (res.status === 200 || res.status === 204) {
                                setProducts(prev => prev.filter(p => p._id !== productId));
                                setTotalProducts(prev => prev - 1);
                            }
                        } catch (error) {
                            console.error('Failed to delete:', error);
                            Alert.alert('Error', 'Failed to delete product');
                        }
                    }
                }
            ]
        );
    };

    const handleToggleStatus = async (productId: string, currentStatus: boolean) => {
        try {
            const res = await axios.patch(`/api/products/${productId}`, { isActive: !currentStatus });
            if (res.status === 200) {
                setProducts(prev =>
                    prev.map(p => p._id === productId ? { ...p, isActive: !currentStatus } : p)
                );
            }
        } catch (error) {
            console.error('Failed to toggle status:', error);
            Alert.alert('Error', 'Failed to toggle status');
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.productCard}>
            <View style={styles.cardInfoRow}>
                <View style={styles.imageBox}>
                    {item.images?.[0] ? (
                        <Image source={{ uri: item.images[0] }} style={styles.image} />
                    ) : (
                        <Feather name="package" size={24} color="#9CA3AF" />
                    )}
                </View>
                <View style={styles.productDetails}>
                    <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.productDesc} numberOfLines={1}>{item.description}</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.discountedPrice}>₹{item.price?.discounted || item.price?.original}</Text>
                        {item.price?.discounted ? (
                            <Text style={styles.originalPrice}>₹{item.price.original}</Text>
                        ) : null}
                    </View>
                </View>
            </View>

            <View style={styles.badgesRow}>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{item.category?.name || 'Uncategorized'}</Text>
                </View>
                <View style={[styles.statusBadge, item.isActive ? styles.statusActive : styles.statusInactive]}>
                    <Text style={[styles.statusBadgeText, item.isActive ? styles.statusActiveText : styles.statusInactiveText]}>
                        {item.isActive ? 'Active' : 'Inactive'}
                    </Text>
                </View>
            </View>

            <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleStatus(item._id, item.isActive)}>
                    <Feather name={item.isActive ? "eye-off" : "eye"} size={16} color="#4B5563" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/vendor/products/${item._id}/edit`)}>
                    <Feather name="edit-2" size={16} color="#002B4E" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item._id)}>
                    <Feather name="trash-2" size={16} color="#DC2626" />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color="#002B4E" />
                <Text style={{ marginTop: 12, color: '#6B7280' }}>Loading products...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Feather name="arrow-left" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Products</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/vendor/products/new')}>
                    <Feather name="plus" size={16} color="#000" />
                    <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Total</Text>
                    <Text style={[styles.statValue, { color: '#111827' }]}>{totalProducts}</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Active</Text>
                    <Text style={[styles.statValue, { color: '#16A34A' }]}>{products.filter(p => p.isActive).length}</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Offers</Text>
                    <Text style={[styles.statValue, { color: '#F97316' }]}>
                        {products.filter(p => p.offer?.validUntil && new Date(p.offer.validUntil) > new Date()).length}
                    </Text>
                </View>
            </View>

            {products.length === 0 ? (
                <View style={styles.emptyState}>
                    <Feather name="package" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>No Products Yet</Text>
                    <Text style={styles.emptyDesc}>Start by adding your first product</Text>
                    <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/vendor/products/new')}>
                        <Feather name="plus" size={18} color="#000" />
                        <Text style={styles.emptyBtnText}>Add Product</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={isLoadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color="#002B4E" /> : null}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#E5E7EB' },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
    backBtn: { padding: 4, marginRight: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    addBtn: { backgroundColor: '#FDB913', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 4 },
    addBtnText: { color: '#000', fontSize: 13, fontWeight: 'bold' },

    statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
    statBox: { flex: 1, backgroundColor: '#FFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
    statLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
    statValue: { fontSize: 18, fontWeight: 'bold' },

    listContent: { paddingHorizontal: 16, paddingBottom: 24 },

    productCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardInfoRow: { flexDirection: 'row', marginBottom: 12 },
    imageBox: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
    image: { width: '100%', height: '100%' },
    productDetails: { flex: 1, justifyContent: 'center' },
    productTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
    productDesc: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    discountedPrice: { fontSize: 14, fontWeight: 'bold', color: '#002B4E' },
    originalPrice: { fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through' },

    badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#F3F4F6' },
    categoryBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    categoryBadgeText: { fontSize: 10, color: '#4B5563', fontWeight: '500' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    statusActive: { backgroundColor: '#DCFCE7' },
    statusInactive: { backgroundColor: '#F3F4F6' },
    statusBadgeText: { fontSize: 10, fontWeight: '600' },
    statusActiveText: { color: '#166534' },
    statusInactiveText: { color: '#4B5563' },

    actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    actionBtn: { padding: 6, backgroundColor: '#F9FAFB', borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB' },

    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 16, marginBottom: 8 },
    emptyDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
    emptyBtn: { backgroundColor: '#FDB913', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, gap: 8 },
    emptyBtnText: { color: '#000', fontSize: 15, fontWeight: 'bold' },
});
