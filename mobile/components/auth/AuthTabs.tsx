import React from 'react';
import { View, StyleSheet } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { TouchableOpacity, Text } from 'react-native';

export default function AuthTabs() {
    const pathname = usePathname();
    const router = useRouter();

    // Simplified vendor check
    const isVendor = pathname.startsWith('/vendor');

    // Determine if we are in a registration context
    const isRegisterPage = pathname.includes('register') || pathname.includes('signup');

    return (
        <View style={styles.flexCenterMb8}>
            <View style={styles.bgGray100P1RoundedLgFlexShadowInner}>
                <TouchableOpacity
                    onPress={() => router.push(isRegisterPage ? '/(tabs)/signup' : '/(tabs)/signin')}
                    style={[
                        styles.baseTab,
                        !isVendor ? styles.activeBuyerTab : styles.inactiveTab
                    ]}
                >
                    <Feather name="user" size={16} color={!isVendor ? '#FFF' : '#6B7280'} />
                    <Text style={[styles.textMedium, !isVendor ? styles.textWhite : styles.textGray500]}>Buyer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => router.push((isRegisterPage ? '/vendor-register' : '/vendor-login') as any)}
                    style={[
                        styles.baseTab,
                        isVendor ? styles.activeVendorTab : styles.inactiveTab
                    ]}
                >
                    <Feather name="shopping-bag" size={16} color={isVendor ? '#FFF' : '#6B7280'} />
                    <Text style={[styles.textMedium, isVendor ? styles.textWhite : styles.textGray500]}>Vendor</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    flexCenterMb8: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 32,
    },
    bgGray100P1RoundedLgFlexShadowInner: {
        backgroundColor: '#F3F4F6',
        padding: 4,
        borderRadius: 8,
        flexDirection: 'row',
        // shadow-inner equivalent
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    baseTab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 6,
    },
    activeBuyerTab: {
        backgroundColor: '#00A651',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    activeVendorTab: {
        backgroundColor: '#00A651',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    inactiveTab: {
        backgroundColor: 'transparent',
    },
    textMedium: {
        fontSize: 14,
        fontWeight: '500',
    },
    textWhite: {
        color: '#FFFFFF',
    },
    textGray500: {
        color: '#6B7280',
    }
});
