import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';
import { formatRelativeTime } from '@/utils/utils';

export default function AdminProductsScreen() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    const [products, setProducts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalProducts, setTotalProducts] = useState(0);

    const fetchProducts = async (pageNum: number = 1, isLoadMore = false) => {
        try {
            if (isLoadMore) setIsLoadingMore(true);
            else setIsLoading(true);

            // Fetching all products for admin
            const res = await axios.get(`/api/products?page=${pageNum}&limit=20`);
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
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/(tabs)/signin');
            return;
        }
        fetchProducts(1);
    }, [isAuthenticated, user, router]);

    const handleLoadMore = () => {
        if (!hasMore || isLoadingMore || searchTerm) return; // Disable load more during search for now
        fetchProducts(page + 1, true);
    };

    const handleDelete = (productId: string, productTitle: string) => {
        Alert.alert(
            'Delete Product',
            `Are you sure you want to delete "${productTitle}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`/api/products/${productId}`);
                            setProducts(prev => prev.filter(p => p._id !== productId));
                            setTotalProducts(prev => prev - 1);
                        } catch (error) {
                            console.error('Failed to delete:', error);
                            Alert.alert('Error', 'Failed to delete product');
                        }
                    }
                }
            ]
        );
    };

    // Client-side filtering
    const filteredProducts = products.filter((p: any) =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.productCard}>
            <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: '#F3F4F6' }]}>
                    <Text style={styles.badgeText}>{item.category?.name || 'Uncategorized'}</Text>
                </View>
                <Text style={styles.timeText}>{formatRelativeTime(item.createdAt)}</Text>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.imageBox}>
                    {item.images?.[0] ? (
                        <Image source={{ uri: item.images[0] }} style={styles.image} />
                    ) : (
                        <Feather name="package" size={24} color="#9CA3AF" />
                    )}
                </View>
                <View style={styles.productInfo}>
                    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.vendorName} numberOfLines={1}>{item.vendorId?.shopName || 'Unknown Vendor'}</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.discountedPrice}>₹{item.price?.discounted || item.price?.original}</Text>
                        {item.price?.discounted ? (
                            <Text style={styles.originalPrice}>₹{item.price.original}</Text>
                        ) : null}
                    </View>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleDelete(item._id, item.title)} style={styles.delBtn}>
                        <Feather name="trash-2" size={16} color="#DC2626" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    if (isLoading && products.length === 0) {
        return (
            <View style={styles.safeArea}>
            <ActivityIndicator size="large" color="#002B4E" />
            <Text style={styles.loadingText}>Loading products...</Text>
        </View>
        );
    }

    return (
        <View style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>Product Management</Text>
                </View>

                <View style={styles.searchBox}>
                    <Feather name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search products..."
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
                <Text style={styles.statsText}>
                    Showing {filteredProducts.length} of {totalProducts} products
                </Text>
            </View>

            <FlatList
                data={filteredProducts}
                keyExtractor={item => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Feather name="package" size={48} color="#D1D5DB" />
                        <Text style={styles.emptyText}>No products found {searchTerm && `matching "${searchTerm}"`}</Text>
                    </View>
                }
                ListFooterComponent={isLoadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color="#002B4E" /> : null}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
    loadingText: { marginTop: 12, color: '#6B7280' },

    header: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#E5E7EB' },
    headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, height: 40, marginBottom: 8 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: '#111827' },
    clearSearch: { padding: 4 },
    statsText: { fontSize: 12, color: '#6B7280' },

    listContent: { padding: 16, paddingBottom: 40 },

    productCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderColor: '#F3F4F6' },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    badgeText: { fontSize: 10, color: '#4B5563', fontWeight: '500' },
    timeText: { fontSize: 11, color: '#9CA3AF' },

    cardBody: { flexDirection: 'row', alignItems: 'center' },
    imageBox: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
    image: { width: '100%', height: '100%' },
    productInfo: { flex: 1 },
    title: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
    vendorName: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    discountedPrice: { fontSize: 13, fontWeight: 'bold', color: '#002B4E' },
    originalPrice: { fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through' },

    actions: { marginLeft: 12 },
    delBtn: { padding: 8, backgroundColor: '#FEF2F2', borderRadius: 8 },

    emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { color: '#6B7280', fontSize: 14, marginTop: 12 }
});
