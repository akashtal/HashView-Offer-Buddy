import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useVendorStore } from '@/store/vendorStore';
import axios from 'axios';
import * as Location from 'expo-location';

export default function VendorSettingsScreen() {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore();
    const { myVendorProfile, fetchMyProfile, isLoading: isVendorLoading } = useVendorStore();

    const [isLoading, setIsLoading] = useState(false);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const [formData, setFormData] = useState({
        shopName: '',
        shopDescription: '',
        contactInfo: {
            phone: '',
            whatsapp: '',
            email: '',
            website: ''
        },
        location: {
            address: '',
            city: '',
            state: '',
            country: 'India',
            pincode: '',
            coordinates: null as { latitude: number; longitude: number } | null,
        },
        businessHours: [] as any[]
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!isAuthenticated || (user && user.role !== 'vendor')) {
            router.push('/(tabs)/signin');
        } else {
            fetchMyProfile();
        }
    }, [isAuthenticated, user, router, fetchMyProfile]);

    useEffect(() => {
        if (myVendorProfile) {
            const coords: any = myVendorProfile.location?.coordinates;
            let latitude: number | null = null;
            let longitude: number | null = null;
            if (coords?.coordinates && Array.isArray(coords.coordinates) && coords.coordinates.length === 2) {
                [longitude, latitude] = coords.coordinates;
            }

            setFormData({
                shopName: myVendorProfile.shopName || '',
                shopDescription: myVendorProfile.shopDescription || '',
                contactInfo: {
                    phone: myVendorProfile.contactInfo?.phone || '',
                    whatsapp: myVendorProfile.contactInfo?.whatsapp || '',
                    email: myVendorProfile.contactInfo?.email || '',
                    website: myVendorProfile.contactInfo?.website || ''
                },
                location: {
                    address: myVendorProfile.location?.address || '',
                    city: myVendorProfile.location?.city || '',
                    state: myVendorProfile.location?.state || '',
                    country: myVendorProfile.location?.country || 'India',
                    pincode: myVendorProfile.location?.pincode || '',
                    coordinates: latitude && longitude ? { latitude, longitude } : null,
                },
                businessHours: myVendorProfile.businessHours || []
            });
        }
    }, [myVendorProfile]);

    const handleChange = (name: string, value: string, section?: string) => {
        if (section) {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section as keyof typeof prev] as any,
                    [name]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const detectLocationFromAddress = async () => {
        setIsDetectingLocation(true);
        setError('');
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                let location = await Location.getCurrentPositionAsync({});
                setFormData(prev => ({
                    ...prev,
                    location: {
                        ...prev.location,
                        coordinates: {
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                        }
                    }
                }));
                setSuccess('✅ Location detected from your device! Save to apply.');
                setIsDetectingLocation(false);
            } else {
                await geocodeFromAddress();
            }
        } catch (err) {
            await geocodeFromAddress();
        }
    };

    const geocodeFromAddress = async () => {
        try {
            const addressQuery = [
                formData.location.address,
                formData.location.city,
                formData.location.state,
                formData.location.pincode,
                'India'
            ].filter(Boolean).join(', ');

            const res = await axios.get(`/api/google/places/autocomplete?input=${encodeURIComponent(addressQuery)}`);
            const place = res.data?.predictions?.[0];

            if (place?.place_id) {
                const detailsRes = await axios.get(`/api/google/places/details?placeId=${place.place_id}`);
                const loc = detailsRes.data?.location;
                if (loc?.lat && loc?.lng) {
                    setFormData(prev => ({
                        ...prev,
                        location: {
                            ...prev.location,
                            coordinates: { latitude: loc.lat, longitude: loc.lng }
                        }
                    }));
                    setSuccess('✅ Location found from address! Save to apply.');
                    return;
                }
            }
            setError('Could not geocode address. Please enter coordinates manually or fill in a more specific address.');
        } catch {
            setError('Could not geocode address. Please enter coordinates manually.');
        } finally {
            setIsDetectingLocation(false);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const payload: any = {
                shopName: formData.shopName,
                shopDescription: formData.shopDescription,
                contactInfo: formData.contactInfo,
                location: {
                    address: formData.location.address,
                    city: formData.location.city,
                    state: formData.location.state,
                    country: formData.location.country,
                    pincode: formData.location.pincode,
                },
                businessHours: formData.businessHours,
            };

            if (formData.location.coordinates?.latitude && formData.location.coordinates?.longitude) {
                payload.location.coordinates = {
                    type: 'Point',
                    coordinates: [
                        formData.location.coordinates.longitude,
                        formData.location.coordinates.latitude,
                    ],
                };
            }

            await axios.put('/api/vendors/me', payload);
            setSuccess('Shop profile updated successfully');
            fetchMyProfile();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update shop profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to log out of your vendor account?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        router.replace('/(tabs)/signin');
                    }
                }
            ]
        );
    };

    if (isVendorLoading || !myVendorProfile) {
        return (
            <View style={styles.centerFlex}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerBox}>
                <TouchableOpacity onPress={() => router.push('/vendor/dashboard')} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Shop Settings</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={handleLogout} style={styles.logoutHeaderBtn}>
                    <Feather name="log-out" size={20} color="#DC2626" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    {success ? <Text style={styles.successText}>{success}</Text> : null}

                    {/* Basic Info */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Feather name="shopping-bag" size={18} color="#111827" />
                            <Text style={styles.cardHeaderTxt}>Basic Information</Text>
                        </View>
                        <View style={styles.cardBody}>
                            <Text style={styles.inputLabel}>Shop Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.shopName}
                                onChangeText={(val) => handleChange('shopName', val)}
                                placeholder="Enter shop name"
                            />

                            <Text style={styles.inputLabel}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.shopDescription}
                                onChangeText={(val) => handleChange('shopDescription', val)}
                                placeholder="Describe your shop..."
                                multiline
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* Contact Info */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Feather name="phone" size={18} color="#111827" />
                            <Text style={styles.cardHeaderTxt}>Contact Information</Text>
                        </View>
                        <View style={styles.cardBody}>
                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.contactInfo.phone}
                                onChangeText={(val) => handleChange('phone', val, 'contactInfo')}
                                keyboardType="phone-pad"
                            />
                            <Text style={styles.inputLabel}>WhatsApp</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.contactInfo.whatsapp}
                                onChangeText={(val) => handleChange('whatsapp', val, 'contactInfo')}
                                keyboardType="phone-pad"
                            />
                            <Text style={styles.inputLabel}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.contactInfo.email}
                                onChangeText={(val) => handleChange('email', val, 'contactInfo')}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <Text style={styles.inputLabel}>Website</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.contactInfo.website}
                                onChangeText={(val) => handleChange('website', val, 'contactInfo')}
                                keyboardType="url"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    {/* Location Info */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Feather name="map-pin" size={18} color="#111827" />
                            <Text style={styles.cardHeaderTxt}>Location</Text>
                        </View>
                        <View style={styles.cardBody}>
                            <Text style={styles.inputLabel}>Address</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.location.address}
                                onChangeText={(val) => handleChange('address', val, 'location')}
                            />
                            <View style={styles.rowGrid}>
                                <View style={styles.colHalf}>
                                    <Text style={styles.inputLabel}>City</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.location.city}
                                        onChangeText={(val) => handleChange('city', val, 'location')}
                                    />
                                </View>
                                <View style={styles.colHalf}>
                                    <Text style={styles.inputLabel}>Pincode</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.location.pincode}
                                        onChangeText={(val) => handleChange('pincode', val, 'location')}
                                    />
                                </View>
                            </View>
                            <View style={styles.rowGrid}>
                                <View style={styles.colHalf}>
                                    <Text style={styles.inputLabel}>State</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.location.state}
                                        onChangeText={(val) => handleChange('state', val, 'location')}
                                    />
                                </View>
                                <View style={styles.colHalf}>
                                    <Text style={styles.inputLabel}>Country</Text>
                                    <TextInput
                                        style={[styles.input, styles.inputDisabled]}
                                        value={formData.location.country}
                                        editable={false}
                                    />
                                </View>
                            </View>

                            <View style={styles.gpsBox}>
                                <View style={styles.gpsHeader}>
                                    <View>
                                        <Text style={styles.gpsTitle}>GPS Coordinates</Text>
                                        <Text style={styles.gpsSub}>Required to show distance</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={detectLocationFromAddress}
                                        disabled={isDetectingLocation}
                                        style={[styles.detectBtn, isDetectingLocation && styles.btnDisabled]}
                                    >
                                        <Feather name="navigation" size={14} color="#FFF" style={{ marginRight: 6 }} />
                                        <Text style={styles.detectBtnTxt}>{isDetectingLocation ? 'Detecting...' : 'Detect location'}</Text>
                                    </TouchableOpacity>
                                </View>

                                {formData.location.coordinates ? (
                                    <View style={styles.gpsFoundBox}>
                                        <Feather name="map-pin" size={16} color="#16A34A" />
                                        <View style={styles.flex1M12}>
                                            <Text style={styles.gpsFoundTx1}>✅ Location set</Text>
                                            <Text style={styles.gpsFoundTx2}>
                                                Lat: {formData.location.coordinates.latitude.toFixed(6)},
                                                Lng: {formData.location.coordinates.longitude.toFixed(6)}
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setFormData(prev => ({ ...prev, location: { ...prev.location, coordinates: null } }))}>
                                            <Text style={styles.gpsRemoveTxt}>Remove</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.gpsMissingBox}>
                                        <Text style={styles.gpsMissingTxt}>⚠️ No GPS coordinates set. Customers will not see distance to your shop.</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, isLoading && styles.btnDisabled]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? <ActivityIndicator color="#FFF" /> : (
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
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
    logoutHeaderBtn: { padding: 8, backgroundColor: '#FEE2E2', borderRadius: 8 },

    scrollContent: { padding: 16, paddingBottom: 100 },

    errorText: { backgroundColor: '#FEE2E2', color: '#DC2626', padding: 12, borderRadius: 8, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#FCA5A5' },
    successText: { backgroundColor: '#DCFCE7', color: '#16A34A', padding: 12, borderRadius: 8, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#86EFAC' },

    card: { backgroundColor: '#FFF', borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#F3F4F6', padding: 16, gap: 8 },
    cardHeaderTxt: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
    cardBody: { padding: 16 },

    inputLabel: { fontSize: 13, fontWeight: '500', color: '#4B5563', marginBottom: 6 },
    input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827', marginBottom: 16 },
    inputDisabled: { backgroundColor: '#F3F4F6', color: '#9CA3AF' },
    textArea: { height: 100 },
    rowGrid: { flexDirection: 'row', gap: 12 },
    colHalf: { flex: 1 },

    gpsBox: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 8, padding: 12, marginTop: 8 },
    gpsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    gpsTitle: { fontSize: 14, fontWeight: '600', color: '#1E40AF' },
    gpsSub: { fontSize: 11, color: '#6B7280' },
    detectBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
    detectBtnTxt: { color: '#FFF', fontSize: 12, fontWeight: '600' },

    gpsFoundBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', padding: 12, borderRadius: 6 },
    flex1M12: { flex: 1, marginLeft: 12 },
    gpsFoundTx1: { fontSize: 13, fontWeight: '600', color: '#166534' },
    gpsFoundTx2: { fontSize: 11, color: '#4B5563', marginTop: 2 },
    gpsRemoveTxt: { fontSize: 12, color: '#DC2626', fontWeight: '500', marginLeft: 12 },

    gpsMissingBox: { backgroundColor: '#FEF3C7', padding: 12, borderRadius: 6 },
    gpsMissingTxt: { fontSize: 12, color: '#92400E' },

    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5', borderRadius: 8, paddingVertical: 14, marginTop: 8 },
    saveBtnTxt: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    btnDisabled: { opacity: 0.7 },
});
