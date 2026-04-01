import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import AuthTabs from '@/components/auth/AuthTabs';

export default function VendorRegisterScreen() {
    const router = useRouter();
    const { registerVendor } = useAuthStore();

    const [shopName, setShopName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!shopName || !email || !phone || !password) {
            setError('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await registerVendor({ shopName, email, phone, password });
            router.push('/vendor/dashboard');
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Switch Link */}
                    <View style={styles.headerBox}>

                        <View style={styles.switchRow}>
                            <Text style={styles.switchText}>Already a vendor? </Text>
                            <TouchableOpacity onPress={() => router.push('/vendor-login' as any)}>
                                <Text style={styles.switchLink}>Sign in to portal</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Register Card */}
                    <View style={styles.card}>
                        <AuthTabs />

                        <View style={styles.formSpace}>
                            {error ? (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Business / Shop Name</Text>
                                <View style={styles.inputBox}>
                                    <Feather name="briefcase" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="My Awesome Store"
                                        placeholderTextColor="#9CA3AF"
                                        value={shopName}
                                        onChangeText={setShopName}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Business Email</Text>
                                <View style={styles.inputBox}>
                                    <Feather name="mail" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="vendor@business.com"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={email}
                                        onChangeText={setEmail}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Contact Phone</Text>
                                <View style={styles.inputBox}>
                                    <Feather name="phone" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="9876543210"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="phone-pad"
                                        value={phone}
                                        onChangeText={setPhone}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.inputBox}>
                                    <Feather name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        placeholderTextColor="#9CA3AF"
                                        secureTextEntry
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
                                onPress={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <View style={styles.btnRow}>
                                        <Text style={styles.primaryBtnText}>Register Business</Text>
                                        <Feather name="arrow-right" size={16} color="#FFF" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footerBox}>
                            <Text style={styles.footerText}>
                                Looking for verified leads? Join India's fastest growing B2B network.
                            </Text>
                            <View style={styles.footerRow}>
                                <Text style={styles.footerRowText}>Already registered? </Text>
                                <TouchableOpacity onPress={() => router.push('/vendor-login' as any)}>
                                    <Text style={styles.footerLoginLink}>Vendor Login</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
    keyboardView: { flex: 1 },
    scrollContent: {
        padding: 16,
        paddingVertical: 32,
    },
    headerBox: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    logoHighlight: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FDB913',
    },
    logoText: {
        fontSize: 36,
        fontWeight: '800',
        color: '#111827',
    },
    badge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
        justifyContent: 'center',
    },
    badgeText: {
        fontSize: 10,
        color: '#6B7280',
    },
    tagline: {
        fontSize: 12,
        fontWeight: '500',
        color: '#4B5563',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 4,
        marginBottom: 16,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    switchText: {
        fontSize: 14,
        color: '#4B5563',
    },
    switchLink: {
        fontSize: 14,
        fontWeight: '600',
        color: '#00A651',
    },
    card: {
        backgroundColor: '#FFF',
        padding: 24,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    errorBox: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
    },
    errorText: {
        color: '#DC2626',
        fontSize: 14,
        textAlign: 'center',
    },
    formSpace: {
        gap: 20,
        marginTop: 16,
    },
    inputGroup: {
        marginBottom: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        backgroundColor: '#FFF',
    },
    inputIcon: {
        paddingHorizontal: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        paddingRight: 12,
        fontSize: 15,
        color: '#111827',
    },
    primaryBtn: {
        backgroundColor: '#002B4E',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    primaryBtnDisabled: {
        opacity: 0.7,
    },
    btnRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    primaryBtnText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
    footerBox: {
        alignItems: 'center',
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderColor: '#F3F4F6',
    },
    footerText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 12,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerRowText: {
        fontSize: 14,
        color: '#4B5563',
    },
    footerLoginLink: {
        fontSize: 14,
        fontWeight: '600',
        color: '#002B4E',
    },
});
