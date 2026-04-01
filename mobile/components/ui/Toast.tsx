import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
}

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
    const [opacity] = useState(new Animated.Value(0));

    useEffect(() => {
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        const timer = setTimeout(() => {
            Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => onClose());
        }, duration);
        return () => clearTimeout(timer);
    }, []);

    const iconName: Record<ToastType, string> = {
        success: 'check-circle',
        error: 'alert-circle',
        info: 'info',
    };

    const bg: Record<ToastType, string> = {
        success: '#2E7D32',
        error: '#C62828',
        info: '#1565C0',
    };

    return (
        <Animated.View style={[styles.container, { backgroundColor: bg[type], opacity }]}>
            <Feather name={iconName[type] as any} size={20} color="#FFF" />
            <Text style={styles.message}>{message}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={16} color="#FFF" />
            </TouchableOpacity>
        </Animated.View>
    );
}

// Toast Hook
let toastId = 0;

interface ToastInstance {
    id: number;
    message: string;
    type: ToastType;
}

export function useToast() {
    const [toasts, setToasts] = useState<ToastInstance[]>([]);

    const showToast = (message: string, type: ToastType = 'success') => {
        const id = toastId++;
        setToasts((prev) => [...prev, { id, message, type }]);
    };

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const ToastContainer = () => (
        <View style={toastContainerStyles.stack} pointerEvents="none">
            {toasts.map((t) => (
                <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
            ))}
        </View>
    );

    return { showToast, ToastContainer };
}

const toastContainerStyles = StyleSheet.create({
    stack: { position: 'absolute', top: 60, right: 16, left: 16, zIndex: 9999 },
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    message: { flex: 1, color: '#FFF', fontWeight: '600', fontSize: 14 },
    closeBtn: { padding: 2 },
});
