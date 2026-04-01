import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCartStore } from '@/store/cartStore';
import ChatButton from '@/components/chat/ChatButton';
import Toast from 'react-native-toast-message';

interface RestaurantCardProps {
    id: string;
    name: string;
    image: string;
    rating?: number;
    reviewCount?: number;
    cuisine?: string;
    priceForTwo?: number;
    distance?: number;
    offer?: {
        description: string;
        value?: number;
    };
    vendorId?: string;
    vendorName?: string;
}

function RestaurantCard({
    id,
    name,
    image,
    rating,
    reviewCount,
    cuisine,
    priceForTwo,
    distance,
    offer,
    vendorId,
    vendorName,
}: RestaurantCardProps) {
    const router = useRouter();
    const { addItem } = useCartStore();

    const handleAddToCart = () => {
        if (!vendorId) return;
        addItem({
            productId: id,
            title: name,
            price: priceForTwo || 0,
            image: image,
            vendorId: vendorId,
        }, 1);
        Toast.show({ type: 'success', text1: 'Added to cart!' });
    };

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => router.push(`/products/${id}` as any)}
        >
            {/* Image & Offer */}
            <View style={styles.imageWrap}>
                <Image
                    source={image || 'https://via.placeholder.com/200'}
                    style={styles.image}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                />
                {offer && (
                    <View style={styles.offerBadge}>
                        <Text style={styles.offerText}>
                            {offer.value ? `${offer.value}% OFF` : offer.description}
                        </Text>
                    </View>
                )}
            </View>

            {/* Details */}
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>{name}</Text>

                <View style={styles.metaRow}>
                    {rating != null && (
                        <View style={styles.ratingBadge}>
                            <Feather name="star" size={10} color="#FFF" />
                            <Text style={styles.ratingText}>{rating}</Text>
                        </View>
                    )}
                    {reviewCount != null && reviewCount > 0 && (
                        <Text style={styles.reviewsText}>({reviewCount})</Text>
                    )}
                    {distance != null && (
                        <View style={styles.distanceBadge}>
                            <Feather name="map-pin" size={10} color="#FDB913" />
                            <Text style={styles.distanceText}>
                                {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
                            </Text>
                        </View>
                    )}
                </View>

                {cuisine && (
                    <Text style={styles.cuisine} numberOfLines={1}>{cuisine}</Text>
                )}

                {priceForTwo != null && (
                    <Text style={styles.price}>₹{priceForTwo.toLocaleString('en-IN')}</Text>
                )}

                {vendorId && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity onPress={handleAddToCart} style={styles.cartBtn}>
                            <Feather name="shopping-cart" size={14} color="#FFF" style={styles.cartIcon} />
                            <Text style={styles.cartBtnText}>Add</Text>
                        </TouchableOpacity>

                        <ChatButton
                            recipientId={vendorId}
                            recipientModel="Vendor"
                            recipientName={vendorName || 'Vendor'}
                            variant="outline"
                            size="sm"
                        />
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

// React.memo prevents re-render when parent state changes (scrolling, filters, loading)
export default memo(RestaurantCard);

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EEE',
        marginBottom: 16,
    },
    imageWrap: { height: 140, backgroundColor: '#F5F5F5', position: 'relative' },
    image: { width: '100%', height: '100%' },
    offerBadge: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        backgroundColor: '#FD9139',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderTopRightRadius: 8
    },
    offerText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

    info: { padding: 12 },
    name: { fontSize: 15, fontWeight: 'bold', color: '#282C3F', marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#48C479', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 4 },
    ratingText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
    reviewsText: { fontSize: 11, color: '#686B78' },
    distanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 'auto' },
    distanceText: { fontSize: 11, fontWeight: 'bold', color: '#FDB913' },

    cuisine: { fontSize: 12, color: '#686B78', marginBottom: 4 },
    price: { fontSize: 14, fontWeight: 'bold', color: '#282C3F', marginTop: 2 },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    cartBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00A651', paddingVertical: 8, borderRadius: 8 },
    cartIcon: { marginRight: 4 },
    cartBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
});
