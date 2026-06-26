import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import axios from 'axios';
import CategoryCarousel from '@/components/SwiggyComponents/CategoryCarousel';
import RestaurantCard from '@/components/SwiggyComponents/RestaurantCard';
import RadiusFilter from '@/components/ui/RadiusFilter';
import ComprehensiveFilters, { FilterOptions } from '@/components/ui/ComprehensiveFilters';
import FilterChips from '@/components/ui/FilterChips';
import { useLocation } from '@/context/LocationContext';

export default function ClientHomePage() {
    const [products, setProducts] = useState<any[]>([]);
    // categories & vendors fetched ONCE here and passed DOWN — no duplicate fetching in CategoryCarousel
    const [categories, setCategories] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [filters, setFilters] = useState<FilterOptions>({
        sortBy: 'relevance',
        rating: 0,
        hasOffer: false
    });
    const [radius, setRadius] = useState(50);
    const [facets, setFacets] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const { location } = useLocation();

    // Ref prevents fetchProducts being recreated when page changes mid-load
    const pageRef = useRef(page);
    pageRef.current = page;

    const fetchInitialData = useCallback(async (signal?: AbortSignal) => {
        try {
            // Fetch categories AND vendors in parallel, only once here
            const [catRes, vendRes] = await Promise.all([
                axios.get('/api/categories?parentOnly=true', { signal }),
                axios.get('/api/vendors?limit=10', { signal }),
            ]);
            setCategories(catRes.data?.data?.categories || []);
            setVendors(vendRes.data?.data?.vendors || []);
        } catch (error) {
            if (axios.isCancel(error)) return;
            console.error('Failed to fetch initial data:', error);
        }
    }, []);

    const fetchProducts = useCallback(async (isLoadMore = false, isRefresh = false, signal?: AbortSignal) => {
        try {
            if (!isLoadMore && !isRefresh) setIsLoading(true);

            const currentPage = isLoadMore ? pageRef.current + 1 : 1;
            const params: any = {
                limit: 20,
                page: currentPage,
                sortBy: filters.sortBy || 'distance'
            };

            if (location?.coordinates) {
                params.latitude = location.coordinates.latitude;
                params.longitude = location.coordinates.longitude;
                params.radius = radius;
            }

            if (selectedCategory) params.category = selectedCategory;
            if (filters.category && !selectedCategory) params.category = filters.category;
            if (filters.hasOffer) params.hasOffer = true;
            if (filters.rating) params.rating = filters.rating;
            if (filters.minPrice) params.minPrice = filters.minPrice;
            if (filters.maxPrice) params.maxPrice = filters.maxPrice;

            const response = await axios.get('/api/products', { params, signal });
            const newProducts = response.data.data.products || [];

            if (isLoadMore) {
                setProducts(prev => [...prev, ...newProducts]);
            } else {
                setProducts(newProducts);
                if (response.data.data.facets) setFacets(response.data.data.facets);
            }

            setPage(currentPage);
            setHasMore(response.data.data.pagination?.hasMore ?? false);
        } catch (error) {
            if (axios.isCancel(error)) return;
            console.error('Failed to load products:', error);
            if (!isLoadMore) setProducts([]);
            setHasMore(false);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
            setRefreshing(false);
        }
    }, [location, radius, filters, selectedCategory]);

    // Mount: load categories + vendors + products in parallel (2 calls, not 4)
    useEffect(() => {
        const controller = new AbortController();
        fetchInitialData(controller.signal);
        return () => controller.abort();
    }, [fetchInitialData]);

    useEffect(() => {
        const controller = new AbortController();
        fetchProducts(false, false, controller.signal);
        return () => controller.abort();
    }, [fetchProducts]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchInitialData();
        fetchProducts(false, true);
    }, [fetchInitialData, fetchProducts]);

    const handleLoadMore = useCallback(() => {
        if (!isLoadingMore && hasMore && !isLoading) {
            setIsLoadingMore(true);
            fetchProducts(true);
        }
    }, [isLoadingMore, hasMore, isLoading, fetchProducts]);

    const handleFilterChange = useCallback((newFilters: FilterOptions) => {
        setFilters(newFilters);
        if (newFilters.category !== undefined && newFilters.category !== selectedCategory) {
            setSelectedCategory(newFilters.category || '');
        }
    }, [selectedCategory]);

    const currentFiltersForChips = {
        ...filters,
        category: selectedCategory || filters.category
    };

    // Memoized renderItem — prevents FlashList from re-rendering all cells on every state change
    const renderItem = useCallback(({ item }: { item: any }) => (
        <View style={styles.gridItem}>
            <RestaurantCard
                id={item._id}
                name={item.title}
                image={item.images?.[0]}
                rating={item.rating}
                reviewCount={item.reviewCount}
                cuisine={item.description}
                priceForTwo={item.price?.original}
                offer={item.offer}
                distance={item.distance}
                vendorId={item.vendorId?._id}
                vendorName={item.vendorId?.shopName}
            />
        </View>
    ), []);

    const renderHeader = useCallback(() => (
        <View style={styles.headerArea}>
            {/* Categories + vendors passed as props — no duplicate API calls */}
            <CategoryCarousel
                onCategorySelect={setSelectedCategory}
                selectedCategory={selectedCategory}
                categories={categories}
                vendors={vendors}
            />

            <View style={styles.controlsWrap}>
                {/* Horizontal scroll so Filter button never gets clipped */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.controlsRow}
                    keyboardShouldPersistTaps="handled"
                >
                    <RadiusFilter value={radius} onChange={setRadius} />
                    <View style={styles.divider} />
                    <ComprehensiveFilters
                        onApplyFilters={handleFilterChange}
                        currentFilters={filters}
                        categories={categories}
                        facets={facets}
                    />
                </ScrollView>

                {(selectedCategory || filters.hasOffer || (filters.rating || 0) > 0 || (filters.minPrice || 0) > 0) && (
                    <FilterChips
                        currentFilters={currentFiltersForChips}
                        categories={categories}
                        onApplyFilters={(f) => {
                            handleFilterChange(f);
                            if (f.category === undefined) setSelectedCategory('');
                        }}
                    />
                )}

                <View style={styles.sectionHeaderWrap}>
                    <Text style={styles.sectionTitle}>Featured Items</Text>
                    {location?.coordinates && (
                        <Text style={styles.itemCount}>{products.length} items near you</Text>
                    )}
                </View>
            </View>
        </View>
    ), [selectedCategory, categories, vendors, radius, filters, facets, products.length, location, handleFilterChange, currentFiltersForChips]);

    const renderFooter = useCallback(() => {
        if (!isLoadingMore) return <View style={styles.footerSpacer} />;
        return (
            <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color="#FDB913" />
            </View>
        );
    }, [isLoadingMore]);

    return (
        <View style={styles.container}>
            {isLoading && !refreshing ? (
                <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color="#FDB913" />
                </View>
            ) : (
                <FlashList
                    data={products}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 12 }}
                    ListHeaderComponent={renderHeader}
                    ListFooterComponent={renderFooter}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#FDB913']} />
                    }
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>No items found</Text>
                            <Text style={styles.emptySub}>Try adjusting your filters or expanding the radius.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9F9F9' },
    loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerArea: { paddingBottom: 16 },
    controlsWrap: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#FFF', paddingBottom: 12, borderBottomWidth: 1, borderColor: '#EEE' },
    controlsRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 2 },
    divider: { width: 1, height: 20, backgroundColor: '#DDD', marginHorizontal: 10, flexShrink: 0 },

    sectionHeaderWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#282C3F' },
    itemCount: { fontSize: 12, color: '#888', fontWeight: '500', marginBottom: 2 },

    listContent: { paddingBottom: 40 },
    columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 12 },
    gridItem: { flex: 1, margin: 4 },

    footerSpacer: { height: 20 },
    footerLoading: { paddingVertical: 20, alignItems: 'center' },

    emptyState: { alignItems: 'center', padding: 40 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 8 },
    emptySub: { fontSize: 13, color: '#888', textAlign: 'center' },
});
