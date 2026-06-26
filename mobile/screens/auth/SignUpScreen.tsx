import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Keyboard, Platform, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import AuthTabs from '@/components/auth/AuthTabs';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '@/utils/validation';
import * as z from 'zod';

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function SignUpScreen() {
    const router = useRouter();
    const { register } = useAuthStore();

    const { control, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            role: 'user',
            country: 'India',
        }
    });

    const [showPassword, setShowPassword] = useState(false);
    const [agreeToPolicies, setAgreeToPolicies] = useState(false);
    const [apiError, setApiError] = useState('');
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

    const onSubmit = async (data: RegisterFormValues) => {
        setIsLoading(true);
        setApiError('');

        if (!agreeToPolicies) {
            setApiError('Please agree to the Privacy Policy & Terms to continue.');
            setIsLoading(false);
            return;
        }
        try {
            await register(data);
            router.replace('/');
        } catch (err: any) {
            setApiError(err.message || 'Registration failed. Please try again.');
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
                {/* Brand */}
                <View style={styles.brand}>
                    <Text style={styles.logo}>offers buddy</Text>
                    <Text style={styles.tagline}>Join thousands of smart shoppers</Text>
                </View>

                {/* Card */}
                <View style={styles.card}>
                    <AuthTabs />
                    <Text style={styles.title}>Create your account</Text>
                    <Text style={styles.subtitle}>
                        Already have one?{' '}
                        <Link href="/(tabs)/signin" style={styles.link}>Sign in</Link>
                    </Text>

                    {apiError !== '' && (
                        <View style={styles.errorBox}>
                            <Feather name="alert-circle" size={14} color="#C62828" />
                            <Text style={styles.errorText}>{apiError}</Text>
                        </View>
                    )}

                    {/* Name */}
                    <Text style={styles.label}>Full Name</Text>
                    <Controller
                        control={control}
                        name="name"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <View style={[styles.inputRow, errors.name && styles.inputErrorRow]}>
                                <Feather name="user" size={18} color={errors.name ? "#C62828" : "#888"} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="John Doe"
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
                                    autoCapitalize="words"
                                    onFocus={(e) => {
                                        (e.target as any)?.measureLayout?.(
                                            scrollViewRef.current,
                                            (_x: number, y: number) => scrollToInput(y),
                                            () => { }
                                        );
                                    }}
                                />
                            </View>
                        )}
                    />
                    {errors.name && <Text style={styles.validationError}>{errors.name.message}</Text>}

                    {/* Email */}
                    <Text style={styles.label}>Email address</Text>
                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <View style={[styles.inputRow, errors.email && styles.inputErrorRow]}>
                                <Feather name="mail" size={18} color={errors.email ? "#C62828" : "#888"} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="you@example.com"
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
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
                        )}
                    />
                    {errors.email && <Text style={styles.validationError}>{errors.email.message}</Text>}

                    {/* Password */}
                    <Text style={styles.label}>Password</Text>
                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { onChange, onBlur, value } }) => (
                            <View style={[styles.inputRow, errors.password && styles.inputErrorRow]}>
                                <Feather name="lock" size={18} color={errors.password ? "#C62828" : "#888"} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="••••••••"
                                    onBlur={onBlur}
                                    onChangeText={onChange}
                                    value={value}
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
                        )}
                    />
                    {errors.password && <Text style={styles.validationError}>{errors.password.message}</Text>}

                    {/* Policies row */}
                    <View style={{ marginTop: 20 }}>
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }} onPress={() => setAgreeToPolicies(!agreeToPolicies)}>
                            <View style={[styles.checkbox, agreeToPolicies && styles.checkboxChecked, { marginTop: 2 }]}>
                                {agreeToPolicies && <Feather name="check" size={12} color="#FFF" />}
                            </View>
                            <Text style={[styles.terms, { marginTop: 0, textAlign: 'left', flex: 1 }]}>
                                I agree to the <Link href={"/policies" as any} style={styles.link}>Terms of Service</Link> and <Link href={"/policies" as any} style={styles.link}>Privacy Policy</Link>.
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Submit */}
                    <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit(onSubmit)} disabled={isLoading}>
                        {isLoading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Text style={styles.submitBtnText}>Create Account</Text>
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
    subtitle: { fontSize: 14, color: '#888', marginBottom: 14 },
    link: { color: '#00A651', fontWeight: '600' },
    errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFEBEE', borderRadius: 8, padding: 12, marginBottom: 14 },
    errorText: { flex: 1, fontSize: 13, color: '#C62828' },
    validationError: { fontSize: 12, color: '#C62828', marginTop: 4, marginLeft: 2 },
    label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 14 },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FAFAFA' },
    inputErrorRow: { borderColor: '#C62828', backgroundColor: '#FFF5F5' },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, fontSize: 14, color: '#333' },
    submitBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#00A651', paddingVertical: 14, borderRadius: 10, marginTop: 22 },
    submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
    terms: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 14, lineHeight: 18 },
    checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#CCC', justifyContent: 'center', alignItems: 'center' },
    checkboxChecked: { backgroundColor: '#00A651', borderColor: '#00A651' },
});
