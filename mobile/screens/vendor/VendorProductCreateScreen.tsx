import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/authStore';
import { useVendorStore } from '@/store/vendorStore';
import axios from 'axios';
import { Alert } from 'react-native';

import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import { Modal } from 'react-native';

import { Image } from 'expo-image';
export default function VendorProductCreateScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user, isAuthenticated } = useAuthStore();
    const { myVendorProfile, fetchMyProfile } = useVendorStore();

    const [categories, setCategories] = useState<any[]>([]);
    const [subcategories, setSubcategories] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        subcategory: '',
        priceOriginal: '',
        priceDiscounted: '',
        offerDescription: '',
        offerType: 'discount',
        validUntil: '',
    });

    // UI Helpers
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [showSubcategoryPicker, setShowSubcategoryPicker] = useState(false);
    const [showOfferPicker, setShowOfferPicker] = useState(false);
    const [hasDiscount, setHasDiscount] = useState(false);

    // Category Creation
    const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryImage, setNewCategoryImage] = useState('');
    const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);
    const [creatingCategory, setCreatingCategory] = useState(false);

    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // If we come back from the AI enhance screen with an enhanced image, add it
    useEffect(() => {
        const aiUrl = params.aiEnhancedUrl as string;
        if (aiUrl) {
            setImages(prev => prev.includes(aiUrl) ? prev : [aiUrl, ...prev]);
        }
    }, [params.aiEnhancedUrl]);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'vendor') {
            router.push('/(tabs)/signin' as any);
            return;
        }
        fetchMyProfile().catch(() => router.push('/vendor/onboarding'));
    }, [isAuthenticated, user, router, fetchMyProfile]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await axios.get('/api/categories?parentOnly=true');
                if (response.data && response.data.data) {
                    setCategories(response.data.data.categories);
                }
            } catch (err) {
                console.error('Failed to load categories');
            }
        };
        loadCategories();
    }, []);

    useEffect(() => {
        const loadSubcategories = async () => {
            try {
                const response = await axios.get('/api/vendor/subcategories');
                if (response.data && response.data.success) {
                    setSubcategories(response.data.data.subcategories || []);
                }
            } catch (err) {
                console.error('Failed to load subcategories');
            }
        };
        loadSubcategories();
    }, []);

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            setError('Please enter a category name');
            return;
        }
        setCreatingCategory(true);
        setError('');
        try {
            const token = useAuthStore.getState().token;
            const slug = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const response = await axios.post('/api/categories',
                {
                    name: newCategoryName.trim(),
                    slug,
                    ...(newCategoryImage ? { image: newCategoryImage } : {}),
                },
                {}
            );
            const newCat = response.data.data.category;
            setCategories(prev => [...prev, newCat]);
            handleChange('category', newCat._id);
            setNewCategoryName('');
            setNewCategoryImage('');
            setShowCreateCategoryModal(false);
            setShowCategoryPicker(false);
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message || 'Failed to create category';
            setError(msg);
        } finally {
            setCreatingCategory(false);
        }
    };

    // No native image picker used — vendors paste a URL instead (avoids requiring a native rebuild)

    /** Shared helper: pick from photo library → upload → return hosted URL */
    const pickAndUploadImage = async (): Promise<string | null> => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Allow photo library access to upload images.');
            return null;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.85,
        });
        if (result.canceled || !result.assets?.[0]) return null;

        const asset = result.assets[0];
        const token = useAuthStore.getState().token;
        const formData = new FormData();
        formData.append('file', {
            uri: asset.uri,
            type: asset.mimeType || 'image/jpeg',
            name: asset.fileName || 'upload.jpg',
        } as any);
        const res = await axios.post('/api/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...({}),
            },
        });
        return res.data.data.url as string;
    };

    const handleImageUpload = async () => {
        if (images.length >= 10) return;
        setUploading(true);
        try {
            const url = await pickAndUploadImage();
            if (url) setImages(prev => [...prev, url]);
        } catch (err: any) {
            Alert.alert('Upload failed', err.message || 'Could not upload image');
        } finally {
            setUploading(false);
        }
    };

    const handlePickCategoryImage = async () => {
        setUploadingCategoryImage(true);
        try {
            const url = await pickAndUploadImage();
            if (url) setNewCategoryImage(url);
        } catch (err: any) {
            Alert.alert('Upload failed', err.message || 'Could not upload category image');
        } finally {
            setUploadingCategoryImage(false);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setError('');
        setIsLoading(true);

        try {
            if (!formData.category) throw new Error('Please select a category');

            const priceOriginal = parseFloat(formData.priceOriginal);
            const priceDiscounted = formData.priceDiscounted ? parseFloat(formData.priceDiscounted) : undefined;

            if (images.length === 0) throw new Error('Please upload at least one image');

            const payload: any = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                subcategory: formData.subcategory || undefined,
                images,
                price: {
                    original: priceOriginal,
                    currency: 'INR'
                },
                isActive: true
            };

            if (hasDiscount) {
                if (priceDiscounted && priceDiscounted >= priceOriginal) {
                    throw new Error('Discounted price must be less than original price');
                }
                payload.price.discounted = priceDiscounted;

                if (formData.offerDescription && formData.validUntil) {
                    payload.offer = {
                        type: formData.offerType,
                        description: formData.offerDescription,
                        // Simplistic date translation
                        validUntil: new Date(formData.validUntil).toISOString()
                    };
                }
            }

            await axios.post('/api/products', payload);
            router.push('/vendor/dashboard');

        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to create product');
        } finally {
            setIsLoading(false);
        }
    };

    if (!myVendorProfile) {
        return <Loading fullScreen />;
    }

    const offerTypeOptions = [
        { label: 'Discount', value: 'discount' },
        { label: 'Buy 1 Get 1', value: 'bogo' },
        { label: 'Clearance', value: 'clearance' },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Feather name="arrow-left" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add New Product</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

                    {/* Basic Info */}
                    <Card style={styles.cardSpacing}>
                        <CardHeader style={styles.cardHeader}>
                            <Feather name="package" size={18} color="#002B4E" />
                            <Text style={styles.cardTitle}>Basic Information</Text>
                        </CardHeader>
                        <CardBody style={styles.fieldSpacing}>
                            <Input
                                label="Product Title"
                                placeholder="e.g. Wireless Headphones"
                                value={formData.title}
                                onChangeText={(val) => handleChange('title', val)}
                            />

                            <Input
                                label="Description"
                                placeholder="Product description..."
                                value={formData.description}
                                onChangeText={(val) => handleChange('description', val)}
                            />

                            <View>
                                <Text style={styles.label}>Category</Text>
                                <TouchableOpacity style={styles.pickerBox} onPress={() => setShowCategoryPicker(!showCategoryPicker)}>
                                    <Text style={styles.pickerText}>
                                        {categories.find(c => c._id === formData.category)?.name || 'Select Category'}
                                    </Text>
                                    <Feather name="chevron-down" size={20} color="#6B7280" />
                                </TouchableOpacity>
                                {showCategoryPicker && (
                                    <View style={styles.pickerList}>
                                        {categories?.map(cat => (
                                            <TouchableOpacity
                                                key={cat._id}
                                                style={styles.pickerItem}
                                                onPress={() => { handleChange('category', cat._id); setShowCategoryPicker(false); setShowSubcategoryPicker(false); handleChange('subcategory', ''); }}
                                            >
                                                <Text style={styles.pickerItemText}>{cat.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                        {/* ── Create New Category ── */}
                                        <TouchableOpacity
                                            style={[styles.pickerItem, styles.createCategoryItem]}
                                            onPress={() => { setShowCategoryPicker(false); setShowCreateCategoryModal(true); }}
                                        >
                                            <Feather name="plus-circle" size={16} color="#4F46E5" style={{ marginRight: 8 }} />
                                            <Text style={styles.createCategoryText}>Create New Category</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            <View>
                                <Text style={styles.label}>Subcategory (Optional)</Text>
                                <TouchableOpacity style={styles.pickerBox} onPress={() => setShowSubcategoryPicker(!showSubcategoryPicker)}>
                                    <Text style={styles.pickerText}>
                                        {subcategories.find(c => c._id === formData.subcategory)?.name || 'Select Subcategory'}
                                    </Text>
                                    <Feather name="chevron-down" size={20} color="#6B7280" />
                                </TouchableOpacity>
                                {showSubcategoryPicker && (
                                    <View style={styles.pickerList}>
                                        <TouchableOpacity
                                            style={styles.pickerItem}
                                            onPress={() => { handleChange('subcategory', ''); setShowSubcategoryPicker(false); }}
                                        >
                                            <Text style={styles.pickerItemText}>None</Text>
                                        </TouchableOpacity>
                                        {subcategories?.map(cat => (
                                            <TouchableOpacity
                                                key={cat._id}
                                                style={styles.pickerItem}
                                                onPress={() => { handleChange('subcategory', cat._id); setShowSubcategoryPicker(false); }}
                                            >
                                                <Text style={styles.pickerItemText}>{cat.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </CardBody>
                    </Card>

                    {/* Pricing */}
                    <Card style={styles.cardSpacing}>
                        <CardHeader style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Pricing & Offer</Text>
                        </CardHeader>
                        <CardBody style={styles.fieldSpacing}>
                            <Input
                                label="Original Price (₹)"
                                keyboardType="numeric"
                                placeholder="1000"
                                value={formData.priceOriginal}
                                onChangeText={(val) => handleChange('priceOriginal', val)}
                            />

                            <TouchableOpacity style={styles.checkboxRow} onPress={() => setHasDiscount(!hasDiscount)}>
                                <View style={[styles.checkbox, hasDiscount && styles.checkboxActive]}>
                                    {hasDiscount && <Feather name="check" size={12} color="#FFF" />}
                                </View>
                                <Text style={styles.checkboxLabel}>Run a Discount or Offer?</Text>
                            </TouchableOpacity>

                            {hasDiscount && (
                                <View style={styles.discountArea}>
                                    <Input
                                        label="Discounted Price (₹)"
                                        keyboardType="numeric"
                                        placeholder="800"
                                        value={formData.priceDiscounted}
                                        onChangeText={(val) => handleChange('priceDiscounted', val)}
                                    />

                                    <View style={styles.offerDetailsBox}>
                                        <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 12 }}>Special Offer Details</Text>
                                        <View style={{ marginBottom: 12 }}>
                                            <Input
                                                label="Offer Description"
                                                placeholder="e.g. 20% OFF"
                                                value={formData.offerDescription}
                                                onChangeText={(val) => handleChange('offerDescription', val)}
                                            />
                                        </View>

                                        <View style={{ marginBottom: 12 }}>
                                            <Text style={styles.label}>Offer Type</Text>
                                            <TouchableOpacity style={styles.pickerBox} onPress={() => setShowOfferPicker(!showOfferPicker)}>
                                                <Text style={styles.pickerText}>
                                                    {offerTypeOptions.find(o => o.value === formData.offerType)?.label || 'Discount'}
                                                </Text>
                                                <Feather name="chevron-down" size={20} color="#6B7280" />
                                            </TouchableOpacity>
                                            {showOfferPicker && (
                                                <View style={styles.pickerList}>
                                                    {offerTypeOptions.map(opt => (
                                                        <TouchableOpacity
                                                            key={opt.value}
                                                            style={styles.pickerItem}
                                                            onPress={() => { handleChange('offerType', opt.value); setShowOfferPicker(false); }}
                                                        >
                                                            <Text style={styles.pickerItemText}>{opt.label}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            )}
                                        </View>

                                        <Input
                                            label="Valid Until (YYYY-MM-DD)"
                                            placeholder="2025-12-31"
                                            value={formData.validUntil}
                                            onChangeText={(val) => handleChange('validUntil', val)}
                                        />
                                    </View>
                                </View>
                            )}
                        </CardBody>
                    </Card>

                    {/* Images */}
                    <Card style={styles.cardSpacing}>
                        <CardHeader style={styles.cardHeader}>
                            <Feather name="image" size={18} color="#002B4E" />
                            <Text style={styles.cardTitle}>Images</Text>
                        </CardHeader>
                        <CardBody>
                            <View style={styles.imageGrid}>
                                {images?.map((url, index) => (
                                    <View key={index} style={styles.imgWrapper}>
                                        <Image source={{ uri: url }} style={styles.prodImg} />
                                        <TouchableOpacity style={styles.removeImgBtn} onPress={() => removeImage(index)}>
                                            <Feather name="x" size={12} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                ))}

                                {images.length < 10 && (
                                    <TouchableOpacity style={styles.uploadImgBox} onPress={handleImageUpload} disabled={uploading}>
                                        {uploading ? (
                                            <ActivityIndicator size="small" color="#002B4E" />
                                        ) : (
                                            <>
                                                <Feather name="upload" size={20} color="#9CA3AF" style={{ marginBottom: 4 }} />
                                                <Text style={{ fontSize: 11, color: '#6B7280', textAlign: 'center' }}>Upload</Text>
                                                <Text style={{ fontSize: 9, color: '#9CA3AF' }}>(Max 10)</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* AI Enhance Banner */}
                            {images.length > 0 && (
                                <TouchableOpacity
                                    style={styles.aiEnhanceBanner}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/vendor/products/ai-enhance',
                                            params: {
                                                imageUrl: images[0],
                                                productId: 'preview',
                                                productName: formData.title || 'product',
                                            },
                                        } as any)
                                    }
                                >
                                    <View style={styles.aiEnhanceBannerLeft}>
                                        <Text style={styles.aiEnhanceBannerIcon}>✨</Text>
                                        <View>
                                            <Text style={styles.aiEnhanceBannerTitle}>Enhance with AI</Text>
                                            <Text style={styles.aiEnhanceBannerSub}>Transform into pro e-commerce photos</Text>
                                        </View>
                                    </View>
                                    <Feather name="chevron-right" size={18} color="#7C3AED" />
                                </TouchableOpacity>
                            )}
                        </CardBody>
                    </Card>

                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        isLoading={isLoading}
                        onPress={handleSubmit}
                        style={{ marginTop: 8 }}
                    >
                        Create Product
                    </Button>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Create Category Modal */}
            <Modal
                visible={showCreateCategoryModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCreateCategoryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Create New Category</Text>

                        {/* Category Image — tap to pick from photo library */}
                        <View style={styles.catImageSection}>
                            <Text style={styles.catImageLabel}>
                                Category Image <Text style={styles.catImageSub}>(optional)</Text>
                            </Text>
                            <TouchableOpacity
                                style={[styles.catImageBox, newCategoryImage ? styles.catImageBoxFilled : null]}
                                onPress={handlePickCategoryImage}
                                disabled={uploadingCategoryImage}
                                activeOpacity={0.75}
                            >
                                {uploadingCategoryImage ? (
                                    <ActivityIndicator size="small" color="#4F46E5" />
                                ) : newCategoryImage ? (
                                    <Image source={{ uri: newCategoryImage }} style={styles.catImagePreview} />
                                ) : (
                                    <View style={styles.catImagePlaceholder}>
                                        <Feather name="upload" size={20} color="#9CA3AF" />
                                        <Text style={styles.catImageHint}>Tap to upload</Text>
                                        <Text style={styles.catImageSubHint}>Photo library</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            {newCategoryImage ? (
                                <TouchableOpacity
                                    style={styles.catImageRemove}
                                    onPress={() => setNewCategoryImage('')}
                                >
                                    <Feather name="x" size={11} color="#FFF" />
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        <Input
                            label="Category Name"
                            placeholder="e.g. Electronics, Fashion"
                            value={newCategoryName}
                            onChangeText={setNewCategoryName}
                            autoFocus
                        />
                        {newCategoryName.trim() ? (
                            <Text style={styles.slugPreview}>
                                Slug: {newCategoryName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}
                            </Text>
                        ) : null}
                        {error ? <Text style={styles.modalError}>{error}</Text> : null}
                        <View style={styles.modalActions}>
                            <Button
                                variant="ghost"
                                onPress={() => { setShowCreateCategoryModal(false); setNewCategoryName(''); setNewCategoryImage(''); setError(''); }}
                                style={{ flex: 1 }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                isLoading={creatingCategory}
                                disabled={!newCategoryName.trim()}
                                onPress={handleCreateCategory}
                                style={{ flex: 1, marginLeft: 12 }}
                            >
                                Create
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#E5E7EB' },
    backBtn: { padding: 4, marginRight: 12 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

    scrollContent: { padding: 16, paddingBottom: 100 },
    errorBox: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA', marginBottom: 16 },
    errorText: { color: '#DC2626', fontSize: 13 },

    cardSpacing: { marginBottom: 16 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
    fieldSpacing: { gap: 16 },

    label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
    pickerBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#F9FAFB' },
    pickerText: { fontSize: 15, color: '#111827' },
    pickerList: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, backgroundColor: '#FFF', marginTop: 4, overflow: 'hidden' },
    pickerItem: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: '#F3F4F6' },
    pickerItemText: { fontSize: 15, color: '#374151' },
    createCategoryItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0FF' },
    createCategoryText: { fontSize: 15, color: '#4F46E5', fontWeight: '600' },

    checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
    checkboxActive: { backgroundColor: '#002B4E', borderColor: '#002B4E' },
    checkboxLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },

    discountArea: { marginTop: 8, paddingLeft: 12, borderLeftWidth: 2, borderColor: '#002B4E', gap: 16 },
    offerDetailsBox: { backgroundColor: '#F9FAFB', padding: 16, borderRadius: 8, marginTop: 8 },

    // AI Enhance banner
    aiEnhanceBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        backgroundColor: '#F5F3FF',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1.5,
        borderColor: '#DDD6FE',
    },
    aiEnhanceBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    aiEnhanceBannerIcon: { fontSize: 24 },
    aiEnhanceBannerTitle: { fontSize: 13, fontWeight: '700', color: '#4C1D95' },
    aiEnhanceBannerSub: { fontSize: 11, color: '#7C3AED', marginTop: 1 },

    imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    imgWrapper: { width: 70, height: 70, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', position: 'relative' },
    prodImg: { width: '100%', height: '100%', borderRadius: 8 },
    removeImgBtn: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 10, padding: 2 },
    uploadImgBox: { width: 70, height: 70, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'dashed', backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' },

    // Create Category modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalBox: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
    slugPreview: { fontSize: 12, color: '#6B7280', marginTop: 4, fontFamily: 'monospace' },
    modalError: { color: '#DC2626', fontSize: 13, marginTop: 8 },
    modalActions: { flexDirection: 'row', marginTop: 20 },

    // Category image upload
    catImageSection: { marginBottom: 16, position: 'relative', alignSelf: 'flex-start' },
    catImageBox: { width: 96, height: 96, borderRadius: 12, borderWidth: 2, borderColor: '#D1D5DB', borderStyle: 'dashed', backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    catImageBoxFilled: { borderStyle: 'solid', borderColor: '#4F46E5' },
    catImagePreview: { width: '100%', height: '100%' },
    catImagePlaceholder: { alignItems: 'center', gap: 4 },
    catImageRemove: { position: 'absolute', top: -6, right: -6, backgroundColor: '#EF4444', borderRadius: 10, padding: 3, zIndex: 10 },
    catImageLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
    catImageSub: { fontSize: 11, color: '#9CA3AF', fontWeight: '400' },
    catImageHint: { fontSize: 11, color: '#6B7280', marginTop: 2 },
    catImageSubHint: { fontSize: 10, color: '#9CA3AF' },
});
