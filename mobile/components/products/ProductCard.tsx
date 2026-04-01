import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Badge from '@/components/ui/Badge';
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

    // useMemo prevents recalculating price on every render
    const { hasDiscount, discountPct, formattedPrice } = useMemo(() => {
        const hasDiscount = Boolean(
            product.price?.original &&
            product.price?.discounted &&
            product.price.discounted < product.price.original
        );
        const discountPct = hasDiscount && product.price
            ? Math.round(((product.price.original! - product.price.discounted!) / product.price.original!) * 100)
            : 0;
        const displayPrice = product.price?.discounted || product.price?.original || 0;
        return { hasDiscount, discountPct, formattedPrice: `₹${displayPrice.toLocaleString('en-IN')}` };
    }, [product.price]);

    return (
        <TouchableOpacity style={styles.card} onPress={() => router.push(`/products/${product._id}` as any)} activeOpacity={0.9}>
            {/* Image */}
            <View style={styles.imageContainer}>
                <Image
                    source={product.images?.[0] || 'https://via.placeholder.com/200'}
                    style={styles.image}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                />
                {product.offer && (
                    <View style={styles.offerBadgeWrap}>
                        <Badge variant="danger" size="sm">
                            <Feather name="tag" size={10} color="#C62828" /> {product.offer.description}
                        </Badge>
                    </View>
                )}
                {hasDiscount && (
                    <View style={styles.discountBadgeWrap}>
                        <Badge variant="success" size="sm">{discountPct}% OFF</Badge>
                    </View>
                )}
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={2}>{product.title}</Text>

                {/* Vendor Row */}
                <View style={styles.vendorRow}>
                    <View style={styles.vendorLeft}>
                        {product.vendorId.shopLogo ? (
                            <Image source={product.vendorId.shopLogo} style={styles.vendorLogo} contentFit="cover" cachePolicy="memory-disk" />
                        ) : (
                            <View style={styles.vendorLogoFallback}>
                                <Text style={styles.vendorLogoText}>{product.vendorId.shopName[0]}</Text>
                            </View>
                        )}
                        <Text style={styles.vendorName} numberOfLines={1}>{product.vendorId.shopName}</Text>
                    </View>
                </View>

                {/* Price */}
                {product.price && (
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>{formattedPrice}</Text>
                        {hasDiscount && (
                            <Text style={styles.originalPrice}>₹{product.price.original?.toLocaleString('en-IN')}</Text>
                        )}
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actionRow}>
                    <TouchableOpacity onPress={handleAddToCart} style={styles.cartBtn}>
                        <Feather name="shopping-cart" size={14} color="#FFF" style={styles.cartIcon} />
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

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.footerItem}>
                        <Feather name="map-pin" size={12} color="#888" />
                        <Text style={styles.footerText}>{product.vendorId.location?.city || 'Nearby'}</Text>
                    </View>
                    {product.analytics && (
                        <View style={styles.footerItem}>
                            <Feather name="eye" size={12} color="#888" />
                            <Text style={styles.footerText}>{product.analytics.views} views</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

// React.memo prevents re-render when parent state changes (scroll position, filter updates, loading)
export default memo(ProductCard);

const styles = StyleSheet.create({
    card: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#EEE', marginBottom: 4 },
    imageContainer: { position: 'relative', height: 160, backgroundColor: '#F5F5F5' },
    image: { width: '100%', height: '100%' },
    offerBadgeWrap: { position: 'absolute', top: 8, left: 8 },
    discountBadgeWrap: { position: 'absolute', top: 8, right: 8 },
    content: { padding: 12 },
    title: { fontSize: 14, fontWeight: '600', color: '#282C3F', marginBottom: 8, lineHeight: 20 },
    vendorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    vendorLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 },
    vendorLogo: { width: 20, height: 20, borderRadius: 10 },
    vendorLogoFallback: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF8E1', justifyContent: 'center', alignItems: 'center' },
    vendorLogoText: { fontSize: 10, fontWeight: 'bold', color: '#FDB913' },
    vendorName: { fontSize: 12, color: '#666', flex: 1 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 8 },
    price: { fontSize: 18, fontWeight: 'bold', color: '#FDB913' },
    originalPrice: { fontSize: 13, color: '#999', textDecorationLine: 'line-through' },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    cartBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00A651', paddingVertical: 8, borderRadius: 8 },
    cartIcon: { marginRight: 4 },
    cartBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
    footer: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderColor: '#EEE' },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    footerText: { fontSize: 11, color: '#888' },
});
