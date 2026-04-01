import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function ProductCardSkeleton() {
    return (
        <View style={styles.cardContainer}>
            {/* Image skeleton */}
            <View style={styles.imageSkeleton} />

            {/* Content skeleton */}
            <View style={styles.contentPadding}>
                {/* Title */}
                <View style={styles.titleSkeleton} />

                {/* Price */}
                <View style={styles.priceFlex}>
                    <View style={styles.price1Skeleton} />
                    <View style={styles.price2Skeleton} />
                </View>

                {/* Vendor info */}
                <View style={styles.vendorFlex}>
                    <View style={styles.avatarSkeleton} />
                    <View style={styles.vendorTextSkeleton} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    imageSkeleton: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#E5E7EB',
    },
    contentPadding: {
        padding: 16,
    },
    titleSkeleton: {
        height: 16,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        width: '75%',
        marginBottom: 12,
    },
    priceFlex: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    price1Skeleton: {
        height: 20,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        width: 80,
    },
    price2Skeleton: {
        height: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        width: 56,
    },
    vendorFlex: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    avatarSkeleton: {
        width: 24,
        height: 24,
        backgroundColor: '#E5E7EB',
        borderRadius: 12,
    },
    vendorTextSkeleton: {
        height: 12,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        width: 96,
    },
});
