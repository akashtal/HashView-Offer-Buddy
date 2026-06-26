import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';

// Design system components (will be converted to RN in components phase)
import ProductCard from '@/components/products/ProductCard';
import ProductCardSkeleton from '@/components/products/ProductCardSkeleton';
import ComprehensiveFilters, { FilterOptions } from '@/components/ui/ComprehensiveFilters';
import FilterChips from '@/components/ui/FilterChips';

export default function ProductListScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ category?: string; query?: string; hasOffer?: string; minPrice?: string; maxPrice?: string }>();

    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState<FilterOptions>({
        category: params.category || '',
        query: params.query || '',
        minPrice: params.minPrice ? Number(params.minPrice) : undefined,
        maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
        hasOffer: params.hasOffer === 'true',
        sortBy: 'newest'
    });
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchProducts = async (reset = false) => {
        try {
            const pageNum = reset ? 1 : page;
            const queryParams: any = { page: pageNum, limit: 20 };
            if (filters.category) queryParams.category = filters.category;
            if (filters.query) queryParams.query = filters.query;
            if (filters.hasOffer) queryParams.hasOffer = filters.hasOffer;
            if (filters.minPrice) queryParams.minPrice = filters.minPrice;
            if (filters.maxPrice) queryParams.maxPrice = filters.maxPrice;

            const res = await axios.get('/api/products', { params: queryParams });
            const data = res.data.data;
            const newProducts = data.products || [];

            if (reset) {
                setProducts(newProducts);
                setPage(2);
            } else {
                setProducts(prev => [...prev, ...newProducts]);
                setPage(prev => prev + 1);
            }
            setHasMore(data.pagination?.hasMore || false);
        } catch (err) {
            console.error('Failed to load products', err);
        } finally {
            setIsLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        const loadAll = async () => {
            try {
                const catRes = await axios.get('/api/categories?parentOnly=true');
                setCategories(catRes.data.data.categories || []);
            } catch (e) {}
            fetchProducts(true);
        };
        loadAll();
    }, []);

    useEffect(() => {
        setIsLoading(true);
        setPage(1);
        fetchProducts(true);
    }, [filters]);

    const loadMore = () => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        fetchProducts(false);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Filter Bar */}
            <View style={styles.filterBar}>
                <View style={styles.resultsHeader}>
                    <View>
                        <Text style={styles.headerTitle}>{filters.query ? `Results for "${filters.query}"` : 'All Products'}</Text>
                        <Text style={styles.countText}>{products.length} products</Text>
                    </View>
                    <ComprehensiveFilters
                        onApplyFilters={setFilters}
                        currentFilters={filters}
                        categories={categories}
                    />
                </View>
                <View style={{ marginTop: 10 }}>
                    <FilterChips
                        currentFilters={filters}
                        categories={categories}
                        onApplyFilters={setFilters}
                    />
                </View>
            </View>

            {isLoading ? (
                <View style={styles.skeletonGrid}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))}
                </View>
            ) : (
                <FlashList
                    data={products}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    contentContainerStyle={styles.grid}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={loadingMore ? <ActivityIndicator color="#FDB913" style={{ marginVertical: 16 }} /> : null}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Feather name="package" size={52} color="#CCC" />
                            <Text style={styles.emptyTitle}>No products found</Text>
                            <Text style={styles.emptyText}>Try changing category or search terms</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.cardWrapper}>
                            {/* ProductCard component — will be converted to RN in components phase */}
                            <ProductCard product={item} />
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
    filterBar: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#EEE' },
    resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#282C3F' },
    countText: { fontSize: 13, color: '#888', marginTop: 2 },
    skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
    grid: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 80 },
    cardWrapper: { flex: 1, margin: 4 },
    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#555', marginTop: 14 },
    emptyText: { color: '#888', marginTop: 6 },
});
