import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
    children: ReactNode;
    hoverable?: boolean;
    style?: ViewStyle;
}

export default function Card({ children, style }: CardProps) {
    return <View style={[styles.card, style]}>{children}</View>;
}

export function CardHeader({ children, style }: { children: ReactNode; style?: ViewStyle }) {
    return <View style={[styles.cardHeader, style]}>{children}</View>;
}

export function CardBody({ children, style }: { children: ReactNode; style?: ViewStyle }) {
    return <View style={[styles.cardBody, style]}>{children}</View>;
}

export function CardFooter({ children, style }: { children: ReactNode; style?: ViewStyle }) {
    return <View style={[styles.cardFooter, style]}>{children}</View>;
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 12,
        overflow: 'hidden',
    },
    cardHeader: {
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderColor: '#EEEEEE',
    },
    cardBody: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 12,
    },
    cardFooter: {
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#F9F9F9',
        borderTopWidth: 1,
        borderColor: '#EEEEEE',
    },
});
