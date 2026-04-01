import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';
import AuthTabs from '@/components/auth/AuthTabs';

export default function SignUpScreen() {
    const router = useRouter();
    const { register } = useAuthStore();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = async () => {
        if (!name || !email || !password) {
            setError('Please fill in all required fields.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await register({ name, email, password, role: 'user' });
            router.replace('/');
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.container}>
                    {/* Brand */}
                    <View style={styles.brand}>
                        <Text style={styles.logo}>Offer Buddy</Text>
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

                        {error !== '' && (
                            <View style={styles.errorBox}>
                                <Feather name="alert-circle" size={14} color="#C62828" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Name */}
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputRow}>
                            <Feather name="user" size={18} color="#888" style={styles.inputIcon} />
                            <TextInput style={styles.input} placeholder="John Doe" value={name} onChangeText={setName} autoCapitalize="words" />
                        </View>

                        {/* Email */}
                        <Text style={styles.label}>Email address</Text>
                        <View style={styles.inputRow}>
                            <Feather name="mail" size={18} color="#888" style={styles.inputIcon} />
                            <TextInput style={styles.input} placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                        </View>

                        {/* Password */}
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputRow}>
                            <Feather name="lock" size={18} color="#888" style={styles.inputIcon} />
                            <TextInput style={[styles.input, { flex: 1 }]} placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#888" />
                            </TouchableOpacity>
                        </View>

                        {/* Submit */}
                        <TouchableOpacity style={styles.submitBtn} onPress={handleSignUp} disabled={isLoading}>
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Text style={styles.submitBtnText}>Create Account</Text>
                                    <Feather name="arrow-right" size={16} color="#FFF" />
                                </>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.terms}>
                            By creating an account, you agree to our{' '}
                            <Text style={styles.link}>Terms of Service</Text> and{' '}
                            <Text style={styles.link}>Privacy Policy</Text>.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F9F9F9' },
    container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    brand: { alignItems: 'center', marginBottom: 28 },
    logo: { fontSize: 30, fontWeight: 'bold', color: '#FDB913', letterSpacing: -0.5 },
    tagline: { fontSize: 14, color: '#888', marginTop: 4 },
    card: { backgroundColor: '#FFF', borderRadius: 18, padding: 24, borderWidth: 1, borderColor: '#EEE' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#282C3F', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#888', marginBottom: 14 },
    link: { color: '#00A651', fontWeight: '600' },
    errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFEBEE', borderRadius: 8, padding: 12, marginBottom: 14 },
    errorText: { flex: 1, fontSize: 13, color: '#C62828' },
    label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 14 },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FAFAFA' },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, fontSize: 14, color: '#333' },
    submitBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#00A651', paddingVertical: 14, borderRadius: 10, marginTop: 22 },
    submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
    terms: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 14, lineHeight: 18 },
});
