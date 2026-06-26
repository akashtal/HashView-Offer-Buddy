import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useVendorStore } from '@/store/vendorStore';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import axios from 'axios';

import { Image } from 'expo-image';
export default function VendorOnboardingScreen() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const { createVendorProfile, isLoading, error: storeError, myVendorProfile, fetchMyProfile } = useVendorStore();

    const [categories, setCategories] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        shopName: '',
        category: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        shopDescription: '',
        shopLogo: '',
        coordinates: [0, 0] as [number, number],
        // KYC Documents
        idProofUrl: '',
        idProofType: 'aadhaar' as 'aadhaar' | 'pan' | 'voter_id' | 'passport',
        businessDocUrl: '',
        businessDocType: 'gst_certificate' as 'gst_certificate' | 'trade_license' | 'udyam' | 'other',
    });

    // UI states for expanding dropdowns manually since we don't have a reliable select
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [showIdPicker, setShowIdPicker] = useState(false);
    const [showDocPicker, setShowDocPicker] = useState(false);

    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadingIdProof, setUploadingIdProof] = useState(false);
    const [uploadingBusinessDoc, setUploadingBusinessDoc] = useState(false);

    const handleAddressSelect = (details: any) => {
        setFormData(prev => ({
            ...prev,
            address: details.address || prev.address,
            city: details.city || prev.city,
            state: details.state || prev.state,
            pincode: details.pincode || prev.pincode,
            coordinates: [details.coordinates.longitude, details.coordinates.latitude]
        }));
    };

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'vendor') {
            router.push('/(tabs)/signin');
        } else {
            if (user.phone) {
                setFormData(prev => ({ ...prev, phone: user.phone! }));
            }
        }
    }, [isAuthenticated, user, router]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await axios.get('/api/categories?parentOnly=true');
                const data = response.data;
                if (data?.data?.categories) {
                    setCategories(data.data.categories);
                    if (data.data.categories.length > 0) {
                        setFormData(prev => ({ ...prev, category: data.data.categories[0]._id }));
                    }
                }
            } catch (err) {
                console.error('Failed to load categories');
            }
        };
        loadCategories();
    }, []);

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // MOCK UPLOAD FOR NOW
    const mockImageUpload = (setter: any, field: string) => {
        setter(true);
        setTimeout(() => {
            setFormData(prev => ({ ...prev, [field]: 'https://placehold.co/400x400/png' }));
            setter(false);
        }, 1500);
    };

    const handleImageUpload = () => mockImageUpload(setUploading, 'shopLogo');
    const handleIdProofUpload = () => mockImageUpload(setUploadingIdProof, 'idProofUrl');
    const handleBusinessDocUpload = () => mockImageUpload(setUploadingBusinessDoc, 'businessDocUrl');

    const handleSubmit = async () => {
        setError('');

        if (!formData.category) {
            setError('Please select a business category');
            return;
        }

        try {
            const payload: any = {
                shopName: formData.shopName,
                shopDescription: formData.shopDescription,
                shopLogo: formData.shopLogo,
                category: formData.category,
                contactInfo: {
                    phone: formData.phone,
                    email: user?.email,
                },
                location: {
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode,
                    country: 'India',
                    coordinates: formData.coordinates
                }
            };

            if (formData.idProofUrl || formData.businessDocUrl) {
                payload.kycDocuments = { status: 'pending' };
                if (formData.idProofUrl) {
                    payload.kycDocuments.idProof = {
                        url: formData.idProofUrl,
                        type: formData.idProofType,
                        uploadedAt: new Date(),
                    };
                }
                if (formData.businessDocUrl) {
                    payload.kycDocuments.businessDocument = {
                        url: formData.businessDocUrl,
                        type: formData.businessDocType,
                        uploadedAt: new Date(),
                    };
                }
            }

            await createVendorProfile(payload);
            router.push('/vendor/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to create profile');
        }
    };

    const idProofOptions = [
        { label: 'Aadhaar Card', value: 'aadhaar' },
        { label: 'PAN Card', value: 'pan' },
        { label: 'Voter ID', value: 'voter_id' },
        { label: 'Passport', value: 'passport' },
    ];

    const businessDocOptions = [
        { label: 'GST Certificate', value: 'gst_certificate' },
        { label: 'Trade License', value: 'trade_license' },
        { label: 'Udyam Registration', value: 'udyam' },
        { label: 'Other', value: 'other' },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Setup Your Shop</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Card>
                    <CardHeader style={{ alignItems: 'center' }}>
                        <Text style={styles.pageTitle}>Setup Your Shop</Text>
                        <Text style={styles.pageSub}>Tell us about your business to get started</Text>
                    </CardHeader>
                    <CardBody>
                        <View style={styles.formSpace}>
                            {(error || storeError) ? (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorText}>{error || storeError}</Text>
                                </View>
                            ) : null}

                            {/* Basic Info */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Feather name="shopping-bag" size={20} color="#002B4E" />
                                    <Text style={styles.sectionTitle}>Business Details</Text>
                                </View>

                                {/* Shop Logo Upload */}
                                <View style={styles.fieldBlock}>
                                    <Text style={styles.label}>Store Logo / Image</Text>
                                    {formData.shopLogo ? (
                                        <View style={styles.logoPreview}>
                                            <Image source={{ uri: formData.shopLogo }} style={styles.logoImg} />
                                            <TouchableOpacity style={styles.removeBtn} onPress={() => handleChange('shopLogo', '')}>
                                                <Feather name="x" size={16} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TouchableOpacity style={styles.uploadBox} onPress={handleImageUpload} disabled={uploading}>
                                            {uploading ? (
                                                <ActivityIndicator size="small" color="#002B4E" />
                                            ) : (
                                                <>
                                                    <Feather name="upload" size={24} color="#6B7280" style={{ marginBottom: 8 }} />
                                                    <Text style={styles.uploadText}><Text style={{ fontWeight: 'bold' }}>Click to upload</Text> store image</Text>
                                                    <Text style={styles.uploadSub}>PNG, JPG (MAX. 5MB)</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <Input
                                    label="Shop Name"
                                    placeholder="e.g. John's Electronics"
                                    value={formData.shopName}
                                    onChangeText={(val) => handleChange('shopName', val)}
                                />

                                <View style={styles.fieldBlock}>
                                    <Text style={styles.label}>Category</Text>
                                    <TouchableOpacity style={styles.pickerBox} onPress={() => setShowCategoryPicker(!showCategoryPicker)}>
                                        <Text style={styles.pickerText}>
                                            {categories.find(c => c._id === formData.category)?.name || 'Select a category'}
                                        </Text>
                                        <Feather name="chevron-down" size={20} color="#6B7280" />
                                    </TouchableOpacity>
                                    {showCategoryPicker && (
                                        <View style={styles.pickerList}>
                                            {categories.map(cat => (
                                                <TouchableOpacity
                                                    key={cat._id}
                                                    style={styles.pickerItem}
                                                    onPress={() => { handleChange('category', cat._id); setShowCategoryPicker(false); }}
                                                >
                                                    <Text style={styles.pickerItemText}>{cat.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                <Input
                                    label="Description"
                                    placeholder="Tell customers what you sell..."
                                    value={formData.shopDescription}
                                    onChangeText={(val) => handleChange('shopDescription', val)}
                                // Use View-based input wrapper manually to give it height, but Input is fixed in ui
                                />
                            </View>

                            {/* Contact & Location */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Feather name="map-pin" size={20} color="#002B4E" />
                                    <Text style={styles.sectionTitle}>Location & Contact</Text>
                                </View>

                                {/* Input component in our UI supports icon but passing it requires slightly different structure. 
                                    Since our Input uses icons internally if coded, else we just use normal Input. */}
                                <Input
                                    label="Business Phone"
                                    placeholder="+91 9876543210"
                                    value={formData.phone}
                                    onChangeText={(val) => handleChange('phone', val)}
                                    keyboardType="phone-pad"
                                />

                                <AddressAutocomplete
                                    label="Street Address"
                                    placeholder="Search for your shop location..."
                                    value={formData.address}
                                    onChange={(val) => handleChange('address', val)}
                                    onSelect={handleAddressSelect}
                                />

                                <View style={styles.row}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <Input
                                            label="City"
                                            placeholder="Bangalore"
                                            value={formData.city}
                                            onChangeText={(val) => handleChange('city', val)}
                                        />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <Input
                                            label="Pincode"
                                            placeholder="560001"
                                            value={formData.pincode}
                                            onChangeText={(val) => handleChange('pincode', val)}
                                            keyboardType="number-pad"
                                        />
                                    </View>
                                </View>

                                <Input
                                    label="State"
                                    placeholder="Karnataka"
                                    value={formData.state}
                                    onChangeText={(val) => handleChange('state', val)}
                                />
                            </View>

                            {/* KYC Documents */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Feather name="file-text" size={20} color="#002B4E" />
                                    <Text style={styles.sectionTitle}>KYC Documents</Text>
                                </View>
                                <Text style={styles.kycDesc}>
                                    Upload your ID proof and business documents for verification. These will be reviewed by our team.
                                </Text>

                                {/* ID Proof */}
                                <View style={styles.fieldBlock}>
                                    <Text style={styles.label}>ID Proof</Text>
                                    <TouchableOpacity style={styles.pickerBox} onPress={() => setShowIdPicker(!showIdPicker)}>
                                        <Text style={styles.pickerText}>
                                            {idProofOptions.find(o => o.value === formData.idProofType)?.label}
                                        </Text>
                                        <Feather name="chevron-down" size={20} color="#6B7280" />
                                    </TouchableOpacity>
                                    {showIdPicker && (
                                        <View style={styles.pickerList}>
                                            {idProofOptions.map(opt => (
                                                <TouchableOpacity
                                                    key={opt.value}
                                                    style={styles.pickerItem}
                                                    onPress={() => { handleChange('idProofType', opt.value); setShowIdPicker(false); }}
                                                >
                                                    <Text style={styles.pickerItemText}>{opt.label}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}

                                    {formData.idProofUrl ? (
                                        <View style={styles.successUploadBox}>
                                            <Feather name="file-text" size={20} color="#16A34A" />
                                            <Text style={styles.successUploadText}>ID Proof uploaded successfully</Text>
                                            <TouchableOpacity onPress={() => handleChange('idProofUrl', '')}>
                                                <Feather name="x" size={18} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TouchableOpacity style={styles.uploadBoxSmall} onPress={handleIdProofUpload} disabled={uploadingIdProof}>
                                            {uploadingIdProof ? (
                                                <ActivityIndicator size="small" color="#002B4E" />
                                            ) : (
                                                <>
                                                    <Feather name="upload" size={20} color="#6B7280" style={{ marginBottom: 4 }} />
                                                    <Text style={styles.uploadText}>Click to upload ID proof</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Business Doc */}
                                <View style={styles.fieldBlock}>
                                    <Text style={styles.label}>Business Document</Text>
                                    <TouchableOpacity style={styles.pickerBox} onPress={() => setShowDocPicker(!showDocPicker)}>
                                        <Text style={styles.pickerText}>
                                            {businessDocOptions.find(o => o.value === formData.businessDocType)?.label}
                                        </Text>
                                        <Feather name="chevron-down" size={20} color="#6B7280" />
                                    </TouchableOpacity>
                                    {showDocPicker && (
                                        <View style={styles.pickerList}>
                                            {businessDocOptions.map(opt => (
                                                <TouchableOpacity
                                                    key={opt.value}
                                                    style={styles.pickerItem}
                                                    onPress={() => { handleChange('businessDocType', opt.value); setShowDocPicker(false); }}
                                                >
                                                    <Text style={styles.pickerItemText}>{opt.label}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}

                                    {formData.businessDocUrl ? (
                                        <View style={styles.successUploadBox}>
                                            <Feather name="file-text" size={20} color="#16A34A" />
                                            <Text style={styles.successUploadText}>Business document uploaded successfully</Text>
                                            <TouchableOpacity onPress={() => handleChange('businessDocUrl', '')}>
                                                <Feather name="x" size={18} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TouchableOpacity style={styles.uploadBoxSmall} onPress={handleBusinessDocUpload} disabled={uploadingBusinessDoc}>
                                            {uploadingBusinessDoc ? (
                                                <ActivityIndicator size="small" color="#002B4E" />
                                            ) : (
                                                <>
                                                    <Feather name="upload" size={20} color="#6B7280" style={{ marginBottom: 4 }} />
                                                    <Text style={styles.uploadText}>Click to upload business document</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            <View style={{ paddingTop: 16 }}>
                                <Button
                                    variant="primary"
                                    fullWidth
                                    size="lg"
                                    isLoading={isLoading}
                                    onPress={handleSubmit}
                                >
                                    Create Shop Profile
                                </Button>
                            </View>
                        </View>
                    </CardBody>
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#E5E7EB' },
    backBtn: { padding: 4, marginRight: 12 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
    scrollContent: { padding: 16, paddingBottom: 100 },
    pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#002B4E', marginBottom: 4 },
    pageSub: { fontSize: 14, color: '#6B7280' },
    formSpace: { gap: 24, paddingVertical: 8 },

    errorBox: { padding: 12, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 8 },
    errorText: { color: '#B91C1C', fontSize: 13 },

    section: { gap: 16 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderColor: '#E5E7EB', paddingBottom: 8, marginBottom: 8 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#002B4E' },

    fieldBlock: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },

    logoPreview: { width: 120, height: 120, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', position: 'relative' },
    logoImg: { width: '100%', height: '100%' },
    removeBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: '#EF4444', borderRadius: 12, padding: 4 },

    uploadBox: { width: '100%', height: 120, borderWidth: 2, borderColor: '#D1D5DB', borderStyle: 'dashed', borderRadius: 8, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
    uploadBoxSmall: { width: '100%', height: 80, borderWidth: 2, borderColor: '#D1D5DB', borderStyle: 'dashed', borderRadius: 8, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
    uploadText: { fontSize: 13, color: '#6B7280' },
    uploadSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

    pickerBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#F9FAFB' },
    pickerText: { fontSize: 15, color: '#111827' },
    pickerList: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, backgroundColor: '#FFF', marginTop: 4, overflow: 'hidden' },
    pickerItem: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: '#F3F4F6' },
    pickerItemText: { fontSize: 15, color: '#374151' },

    row: { flexDirection: 'row' },
    kycDesc: { fontSize: 13, color: '#6B7280', marginBottom: 8 },

    successUploadBox: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 8, marginTop: 8 },
    successUploadText: { flex: 1, fontSize: 13, color: '#15803D' },
});
