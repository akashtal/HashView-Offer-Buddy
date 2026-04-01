import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface BadgeProps {
    children: ReactNode;
    variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info';
    size?: 'sm' | 'md' | 'lg';
    style?: ViewStyle;
}

export default function Badge({ children, variant = 'primary', size = 'md', style }: BadgeProps) {
    const bg = {
        primary: '#FFF8E1',
        success: '#E8F5E9',
        danger: '#FFEBEE',
        warning: '#FFF3E0',
        info: '#E3F2FD',
    }[variant];

    const color = {
        primary: '#282C3F',
        success: '#2E7D32',
        danger: '#C62828',
        warning: '#E65100',
        info: '#1565C0',
    }[variant];

    const fontSize = { sm: 10, md: 12, lg: 14 }[size];
    const px = { sm: 6, md: 10, lg: 14 }[size];
    const py = { sm: 2, md: 4, lg: 6 }[size];

    return (
        <View style={[styles.badge, { backgroundColor: bg, paddingHorizontal: px, paddingVertical: py }, style]}>
            <Text style={[styles.text, { color, fontSize }]}>{children}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: { borderRadius: 999, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' },
    text: { fontWeight: '600' },
});
