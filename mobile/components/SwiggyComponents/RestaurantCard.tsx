import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCartStore } from '@/store/cartStore';
import ChatButton from '@/components/chat/ChatButton';
import Toast from 'react-native-toast-message';

const CARD_PADDING = 8;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - CARD_PADDING) / 2; // 2 cols, 16px side padding, gap between

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

    const offerLabel = offer?.value ? `${offer.value}% OFF` : offer?.description;
    const distanceLabel = distance != null && distance < 99999
        ? (distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`)
        : null;

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.88}
            onPress={() => router.push(`/products/${id}` as any)}
        >
            {/* Image */}
            <View style={styles.imageWrap}>
                <Image
                    source={image || 'https://via.placeholder.com/200'}
                    style={styles.image}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                />
                {/* Offer badge — top-left ribbon */}
                {offerLabel && (
                    <View style={styles.offerBadge}>
                        <Text style={styles.offerText} numberOfLines={1}>{offerLabel}</Text>
                    </View>
                )}
                {/* Distance pill — top-right */}
                {distanceLabel && (
                    <View style={styles.distancePill}>
                        <Feather name="map-pin" size={9} color="#D97706" />
                        <Text style={styles.distancePillText}>{distanceLabel}</Text>
                    </View>
                )}
                {/* Rating pill — bottom-left */}
                {rating != null && (
                    <View style={styles.ratingPill}>
                        <Feather name="star" size={9} color="#FFF" />
                        <Text style={styles.ratingPillText}>{rating}</Text>
                        {reviewCount != null && reviewCount > 0 && (
                            <Text style={styles.reviewPillText}>({reviewCount})</Text>
                        )}
                    </View>
                )}
            </View>

            {/* Details */}
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>{name}</Text>

                {priceForTwo != null && (
                    <Text style={styles.price}>₹{priceForTwo.toLocaleString('en-IN')}</Text>
                )}

                {/* Actions */}
                {vendorId && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity onPress={handleAddToCart} style={styles.cartBtn}>
                            <Feather name="shopping-cart" size={12} color="#FFF" />
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

export default memo(RestaurantCard);

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EBEBEB',
        marginBottom: CARD_PADDING,
        // subtle elevation
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    imageWrap: {
        height: 130,
        backgroundColor: '#F5F5F5',
        position: 'relative',
    },
    image: { width: '100%', height: '100%' },

    // Offer ribbon
    offerBadge: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#F97316',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderBottomRightRadius: 8,
        maxWidth: '70%',
    },
    offerText: { color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },

    // Distance pill
    distancePill: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(255,255,255,0.92)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 20,
    },
    distancePillText: { fontSize: 9, fontWeight: '700', color: '#D97706' },

    // Rating pill
    ratingPill: {
        position: 'absolute',
        bottom: 6,
        left: 6,
        backgroundColor: '#48C479',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 20,
    },
    ratingPillText: { fontSize: 9, fontWeight: '800', color: '#FFF' },
    reviewPillText: { fontSize: 9, color: 'rgba(255,255,255,0.8)' },

    // Info section
    info: { padding: 9, gap: 4 },
    name: { fontSize: 13, fontWeight: '700', color: '#1C1C2E', lineHeight: 18 },
    price: { fontSize: 14, fontWeight: '800', color: '#1C1C2E' },

    // Action row
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    cartBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00A651',
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    cartBtnText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
});
