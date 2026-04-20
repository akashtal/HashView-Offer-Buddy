import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Keyboard, Platform, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import AuthTabs from '@/components/auth/AuthTabs';

export default function SignInScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ from?: string }>();
    const { login } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const scrollViewRef = useRef<ScrollView>(null);
    const keyboardPadding = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const keyboardShowListener = Keyboard.addListener(showEvent, (e) => {
            Animated.timing(keyboardPadding, {
                toValue: e.endCoordinates.height,
                duration: Platform.OS === 'ios' ? e.duration : 200,
                useNativeDriver: false,
            }).start();
        });

        const keyboardHideListener = Keyboard.addListener(hideEvent, (e) => {
            Animated.timing(keyboardPadding, {
                toValue: 0,
                duration: Platform.OS === 'ios' ? (e.duration || 250) : 200,
                useNativeDriver: false,
            }).start();
        });

        return () => {
            keyboardShowListener.remove();
            keyboardHideListener.remove();
        };
    }, []);

    const handleSignIn = async () => {
        if (!email || !password) {
            setError('Please enter your email and password.');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const role = await login(email, password);
            if (role === 'admin') {
                router.replace('/admin/dashboard' as any);
            } else if (role === 'vendor') {
                router.replace('/vendor/dashboard' as any);
            } else {
                router.replace((params.from as any) || '/');
            }
        } catch (err: any) {
            setError(err.message || 'Invalid credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const scrollToInput = (y: number) => {
        scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 100), animated: true });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                {/* Logo / Brand */}
                <View style={styles.brand}>
                    <Text style={styles.logo}>offers buddy</Text>
                    <Text style={styles.tagline}>Find the best deals near you</Text>
                </View>

                {/* Card */}
                <View style={styles.card}>
                    <AuthTabs />
                    <Text style={styles.title}>Sign in to your account</Text>
                    <Text style={styles.subtitle}>
                        Don't have one?{' '}
                        <Link href="/(tabs)/signup" style={styles.link}>Create a new account</Link>
                    </Text>

                    {error !== '' && (
                        <View style={styles.errorBox}>
                            <Feather name="alert-circle" size={14} color="#C62828" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* Email */}
                    <Text style={styles.label}>Email address</Text>
                    <View style={styles.inputRow}>
                        <Feather name="mail" size={18} color="#888" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="you@example.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            onFocus={(e) => {
                                (e.target as any)?.measureLayout?.(
                                    scrollViewRef.current,
                                    (_x: number, y: number) => scrollToInput(y),
                                    () => { }
                                );
                            }}
                        />
                    </View>

                    {/* Password */}
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputRow}>
                        <Feather name="lock" size={18} color="#888" style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            onFocus={(e) => {
                                (e.target as any)?.measureLayout?.(
                                    scrollViewRef.current,
                                    (_x: number, y: number) => scrollToInput(y),
                                    () => { }
                                );
                            }}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#888" />
                        </TouchableOpacity>
                    </View>

                    {/* Options row */}
                    <View style={styles.optionsRow}>
                        <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
                            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                                {rememberMe && <Feather name="check" size={12} color="#FFF" />}
                            </View>
                            <Text style={styles.rememberText}>Remember me</Text>
                        </TouchableOpacity>
                        <Link href="/(tabs)/forgot-password" style={styles.link}>Forgot your password?</Link>
                    </View>

                    {/* Submit */}
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSignIn} disabled={isLoading}>
                        {isLoading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Text style={styles.submitBtnText}>Sign in</Text>
                                <Feather name="arrow-right" size={16} color="#FFF" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Animated bottom spacer that grows when keyboard is visible */}
                <Animated.View style={{ height: keyboardPadding }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F9F9F9' },
    container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
    brand: { alignItems: 'center', marginBottom: 28 },
    logo: { fontSize: 30, fontWeight: 'bold', color: '#FDB913', letterSpacing: -0.5 },
    tagline: { fontSize: 14, color: '#888', marginTop: 4 },
    card: { backgroundColor: '#FFF', borderRadius: 18, padding: 24, borderWidth: 1, borderColor: '#EEE' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#282C3F', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#888', marginBottom: 18 },
    link: { color: '#00A651', fontWeight: '600' },
    errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFEBEE', borderRadius: 8, padding: 12, marginBottom: 16 },
    errorText: { flex: 1, fontSize: 13, color: '#C62828' },
    label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 14 },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FAFAFA' },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, fontSize: 14, color: '#333' },
    optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
    rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#CCC', justifyContent: 'center', alignItems: 'center' },
    checkboxChecked: { backgroundColor: '#FDB913', borderColor: '#FDB913' },
    rememberText: { fontSize: 13, color: '#555' },
    submitBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#282C3F', paddingVertical: 14, borderRadius: 10, marginTop: 22 },
    submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});
