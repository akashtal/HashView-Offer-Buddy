import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ChatButton from '@/components/chat/ChatButton';
import { useCartStore } from '@/store/cartStore';
import Toast from 'react-native-toast-message';

interface ProductCardProps {
    product: {
        _id: string;
        title: string;
        description?: string;
        images: string[];
        price?: {
            original?: number;
            discounted?: number;
            currency?: string;
        };
        offer?: {
            type: string;
            value?: number;
            description: string;
            validUntil?: string;
        };
        vendorId: {
            _id: string;
            shopName: string;
            shopLogo?: string;
            location?: { city: string };
        };
        distance?: number;
        analytics?: { views: number };
    };
}

function ProductCard({ product }: ProductCardProps) {
    const router = useRouter();
    const { addItem } = useCartStore();

    const handleAddToCart = () => {
        if (!product) return;
        addItem({
            productId: product._id,
            title: product.title,
            price: product.price?.discounted || product.price?.original || 0,
            image: product.images?.[0] || '',
            vendorId: product.vendorId._id,
        }, 1);
        Toast.show({ type: 'success', text1: 'Added to cart!' });
    };

    const { hasDiscount, discountPct, displayPrice } = useMemo(() => {
        const hasDiscount = Boolean(
            product.price?.original &&
            product.price?.discounted &&
            product.price.discounted < product.price.original
        );
        const discountPct = hasDiscount && product.price
            ? Math.round(((product.price.original! - product.price.discounted!) / product.price.original!) * 100)
            : (product.offer?.value || 0);
        const displayPrice = product.price?.discounted || product.price?.original || 0;
        return { hasDiscount, discountPct, displayPrice };
    }, [product.price, product.offer]);

    const distanceLabel = product.distance != null && product.distance < 99999
        ? (product.distance < 1 ? `${(product.distance * 1000).toFixed(0)}m` : `${product.distance.toFixed(1)}km`)
        : null;

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/products/${product._id}` as any)}
            activeOpacity={0.88}
        >
            {/* Image */}
            <View style={styles.imageContainer}>
                <Image
                    source={product.images?.[0] || 'https://via.placeholder.com/200'}
                    style={styles.image}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                />

                {/* Discount badge — top-right */}
                {discountPct > 0 && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{discountPct}% OFF</Text>
                    </View>
                )}

                {/* Distance pill — bottom-left */}
                {distanceLabel && (
                    <View style={styles.distancePill}>
                        <Feather name="map-pin" size={9} color="#00A651" />
                        <Text style={styles.distancePillText}>{distanceLabel}</Text>
                    </View>
                )}
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Title */}
                <Text style={styles.title} numberOfLines={2}>{product.title}</Text>

                {/* Vendor */}
                <View style={styles.vendorRow}>
                    {product.vendorId.shopLogo ? (
                        <Image source={product.vendorId.shopLogo} style={styles.vendorLogo} contentFit="cover" cachePolicy="memory-disk" />
                    ) : (
                        <View style={styles.vendorLogoFallback}>
                            <Text style={styles.vendorLogoText}>{product.vendorId.shopName[0]}</Text>
                        </View>
                    )}
                    <Text style={styles.vendorName} numberOfLines={1}>{product.vendorId.shopName}</Text>
                </View>

                {/* Price */}
                {product.price && (
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>
                            ₹{displayPrice.toLocaleString('en-IN')}
                        </Text>
                        {hasDiscount && (
                            <Text style={styles.originalPrice}>
                                ₹{product.price.original?.toLocaleString('en-IN')}
                            </Text>
                        )}
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actionRow}>
                    <TouchableOpacity onPress={handleAddToCart} style={styles.cartBtn}>
                        <Feather name="shopping-cart" size={12} color="#FFF" />
                        <Text style={styles.cartBtnText}>Add</Text>
                    </TouchableOpacity>
                    <ChatButton
                        recipientId={product.vendorId._id}
                        recipientModel="Vendor"
                        recipientName={product.vendorId.shopName}
                        variant="outline"
                        size="sm"
                    />
                </View>

                {/* City */}
                {product.vendorId.location?.city && (
                    <View style={styles.cityRow}>
                        <Feather name="map-pin" size={10} color="#AAA" />
                        <Text style={styles.cityText} numberOfLines={1}>{product.vendorId.location.city}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

export default memo(ProductCard);

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EBEBEB',
        marginBottom: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },

    // Image
    imageContainer: { position: 'relative', height: 130, backgroundColor: '#F5F5F5' },
    image: { width: '100%', height: '100%' },

    // Discount badge (top-right)
    discountBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#EF4444',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderBottomLeftRadius: 8,
    },
    discountText: { color: '#FFF', fontSize: 9, fontWeight: '800' },

    // Distance pill (bottom-left)
    distancePill: {
        position: 'absolute',
        bottom: 6,
        left: 6,
        backgroundColor: 'rgba(255,255,255,0.92)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 20,
    },
    distancePillText: { fontSize: 9, fontWeight: '700', color: '#00A651' },

    // Content
    content: { padding: 9, gap: 5 },
    title: { fontSize: 12, fontWeight: '700', color: '#1C1C2E', lineHeight: 17, height: 34 },

    // Vendor
    vendorRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    vendorLogo: { width: 18, height: 18, borderRadius: 9 },
    vendorLogoFallback: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFF8E1', justifyContent: 'center', alignItems: 'center' },
    vendorLogoText: { fontSize: 9, fontWeight: 'bold', color: '#FDB913' },
    vendorName: { fontSize: 11, color: '#888', flex: 1 },

    // Price
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    price: { fontSize: 15, fontWeight: '800', color: '#FDB913' },
    originalPrice: { fontSize: 11, color: '#BBB', textDecorationLine: 'line-through' },

    // Actions
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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

    // City footer
    cityRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    cityText: { fontSize: 10, color: '#AAA', flex: 1 },
});
