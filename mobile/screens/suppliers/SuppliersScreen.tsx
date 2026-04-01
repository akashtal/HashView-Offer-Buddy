import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';

// Design system components (will be converted to RN in components phase)
import SupplierCard from '@/components/IndiaMART/SupplierCard';

export default function SuppliersScreen() {
    const router = useRouter();
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const loadSuppliers = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await axios.get('/api/vendors?limit=50');
            setSuppliers(response.data.data.vendors || response.data.data || []);
        } catch (error) {
            console.error('Failed to load suppliers:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSuppliers();
    }, [loadSuppliers]);

    const filteredSuppliers = searchQuery
        ? suppliers.filter((s) =>
            s.shopName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.location?.city?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : suppliers;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                {/* Banner */}
                <View style={styles.banner}>
                    <Text style={styles.bannerTitle}>Verified Suppliers Directory</Text>
                    <Text style={styles.bannerSub}>Connect with trusted business partners near you</Text>
                </View>

                {/* Search */}
                <View style={styles.searchRow}>
                    <Feather name="search" size={18} color="#888" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search suppliers..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery !== '' && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Feather name="x" size={18} color="#888" />
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={styles.countText}>{filteredSuppliers.length} Suppliers Available</Text>

                {isLoading ? (
                    <ActivityIndicator size="large" color="#FDB913" style={{ marginTop: 40 }} />
                ) : filteredSuppliers.length === 0 ? (
                    <View style={styles.empty}>
                        <Feather name="map-pin" size={52} color="#CCC" />
                        <Text style={styles.emptyTitle}>No Suppliers Found</Text>
                        <Text style={styles.emptyText}>Try adjusting your search</Text>
                        <TouchableOpacity style={styles.clearBtn} onPress={() => setSearchQuery('')}>
                            <Text style={styles.clearBtnText}>Clear Search</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {filteredSuppliers.map((supplier) => (
                            // SupplierCard component — will be converted to RN in components phase
                            <SupplierCard
                                key={supplier._id}
                                id={supplier._id}
                                shopName={supplier.shopName}
                                businessName={supplier.businessName}
                                logo={supplier.shopLogo}
                                location={{
                                    city: supplier.location?.city || '',
                                    state: supplier.location?.state,
                                }}
                                phone={supplier.phone || supplier.contactInfo?.phone}
                                email={supplier.email || supplier.contactInfo?.email}
                                description={supplier.description}
                                rating={supplier.rating}
                                verified={supplier.isApproved}
                                distance={supplier.distance}
                            />
                        ))}
                    </View>
                )}

                {/* CTA Section */}
                <View style={styles.cta}>
                    <Text style={styles.ctaTitle}>Are you a supplier?</Text>
                    <Text style={styles.ctaDesc}>Join thousands of verified suppliers and connect with buyers across India</Text>
                    <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/vendor-register' as any)}>
                        <Text style={styles.ctaBtnText}>Register as Supplier</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F9F9F9' },
    container: { paddingBottom: 40 },
    banner: { backgroundColor: '#FDB913', paddingVertical: 36, alignItems: 'center', paddingHorizontal: 20 },
    bannerTitle: { fontSize: 24, fontWeight: 'bold', color: '#000', textAlign: 'center' },
    bannerSub: { fontSize: 14, color: '#333', marginTop: 6, textAlign: 'center' },
    searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 16, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#DDD' },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: '#333' },
    countText: { fontSize: 14, fontWeight: '600', color: '#555', paddingHorizontal: 16, marginBottom: 8 },
    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#555', marginTop: 14 },
    emptyText: { color: '#888', marginTop: 6, marginBottom: 16 },
    clearBtn: { backgroundColor: '#FDB913', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    clearBtnText: { fontWeight: 'bold', color: '#000' },
    list: { paddingHorizontal: 16 },
    cta: { backgroundColor: '#282C3F', margin: 16, borderRadius: 16, padding: 28, alignItems: 'center' },
    ctaTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
    ctaDesc: { fontSize: 14, color: '#CCC', textAlign: 'center', marginBottom: 20 },
    ctaBtn: { backgroundColor: '#FDB913', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 10 },
    ctaBtnText: { fontWeight: 'bold', color: '#000', fontSize: 15 },
});
