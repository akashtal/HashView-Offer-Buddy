import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import axios from 'axios';

export default function ForgotPasswordScreen() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState<'email' | 'reset'>('email');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOTP = async () => {
        if (!email) { setError('Please enter your email.'); return; }
        setIsLoading(true); setError(''); setSuccess('');
        try {
            const result = await axios.post('/api/auth/forgot-password', { email });
            if (result.data.success) {
                setSuccess(result.data.message || 'OTP sent successfully to your email.');
                setStep('reset');
            } else {
                setError(result.data.error || 'Something went wrong. Please try again.');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
        if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setIsLoading(true); setError('');
        try {
            const result = await axios.post('/api/auth/reset-password', { email, otp, password: newPassword });
            if (result.data.success) {
                setSuccess('Password reset successfully! Redirecting to sign in...');
                setTimeout(() => { router.replace('/(tabs)/signin'); }, 2000);
            } else {
                setError(result.data.error || 'Invalid OTP or expired. Please try again.');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.container}>
                    <View style={styles.card}>
                        <Text style={styles.title}>
                            {step === 'email' ? 'Forgot password?' : 'Reset your password'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {step === 'email'
                                ? "No worries, we'll send you an OTP to your email."
                                : "Enter the 6-digit OTP sent to your email and your new password."}
                        </Text>

                        {error !== '' && (
                            <View style={styles.errorBox}>
                                <Feather name="alert-circle" size={14} color="#C62828" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}
                        {success !== '' && error === '' && (
                            <View style={styles.successBox}>
                                <Feather name="check-circle" size={14} color="#2E7D32" />
                                <Text style={styles.successText}>{success}</Text>
                            </View>
                        )}

                        {step === 'email' ? (
                            <>
                                <Text style={styles.label}>Email address</Text>
                                <View style={styles.inputRow}>
                                    <Feather name="mail" size={18} color="#888" style={styles.inputIcon} />
                                    <TextInput style={styles.input} placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                                </View>
                                <TouchableOpacity style={styles.submitBtn} onPress={handleSendOTP} disabled={isLoading}>
                                    {isLoading ? <ActivityIndicator color="#FFF" /> : (
                                        <><Text style={styles.submitBtnText}>Send OTP</Text><Feather name="send" size={16} color="#FFF" /></>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={styles.label}>6-Digit OTP</Text>
                                <TextInput
                                    style={[styles.otpInput]}
                                    placeholder="000000"
                                    value={otp}
                                    onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />

                                <Text style={styles.label}>New Password</Text>
                                <View style={styles.inputRow}>
                                    <Feather name="lock" size={18} color="#888" style={styles.inputIcon} />
                                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="••••••••" value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" />
                                </View>

                                <Text style={styles.label}>Confirm New Password</Text>
                                <View style={styles.inputRow}>
                                    <Feather name="lock" size={18} color="#888" style={styles.inputIcon} />
                                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="••••••••" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" />
                                </View>

                                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#00A651' }]} onPress={handleResetPassword} disabled={isLoading}>
                                    {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Reset Password</Text>}
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.resendBtn} onPress={() => setStep('email')}>
                                    <Text style={styles.resendText}>Resend OTP</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        <Link href="/(tabs)/signin" style={styles.backLink}>
                            <Feather name="arrow-left" size={14} /> Back to sign in
                        </Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F9F9F9' },
    container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    card: { backgroundColor: '#FFF', borderRadius: 18, padding: 24, borderWidth: 1, borderColor: '#EEE' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#282C3F', marginBottom: 6 },
    subtitle: { fontSize: 14, color: '#888', marginBottom: 18, lineHeight: 20 },
    errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFEBEE', borderRadius: 8, padding: 12, marginBottom: 14 },
    errorText: { flex: 1, fontSize: 13, color: '#C62828' },
    successBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E8F5E9', borderRadius: 8, padding: 12, marginBottom: 14 },
    successText: { flex: 1, fontSize: 13, color: '#2E7D32' },
    label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 14 },
    inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FAFAFA' },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, fontSize: 14, color: '#333' },
    otpInput: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 14, fontSize: 24, textAlign: 'center', letterSpacing: 12, backgroundColor: '#FAFAFA' },
    submitBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#282C3F', paddingVertical: 14, borderRadius: 10, marginTop: 22 },
    submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
    resendBtn: { alignItems: 'center', marginTop: 14 },
    resendText: { fontSize: 14, color: '#555' },
    backLink: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 4, color: '#00A651', fontSize: 14, fontWeight: '600' },
});
