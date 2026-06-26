import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Image } from 'expo-image';
interface SupplierCardProps {
    id: string;
    shopName: string;
    businessName?: string;
    logo?: string;
    location?: { city: string; state?: string };
    phone?: string;
    email?: string;
    description?: string;
    rating?: number;
    verified?: boolean;
    distance?: number;
}

export default function SupplierCard({
    id,
    shopName,
    businessName,
    logo,
    location,
    phone,
    email,
    description,
    rating,
    verified = true,
    distance,
}: SupplierCardProps) {
    const router = useRouter();

    const handleCall = () => {
        if (phone) Linking.openURL(`tel:${phone}`);
    };

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoRow}>
                    {logo ? (
                        <Image source={{ uri: logo }} style={styles.logo} contentFit="cover" />
                    ) : (
                        <View style={styles.logoFallback}>
                            <Text style={styles.logoFallbackText}>{shopName[0] || 'S'}</Text>
                        </View>
                    )}
                    <View style={styles.nameBlock}>
                        <Text style={styles.shopName}>{shopName}</Text>
                        {businessName && businessName !== shopName && (
                            <Text style={styles.bizName}>{businessName}</Text>
                        )}
                    </View>
                </View>
                {rating != null && (
                    <View style={styles.ratingBadge}>
                        <Feather name="star" size={12} color="#FDB913" />
                        <Text style={styles.ratingText}>{rating}</Text>
                    </View>
                )}
            </View>

            {/* Location */}
            {location && (
                <View style={styles.locationRow}>
                    <Feather name="map-pin" size={13} color="#FDB913" />
                    <Text style={styles.locationText}>
                        {location.city}{location.state ? `, ${location.state}` : ''}
                    </Text>
                    {distance != null && distance < 99999 && (
                        <View style={styles.distanceBadge}>
                            <Text style={styles.distanceText}>
                                {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`} away
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Description */}
            {description && <Text style={styles.description} numberOfLines={2}>{description}</Text>}

            {/* Contact */}
            <View style={styles.contactBlock}>
                {phone && (
                    <View style={styles.contactRow}>
                        <Feather name="phone" size={13} color="#FDB913" />
                        <Text style={styles.contactText}>{phone}</Text>
                    </View>
                )}
                {email && (
                    <View style={styles.contactRow}>
                        <Feather name="mail" size={13} color="#FDB913" />
                        <Text style={styles.contactText} numberOfLines={1}>{email}</Text>
                    </View>
                )}
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.contactBtn} onPress={handleCall}>
                    <Feather name="phone" size={14} color="#000" />
                    <Text style={styles.contactBtnText}>Contact</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.profileBtn} onPress={() => router.push(`/vendors/${id}` as any)}>
                    <Text style={styles.profileBtnText}>View Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#EEE', marginBottom: 14 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    logoRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
    logo: { width: 56, height: 56, borderRadius: 10 },
    logoFallback: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#FDB913', justifyContent: 'center', alignItems: 'center' },
    logoFallbackText: { fontSize: 22, fontWeight: 'bold', color: '#000' },
    nameBlock: { flex: 1 },
    shopName: { fontSize: 16, fontWeight: 'bold', color: '#282C3F' },
    bizName: { fontSize: 13, color: '#666', marginTop: 2 },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF8E1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    ratingText: { fontSize: 13, fontWeight: '600', color: '#282C3F' },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    locationText: { fontSize: 13, color: '#555' },
    distanceBadge: { backgroundColor: '#F0F4FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    distanceText: { fontSize: 11, color: '#3949AB', fontWeight: '600' },
    description: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 10 },
    contactBlock: { gap: 6, marginBottom: 12 },
    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    contactText: { fontSize: 13, color: '#333', flex: 1 },
    actionsRow: { flexDirection: 'row', gap: 10 },
    contactBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: '#FDB913', paddingVertical: 11, borderRadius: 8 },
    contactBtnText: { fontWeight: 'bold', color: '#000', fontSize: 14 },
    profileBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 11, borderRadius: 8, borderWidth: 1.5, borderColor: '#FDB913' },
    profileBtnText: { fontWeight: '600', color: '#FDB913', fontSize: 14 },
});
