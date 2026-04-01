import React from 'react';
import { View, StyleSheet } from 'react-native';
import ProductCardSkeleton from './ProductCardSkeleton';

interface ProductGridSkeletonProps {
    count?: number;
    columns?: string; // Kept for API compatibility with legacy code
}

export default function ProductGridSkeleton({
    count = 8,
    columns = 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
}: ProductGridSkeletonProps) {
    return (
        <View style={styles.grid}>
            {Array.from({ length: count }).map((_, i) => (
                <View key={i} style={styles.gridItem}>
                    <ProductCardSkeleton />
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8, // compensate for item padding
    },
    gridItem: {
        width: '50%',
        padding: 8,
    }
});
