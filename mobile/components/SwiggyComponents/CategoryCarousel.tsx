import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getCategoryIcon } from '@/utils/category-icons';

import { Image } from 'expo-image';
interface CategoryCarouselProps {
    onCategorySelect?: (categoryId: string) => void;
    selectedCategory?: string;
    // Data is now passed as props from ClientHomePage — no duplicate API fetching
    categories: any[];
    vendors: any[];
}

export default function CategoryCarousel({ onCategorySelect, selectedCategory, categories, vendors }: CategoryCarouselProps) {
    const router = useRouter();

    if (categories.length === 0 && vendors.length === 0) return null;

    return (
        <View style={styles.container}>
            {/* Categories */}
            {categories.length > 0 && (
                <View style={styles.section}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catList}>
                        {categories.map((cat) => {
                            const { icon, color, bgColor } = getCategoryIcon(cat.name) || {};
                            const IconComp = icon || Feather;
                            const isSelected = selectedCategory === cat._id;
                            const hasImage = Boolean(cat.image);

                            return (
                                <TouchableOpacity
                                    key={cat._id}
                                    style={styles.catItem}
                                    onPress={() => onCategorySelect?.(isSelected ? '' : cat._id)}
                                >
                                    <View style={[
                                        styles.catCircle,
                                        { backgroundColor: hasImage ? '#f0f0f0' : (bgColor || '#EEE') },
                                        isSelected && styles.catCircleSelected
                                    ]}>
                                        {hasImage ? (
                                            <Image source={{ uri: cat.image }} style={styles.catImage} />
                                        ) : (
                                            <IconComp name="package" size={24} color={color || '#555'} />
                                        )}
                                    </View>
                                    <Text style={[styles.catName, isSelected && styles.catNameSelected]} numberOfLines={1}>
                                        {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Top Stores */}
            {vendors.length > 0 && (
                <View style={[styles.section, styles.borderTop]}>
                    <Text style={styles.sectionTitle}>Top Stores Near You</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vendList}>
                        {vendors.map((vendor) => (
                            <TouchableOpacity
                                key={vendor._id}
                                style={styles.vendCard}
                                onPress={() => router.push(`/vendors/${vendor._id}` as any)}
                            >
                                <View style={styles.vendImageWrap}>
                                    <Image
                                        source={{ uri: vendor.shopLogo || 'https://via.placeholder.com/150' }}
                                        style={styles.vendImage}
                                    />
                                    <View style={styles.vendOverlay}>
                                        <Text style={styles.vendOverlayName} numberOfLines={1}>{vendor.shopName}</Text>
                                        <Text style={styles.vendOverlayCat} numberOfLines={1}>{vendor.category?.name || 'General'}</Text>
                                    </View>
                                </View>
                                <View style={styles.vendInfo}>
                                    <View style={styles.vendRow}>
                                        {vendor.rating != null && (
                                            <View style={styles.ratingBadge}>
                                                <Feather name="star" size={10} color="#FFF" />
                                                <Text style={styles.ratingText}>{vendor.rating}</Text>
                                            </View>
                                        )}
                                        <Text style={styles.vendCity} numberOfLines={1}>{vendor.location?.city}</Text>
                                    </View>
                                    <View style={styles.vendAddressRow}>
                                        <Feather name="map-pin" size={10} color="#E53935" />
                                        <Text style={styles.vendAddress} numberOfLines={1}>{vendor.location?.address || 'View details'}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { backgroundColor: '#FFF', paddingVertical: 8 },
    section: { paddingVertical: 12 },
    borderTop: { borderTopWidth: 8, borderColor: '#F5F5F5' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#282C3F', paddingHorizontal: 16, marginBottom: 12 },

    catList: { paddingHorizontal: 12, gap: 16 },
    catItem: { alignItems: 'center', width: 72 },
    catCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
    catCircleSelected: { borderColor: '#FD9139' },
    catImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    catName: { fontSize: 12, marginTop: 8, textAlign: 'center', color: '#555', fontWeight: '500' },
    catNameSelected: { color: '#FD9139', fontWeight: 'bold' },

    vendList: { paddingHorizontal: 16, gap: 16 },
    vendCard: { width: 220, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#EEE', overflow: 'hidden' },
    vendImageWrap: { height: 120, position: 'relative', backgroundColor: '#EEE' },
    vendImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    vendOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, paddingTop: 20 },
    vendOverlayName: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
    vendOverlayCat: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
    vendInfo: { padding: 10 },
    vendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#48C479', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 4 },
    ratingText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
    vendCity: { fontSize: 11, color: '#666', flex: 1, textAlign: 'right' },
    vendAddressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 6, borderTopWidth: 1, borderColor: '#FAFAFA' },
    vendAddress: { fontSize: 11, color: '#888', flex: 1 },
});
