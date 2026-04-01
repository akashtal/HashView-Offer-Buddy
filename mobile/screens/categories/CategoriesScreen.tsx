import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';

// Design system components (will be converted to RN in components phase)
import Loading from '@/components/ui/Loading';

export default function CategoriesScreen() {
    const router = useRouter();
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('/api/categories?parentOnly=true');
                if (response.data?.success) {
                    setCategories(response.data.data.categories || []);
                }
            } catch (error) {
                console.error('Failed to load categories:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (isLoading) {
        return <Loading fullScreen text="Loading categories..." />;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.title}>Browse by Category</Text>
                <Text style={styles.subtitle}>Explore products and offers across various categories</Text>
            </View>

            <FlatList
                data={categories}
                keyExtractor={(item) => item._id}
                numColumns={2}
                contentContainerStyle={styles.grid}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.categoryCard}
                        onPress={() => router.push(`/products?category=${item._id}` as any)}
                    >
                        <View style={styles.imageContainer}>
                            {item.image ? (
                                <Image source={{ uri: item.image }} style={styles.categoryImage} resizeMode="cover" />
                            ) : (
                                <View style={styles.iconFallback}>
                                    <Feather name="package" size={36} color="#888" />
                                </View>
                            )}
                        </View>
                        <Text style={styles.categoryName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.browseText}>Browse collection</Text>
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F9F9F9' },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EEE' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#282C3F', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#888' },
    grid: { padding: 10 },
    categoryCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, margin: 8, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
    imageContainer: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', backgroundColor: '#F5F5F5', marginBottom: 10, justifyContent: 'center', alignItems: 'center' },
    categoryImage: { width: '100%', height: '100%' },
    iconFallback: { justifyContent: 'center', alignItems: 'center' },
    categoryName: { fontSize: 15, fontWeight: 'bold', color: '#282C3F', textAlign: 'center', marginBottom: 3 },
    browseText: { fontSize: 12, color: '#888' },
});
