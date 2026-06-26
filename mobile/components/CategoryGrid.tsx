import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';

import { Image } from 'expo-image';
interface Category {
    _id: string;
    name: string;
    slug: string;
    image?: string;
    icon?: string;
}

export default function CategoryGrid() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('/api/categories?parentOnly=true');
                if (response.data?.success) {
                    setCategories(response.data.data.categories);
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Browse by Categories</Text>
                <View style={styles.grid}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <View key={i} style={styles.skeletonCard}>
                            <View style={styles.skeletonCircle} />
                            <View style={styles.skeletonText} />
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    const displayCategories = categories.slice(0, 11);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Browse by Categories</Text>

            <View style={styles.grid}>
                {displayCategories.map((category) => (
                    <TouchableOpacity
                        key={category._id}
                        style={styles.card}
                        onPress={() => router.push(`/products?category=${category._id}` as any)}
                    >
                        <View style={styles.iconCircle}>
                            {category.image ? (
                                <Image source={{ uri: category.image }} style={styles.image} />
                            ) : (
                                <Feather name="package" size={24} color="#FDB913" />
                            )}
                        </View>
                        <Text style={styles.catName} numberOfLines={2}>{category.name}</Text>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => router.push('/categories' as any)}
                >
                    <View style={[styles.iconCircle, { backgroundColor: '#FFF8E1' }]}>
                        <Feather name="more-horizontal" size={24} color="#FDB913" />
                    </View>
                    <Text style={styles.catName}>More Categories</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingVertical: 24, paddingHorizontal: 16, backgroundColor: '#F9F9F9' },
    title: { fontSize: 20, fontWeight: 'bold', color: '#282C3F', textAlign: 'center', marginBottom: 20 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    card: { width: '30%', alignItems: 'center', marginBottom: 20 },
    iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, marginBottom: 8, overflow: 'hidden' },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    catName: { fontSize: 12, fontWeight: '600', color: '#333', textAlign: 'center' },
    
    skeletonCard: { width: '30%', alignItems: 'center', marginBottom: 20 },
    skeletonCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E0E0E0', marginBottom: 8 },
    skeletonText: { width: 50, height: 10, backgroundColor: '#E0E0E0', borderRadius: 4 },
});
