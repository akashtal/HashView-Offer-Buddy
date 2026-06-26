import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import axios from 'axios';

// Design system components (will be converted to RN in components phase)
import ProductCard from '@/components/products/ProductCard';

export default function WishlistScreen() {
    const router = useRouter();
    const { items: wishlistIds, toggleItem } = useWishlistStore();
    const { addItem } = useCartStore();

    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadWishlistProducts = async () => {
            if (wishlistIds.length === 0) {
                setProducts([]);
                setIsLoading(false);
                return;
            }
            try {
                setIsLoading(true);
                // Only fetch the specific products we need — not all products
                const response = await axios.get(`/api/products?ids=${wishlistIds.join(',')}`);
                setProducts(response.data.data.products || []);
            } catch (error) {
                console.error('Failed to load wishlist:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadWishlistProducts();
    }, [wishlistIds]);

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ActivityIndicator size="large" color="#FDB913" style={{ marginTop: 60 }} />
            </SafeAreaView>
        );
    }

    if (products.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.emptyContainer}>
                    <Feather name="heart" size={64} color="#CCC" />
                    <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
                    <Text style={styles.emptyText}>Start adding products you love!</Text>
                    <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/products')}>
                        <Text style={styles.browseBtnText}>Browse Products</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.title}>My Wishlist ({products.length})</Text>
            </View>
            {/* Renders product cards using the shared ProductCard component — consistent design */}
            <FlashList
                data={products}
                keyExtractor={(item) => item._id}
                numColumns={2}
                contentContainerStyle={styles.grid}
                renderItem={({ item }) => (
                    <View style={styles.cardWrapper}>
                        <ProductCard product={item} />
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F3F3F3' },
    header: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EEE' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#282C3F' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#555', marginTop: 16, marginBottom: 8 },
    emptyText: { color: '#888', fontSize: 14, marginBottom: 24 },
    browseBtn: { backgroundColor: '#FDB913', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
    browseBtnText: { fontWeight: 'bold', color: '#000' },
    grid: { padding: 8, paddingBottom: 40 },
    cardWrapper: { width: '50%', padding: 6 },
});
