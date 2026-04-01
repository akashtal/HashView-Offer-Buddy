import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface LoadingProps {
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
    text?: string;
}

export default function Loading({ size = 'md', fullScreen = false, text }: LoadingProps) {
    const indicatorSize = size === 'sm' ? 24 : size === 'lg' ? 52 : 36;

    const inner = (
        <View style={styles.inner}>
            <ActivityIndicator size={indicatorSize as any} color="#FDB913" />
            {text && <Text style={styles.text}>{text}</Text>}
        </View>
    );

    if (fullScreen) {
        return <View style={styles.fullScreen}>{inner}</View>;
    }

    return <View style={styles.centered}>{inner}</View>;
}

export function LoadingSkeleton({ style }: { style?: object }) {
    return <View style={[styles.skeleton, style]} />;
}

export function ProductCardSkeleton() {
    return (
        <View style={styles.skeletonCard}>
            <LoadingSkeleton style={styles.skeletonImage} />
            <View style={styles.skeletonBody}>
                <LoadingSkeleton style={styles.skeletonLine1} />
                <LoadingSkeleton style={styles.skeletonLine2} />
                <LoadingSkeleton style={styles.skeletonLine3} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    fullScreen: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(255,255,255,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
    },
    centered: { paddingVertical: 40, justifyContent: 'center', alignItems: 'center' },
    inner: { alignItems: 'center', gap: 12 },
    text: { fontSize: 14, color: '#666', fontWeight: '500' },
    skeleton: { backgroundColor: '#EEEEEE', borderRadius: 6 },
    skeletonCard: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#EEE', overflow: 'hidden', marginBottom: 12 },
    skeletonImage: { width: '100%', height: 140, backgroundColor: '#EEEEEE' },
    skeletonBody: { padding: 12, gap: 8 },
    skeletonLine1: { height: 14, width: '75%' },
    skeletonLine2: { height: 12, width: '50%' },
    skeletonLine3: { height: 32, width: '100%', borderRadius: 8 },
});
