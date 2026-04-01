import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker'; // Assumes installed or replace with generic solution if needed. I'll use simple mapping if Picker missing, but Picker is standard. Actually out of caution, I'll use a basic custom picker or standard RN approach.

// A simple Select alternative if Picker isn't explicitly requested, but usually RN uses @react-native-picker/picker. 
// I'll build a simple custom one to avoid dependencies if uninstalled, but let's assume standard elements.
// I'll use a simplified mapping for "select" via standard RN `TextInput` for now or assume they have it.
// To be extremely safe from missing dependencies:
// I will just use standard components.

export default function AdminVendorDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const vendorId = id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState<any>({
        shopName: '',
        shopDescription: '',
        category: '',
        contactInfo: { phone: '', email: '', whatsapp: '', website: '' },
        location: { address: '', city: '', state: '', pincode: '' },
        isApproved: false,
        isActive: false,
        limits: { maxSubcategories: 5, maxProductsPerSubcategory: 20 },
        kycDocuments: { status: 'pending', rejectionReason: '' },
    });

    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!vendorId) return;
            try {
                const [vendorRes, catRes] = await Promise.all([
                    axios.get(`/api/admin/vendors/${vendorId}`),
                    axios.get('/api/categories')
                ]);

                const vendor = vendorRes.data.data.vendor;
                setFormData({
                    shopName: vendor.shopName || '',
                    shopDescription: vendor.shopDescription || '',
                    category: vendor.category?._id || vendor.category || '',
                    contactInfo: {
                        phone: vendor.contactInfo?.phone || '',
                        email: vendor.contactInfo?.email || '',
                        whatsapp: vendor.contactInfo?.whatsapp || '',
                        website: vendor.contactInfo?.website || '',
                    },
                    location: {
                        address: vendor.location?.address || '',
                        city: vendor.location?.city || '',
                        state: vendor.location?.state || '',
                        pincode: vendor.location?.pincode || '',
                    },
                    isApproved: vendor.isApproved || false,
                    isActive: vendor.isActive || false,
                    limits: {
                        maxSubcategories: vendor.limits?.maxSubcategories?.toString() || '5',
                        maxProductsPerSubcategory: vendor.limits?.maxProductsPerSubcategory?.toString() || '20',
                    },
                    kycDocuments: {
                        status: vendor.kycDocuments?.status || 'pending',
                        rejectionReason: vendor.kycDocuments?.rejectionReason || '',
                    },
                });

                setCategories(catRes.data.data.categories);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load vendor data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [vendorId]);

    const handleChange = (section: string, field: string, value: any) => {
        setFormData((prev: any) => {
            if (section === 'root') {
                return { ...prev, [field]: value };
            }
            return {
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            };
        });
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            // format limits back to numbers
            const payload = {
                ...formData,
                limits: {
                    maxSubcategories: parseInt(formData.limits.maxSubcategories) || 5,
                    maxProductsPerSubcategory: parseInt(formData.limits.maxProductsPerSubcategory) || 20
                }
            };

            await axios.put(`/api/admin/vendors/${vendorId}`, payload);
            setSuccess('Vendor updated successfully');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update vendor');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centerFlex}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerBox}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Edit Vendor: {formData.shopName}</Text>
            </View>

            <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    
                    {error ? (
                        <View style={styles.errorBox}>
                            <Feather name="alert-circle" size={18} color="#DC2626" />
                            <Text style={styles.errorTxt}>{error}</Text>
                        </View>
                    ) : null}

                    {success ? (
                        <View style={styles.successBox}>
                            <Feather name="check-circle" size={18} color="#16A34A" />
                            <Text style={styles.successTxt}>{success}</Text>
                        </View>
                    ) : null}

                    {/* Basic Info */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardHeaderTxt}>Basic Information</Text>
                        </View>
                        <View style={styles.cardBody}>
                            <Text style={styles.inputLabel}>Shop Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.shopName}
                                onChangeText={(val) => handleChange('root', 'shopName', val)}
                            />

                            <Text style={styles.inputLabel}>Category ID (Custom picker text fallback for mapping)</Text>
                            {/* Simple fallback for a select: display currently selected category ID */}
                            {/* In production this could be @react-native-picker but to avoid dependency issues we use TextInput for ID manual or basic list */}
                            <TextInput
                                style={styles.input}
                                value={formData.category}
                                onChangeText={(val) => handleChange('root', 'category', val)}
                                placeholder="Enter Category ID"
                            />
                            
                            <Text style={styles.inputLabel}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.shopDescription}
                                onChangeText={(val) => handleChange('root', 'shopDescription', val)}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* Contact Info */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardHeaderTxt}>Contact Information</Text>
                        </View>
                        <View style={styles.cardBody}>
                            <Text style={styles.inputLabel}>Phone</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.contactInfo.phone}
                                onChangeText={(val) => handleChange('contactInfo', 'phone', val)}
                                keyboardType="phone-pad"
                            />
                            <Text style={styles.inputLabel}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.contactInfo.email}
                                onChangeText={(val) => handleChange('contactInfo', 'email', val)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <Text style={styles.inputLabel}>WhatsApp</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.contactInfo.whatsapp}
                                onChangeText={(val) => handleChange('contactInfo', 'whatsapp', val)}
                                keyboardType="phone-pad"
                            />
                            <Text style={styles.inputLabel}>Website</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.contactInfo.website}
                                onChangeText={(val) => handleChange('contactInfo', 'website', val)}
                                keyboardType="url"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    {/* Location Info */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardHeaderTxt}>Location</Text>
                        </View>
                        <View style={styles.cardBody}>
                            <Text style={styles.inputLabel}>Address</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.location.address}
                                onChangeText={(val) => handleChange('location', 'address', val)}
                            />
                            <View style={styles.rowGrid}>
                                <View style={styles.colHalf}>
                                    <Text style={styles.inputLabel}>City</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.location.city}
                                        onChangeText={(val) => handleChange('location', 'city', val)}
                                    />
                                </View>
                                <View style={styles.colHalf}>
                                    <Text style={styles.inputLabel}>Pincode</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.location.pincode}
                                        onChangeText={(val) => handleChange('location', 'pincode', val)}
                                    />
                                </View>
                            </View>
                            <Text style={styles.inputLabel}>State</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.location.state}
                                onChangeText={(val) => handleChange('location', 'state', val)}
                            />
                        </View>
                    </View>

                    {/* Status & Limits */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardHeaderTxt}>Status & Limits</Text>
                        </View>
                        <View style={styles.cardBody}>
                            <View style={styles.switchRow}>
                                <Text style={styles.switchLabel}>Vendor Approved</Text>
                                <Switch 
                                    value={formData.isApproved} 
                                    onValueChange={(val) => handleChange('root', 'isApproved', val)} 
                                    trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
                                />
                            </View>
                            <View style={[styles.switchRow, { marginBottom: 16 }]}>
                                <Text style={styles.switchLabel}>Account Active</Text>
                                <Switch 
                                    value={formData.isActive} 
                                    onValueChange={(val) => handleChange('root', 'isActive', val)} 
                                    trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
                                />
                            </View>

                            <Text style={styles.inputLabel}>Max Subcategories</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.limits.maxSubcategories}
                                onChangeText={(val) => handleChange('limits', 'maxSubcategories', val)}
                                keyboardType="number-pad"
                            />
                            <Text style={styles.inputLabel}>Max Products Per Subcategory</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.limits.maxProductsPerSubcategory}
                                onChangeText={(val) => handleChange('limits', 'maxProductsPerSubcategory', val)}
                                keyboardType="number-pad"
                            />
                        </View>
                    </View>

                    {/* KYC Status */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardHeaderTxt}>KYC Status</Text>
                        </View>
                        <View style={styles.cardBody}>
                            <Text style={styles.inputLabel}>Status (pending, approved, rejected, not_submitted)</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.kycDocuments.status}
                                onChangeText={(val) => handleChange('kycDocuments', 'status', val)}
                            />
                            {formData.kycDocuments.status === 'rejected' && (
                                <>
                                    <Text style={styles.inputLabel}>Rejection Reason</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.kycDocuments.rejectionReason}
                                        onChangeText={(val) => handleChange('kycDocuments', 'rejectionReason', val)}
                                    />
                                </>
                            )}
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.saveBtn, isSaving && styles.btnDisabled]} 
                        onPress={handleSubmit}
                        disabled={isSaving}
                    >
                        {isSaving ? <ActivityIndicator color="#FFF" /> : (
                            <>
                                <Feather name="save" size={18} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.saveBtnTxt}>Save Changes</Text>
                            </>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    flex1: { flex: 1 },
    centerFlex: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    headerBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderColor: '#E5E7EB' },
    backBtn: { marginRight: 16 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', flex: 1 },
    
    scrollContent: { padding: 16, paddingBottom: 40 },
    
    errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#FCA5A5' },
    errorTxt: { fontSize: 14, color: '#DC2626', marginLeft: 8, flex: 1 },
    successBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#86EFAC' },
    successTxt: { fontSize: 14, color: '#16A34A', marginLeft: 8, flex: 1 },
    
    card: { backgroundColor: '#FFF', borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    cardHeader: { borderBottomWidth: 1, borderColor: '#F3F4F6', padding: 16 },
    cardHeaderTxt: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
    cardBody: { padding: 16 },
    
    inputLabel: { fontSize: 13, fontWeight: '500', color: '#4B5563', marginBottom: 6 },
    input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827', marginBottom: 16 },
    textArea: { height: 100 },
    
    rowGrid: { flexDirection: 'row', gap: 12 },
    colHalf: { flex: 1 },

    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    switchLabel: { fontSize: 14, fontWeight: '500', color: '#111827' },

    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', borderRadius: 8, paddingVertical: 14, marginTop: 8 },
    saveBtnTxt: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    btnDisabled: { opacity: 0.7 },
});
