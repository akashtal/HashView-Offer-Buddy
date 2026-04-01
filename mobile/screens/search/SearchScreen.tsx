import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProductStore } from '@/store/productStore';
import axios from 'axios';

// Design system components (will be converted to RN in components phase)
import ProductCard from '@/components/products/ProductCard';
import ProductCardSkeleton from '@/components/products/ProductCardSkeleton';

export default function SearchScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ q?: string; category?: string }>();

    const { products, isLoading, fetchProducts } = useProductStore();
    const [query, setQuery] = useState(params.q || '');
    const [selectedCategory, setSelectedCategory] = useState(params.category || '');
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await axios.get('/api/categories?parentOnly=true');
                setCategories(response.data.data.categories || []);
            } catch (error) {
                console.error('Failed to load categories:', error);
            }
        };
        loadCategories();
    }, []);

    useEffect(() => {
        const searchParams: any = {};
        if (params.q) searchParams.query = params.q;
        if (params.category) searchParams.category = params.category;
        fetchProducts(0, 0, 0, searchParams);
    }, [params.q, params.category]);

    const handleSearch = () => {
        const queryObj: any = {};
        if (query) queryObj.q = query;
        if (selectedCategory) queryObj.category = selectedCategory;
        router.push({ pathname: '/search', params: queryObj });
    };

    const clearFilters = () => {
        setQuery('');
        setSelectedCategory('');
        router.push('/search');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Search Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Find Products Nearby</Text>
                    <View style={styles.searchBox}>
                        <Feather name="search" size={18} color="#888" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search for products..."
                            value={query}
                            onChangeText={setQuery}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                        />
                        {query !== '' && (
                            <TouchableOpacity onPress={() => setQuery('')}>
                                <Feather name="x" size={18} color="#888" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Category Pills */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                        <TouchableOpacity
                            style={[styles.catPill, selectedCategory === '' && styles.catPillActive]}
                            onPress={() => setSelectedCategory('')}
                        >
                            <Text style={[styles.catPillText, selectedCategory === '' && styles.catPillTextActive]}>All</Text>
                        </TouchableOpacity>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat._id}
                                style={[styles.catPill, selectedCategory === cat._id && styles.catPillActive]}
                                onPress={() => setSelectedCategory(cat._id)}
                            >
                                <Text style={[styles.catPillText, selectedCategory === cat._id && styles.catPillTextActive]}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                            <Feather name="search" size={16} color="#000" />
                            <Text style={styles.searchBtnText}>Search</Text>
                        </TouchableOpacity>
                        {(query || selectedCategory) && (
                            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                                <Feather name="x" size={14} color="#E53935" />
                                <Text style={styles.clearBtnText}>Clear</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Results — uses ProductCard component for consistent design */}
                {isLoading ? (
                    <View style={styles.skeletonGrid}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <ProductCardSkeleton key={i} />
                        ))}
                    </View>
                ) : products.length > 0 ? (
                    <FlatList
                        data={products}
                        keyExtractor={(item) => item._id}
                        numColumns={2}
                        contentContainerStyle={styles.grid}
                        ListHeaderComponent={<Text style={styles.resultCount}>Found {products.length} products</Text>}
                        renderItem={({ item }) => (
                            <View style={styles.cardWrapper}>
                                <ProductCard product={item} />
                            </View>
                        )}
                    />
                ) : (
                    <View style={styles.empty}>
                        <Feather name="search" size={52} color="#CCC" />
                        <Text style={styles.emptyTitle}>No products found</Text>
                        <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F9F9F9' },
    container: { flex: 1 },
    header: { backgroundColor: '#FFF', padding: 16, borderBottomWidth: 1, borderColor: '#EEE' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#282C3F', marginBottom: 12 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: '#333' },
    catScroll: { marginBottom: 12 },
    catPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 8, borderWidth: 1, borderColor: '#DDD' },
    catPillActive: { backgroundColor: '#FDB913', borderColor: '#FDB913' },
    catPillText: { fontSize: 13, color: '#555' },
    catPillTextActive: { color: '#000', fontWeight: '600' },
    actionRow: { flexDirection: 'row', gap: 10 },
    searchBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDB913', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, gap: 6 },
    searchBtnText: { fontWeight: 'bold', color: '#000' },
    clearBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E53935', gap: 4 },
    clearBtnText: { color: '#E53935', fontWeight: '600', fontSize: 13 },
    skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
    grid: { padding: 8 },
    cardWrapper: { width: '50%', padding: 6 },
    resultCount: { fontSize: 14, color: '#666', padding: 8 },
    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#555', marginTop: 16 },
    emptyText: { color: '#888', marginTop: 6 },
});
