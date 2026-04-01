import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HeroSearch() {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const handleSearch = () => {
        if (searchQuery.trim()) {
            router.push(`/products?search=${encodeURIComponent(searchQuery)}` as any);
        }
    };

    const popularTerms = ['Building Materials', 'Electronics', 'Machinery', 'Pharmaceuticals'];

    return (
        <View style={styles.container}>
            {/* We could use an ImageBackground here for a real gradient effect or rely on View backgroundColor */}
            <View style={styles.gradientBg}>
                <View style={styles.content}>
                    <Text style={styles.title}>India&apos;s Largest Online B2B Marketplace</Text>
                    <Text style={styles.subtitle}>Find quality products & reliable suppliers near you</Text>

                    {/* Search Bar */}
                    <View style={styles.searchBox}>
                        <View style={styles.inputContainer}>
                            <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
                            <TextInput
                                style={styles.input}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Search for products, services..."
                                placeholderTextColor="#999"
                                onSubmitEditing={handleSearch}
                            />
                        </View>
                        <TouchableOpacity style={styles.btn} onPress={handleSearch}>
                            <Text style={styles.btnText}>Search</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Popular Tags */}
                    <View style={styles.popularWrap}>
                        <Text style={styles.popularLabel}>Popular:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularList}>
                            {popularTerms.map((term) => (
                                <TouchableOpacity 
                                    key={term} 
                                    style={styles.popularChip} 
                                    onPress={() => {
                                        setSearchQuery(term);
                                        router.push(`/products?search=${encodeURIComponent(term)}` as any);
                                    }}
                                >
                                    <Text style={styles.popularChipText}>{term}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { backgroundColor: '#111' },
    gradientBg: { paddingVertical: 40, paddingHorizontal: 16, backgroundColor: '#1F2937' }, // Using a dark solid fallback for gradient
    content: { alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', textAlign: 'center', marginBottom: 10, lineHeight: 32 },
    subtitle: { fontSize: 15, color: '#D1D5DB', textAlign: 'center', marginBottom: 24 },
    searchBox: { width: '100%', backgroundColor: '#FFF', borderRadius: 12, padding: 8, gap: 8 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 12, flex: 1 },
    searchIcon: { marginRight: 8 },
    input: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#111' },
    btn: { backgroundColor: '#FDB913', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    btnText: { fontWeight: 'bold', color: '#000', fontSize: 15 },
    popularWrap: { marginTop: 20, width: '100%' },
    popularLabel: { color: '#D1D5DB', fontSize: 13, marginBottom: 8 },
    popularList: { gap: 8 },
    popularChip: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
    popularChipText: { color: '#FFF', fontSize: 12 },
});
