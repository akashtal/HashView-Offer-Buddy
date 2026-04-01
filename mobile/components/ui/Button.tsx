import React, { ReactNode } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';

interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'warning' | 'success';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    children: ReactNode;
    fullWidth?: boolean;
    onPress?: () => void;
    disabled?: boolean;
    style?: ViewStyle;
}

export default function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    children,
    fullWidth = false,
    onPress,
    disabled = false,
    style,
}: ButtonProps) {
    const bg: Record<string, string> = {
        primary: '#FDB913',
        secondary: '#282C3F',
        outline: 'transparent',
        ghost: 'transparent',
        danger: '#E53935',
        warning: '#FF6F00',
        success: '#2E7D32',
    };

    const textColor: Record<string, string> = {
        primary: '#000',
        secondary: '#FFF',
        outline: '#FDB913',
        ghost: '#282C3F',
        danger: '#FFF',
        warning: '#FFF',
        success: '#FFF',
    };

    const borderColor: Record<string, string> = {
        primary: 'transparent',
        secondary: 'transparent',
        outline: '#FDB913',
        ghost: 'transparent',
        danger: 'transparent',
        warning: 'transparent',
        success: 'transparent',
    };

    const paddingV = { sm: 8, md: 12, lg: 16 }[size];
    const paddingH = { sm: 14, md: 20, lg: 28 }[size];
    const fontSize = { sm: 13, md: 15, lg: 17 }[size];

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || isLoading}
            activeOpacity={0.8}
            style={[
                styles.btn,
                {
                    backgroundColor: bg[variant],
                    borderColor: borderColor[variant],
                    paddingVertical: paddingV,
                    paddingHorizontal: paddingH,
                    opacity: (disabled || isLoading) ? 0.5 : 1,
                },
                fullWidth && styles.fullWidth,
                style,
            ]}
        >
            {isLoading ? (
                <ActivityIndicator color={textColor[variant]} size="small" />
            ) : (
                <View style={styles.content}>
                    {typeof children === 'string' ? (
                        <Text style={[styles.text, { color: textColor[variant], fontSize }]}>{children}</Text>
                    ) : (
                        children
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    btn: {
        borderRadius: 10,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    fullWidth: { width: '100%' },
    content: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    text: { fontWeight: '600' },
});
