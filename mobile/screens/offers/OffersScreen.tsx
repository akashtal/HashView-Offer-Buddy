import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';

// Design system components (will be converted to RN in components phase)
import ProductCard from '@/components/products/ProductCard';
import Loading from '@/components/ui/Loading';

export default function OffersScreen() {
    const router = useRouter();
    const [offerProducts, setOfferProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadOffers = async () => {
            try {
                const response = await axios.get('/api/products?hasOffer=true&limit=50');
                setOfferProducts(response.data.data.products || []);
            } catch (error) {
                console.error('Failed to load offers:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadOffers();
    }, []);

    if (isLoading) {
        return <Loading fullScreen text="Loading offers..." />;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Banner */}
            <View style={styles.banner}>
                <Text style={styles.bannerTitle}>🔥 Hot Deals & Special Offers</Text>
                <Text style={styles.bannerSub}>Exclusive discounts from local vendors near you</Text>
            </View>

            {/* Product Grid — uses ProductCard for consistent design */}
            {offerProducts.length === 0 ? (
                <View style={styles.empty}>
                    <Feather name="tag" size={52} color="#CCC" />
                    <Text style={styles.emptyTitle}>No Offers Available</Text>
                    <Text style={styles.emptyText}>Check back soon for special deals from vendors near you</Text>
                    <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/products')}>
                        <Text style={styles.browseBtnText}>Browse All Products</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlashList
                    data={offerProducts}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    contentContainerStyle={styles.grid}
                    ListHeaderComponent={
                        <Text style={styles.offerCount}>{offerProducts.length} products on offer</Text>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.cardWrapper}>
                            <ProductCard product={item} />
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F9F9F9' },
    banner: { backgroundColor: '#FDB913', paddingVertical: 28, alignItems: 'center', paddingHorizontal: 20 },
    bannerTitle: { fontSize: 22, fontWeight: 'bold', color: '#000', textAlign: 'center' },
    bannerSub: { fontSize: 13, color: '#333', marginTop: 4, textAlign: 'center' },
    offerCount: { fontSize: 14, fontWeight: '600', color: '#555', padding: 12 },
    grid: { padding: 8, paddingBottom: 40 },
    cardWrapper: { width: '50%', padding: 6 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#555', marginTop: 16, marginBottom: 6 },
    emptyText: { color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
    browseBtn: { backgroundColor: '#FDB913', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
    browseBtnText: { fontWeight: 'bold', color: '#000' },
});
