import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useVendorStore } from '@/store/vendorStore';
import axios from 'axios';

import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import AiEnhanceModal from '@/components/ui/AiEnhanceModal';

export default function VendorProductEditScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const id = params.id as string;

    const { user, isAuthenticated } = useAuthStore();
    const { fetchMyProfile } = useVendorStore();

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

    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [showAiModal, setShowAiModal] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'vendor') {
            router.push('/(tabs)/signin');
            return;
        }
        fetchMyProfile().catch(() => router.push('/vendor/onboarding'));
    }, [isAuthenticated, user, router, fetchMyProfile]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [categoriesRes, subcategoriesRes, productRes] = await Promise.all([
                    axios.get('/api/categories?parentOnly=true'),
                    axios.get('/api/vendor/subcategories'),
                    axios.get(`/api/products/${id}`)
                ]);

                if (categoriesRes.data && categoriesRes.data.data) {
                    setCategories(categoriesRes.data.data.categories);
                }

                if (subcategoriesRes.data && subcategoriesRes.data.success) {
                    setSubcategories(subcategoriesRes.data.data.subcategories || []);
                }

                const product = productRes.data.data.product;

                setFormData({
                    title: product.title || '',
                    description: product.description || '',
                    category: product.category?._id || product.category || '',
                    subcategory: product.subcategory?._id || product.subcategory || '',
                    priceOriginal: product.price?.original?.toString() || '',
                    priceDiscounted: product.price?.discounted?.toString() || '',
                    offerDescription: product.offer?.description || '',
                    offerType: product.offer?.type || 'discount',
                    validUntil: product.offer?.validUntil ? new Date(product.offer.validUntil).toISOString().split('T')[0] : '',
                });

                setHasDiscount(!!product.price?.discounted);
                setImages(product.images || []);
                setIsLoading(false);
            } catch (err: any) {
                console.error('Failed to load data', err);
                setError('Failed to load product details');
                setIsLoading(false);
            }
        };

        if (isAuthenticated && id) {
            loadData();
        }
    }, [id, isAuthenticated]);

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = () => {
        setUploading(true);
        setTimeout(() => {
            if (images.length < 10) {
                setImages(prev => [...prev, `https://placehold.co/400x400/png?text=Item+${prev.length + 1}`]);
            }
            setUploading(false);
        }, 1500);
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setError('');
        setIsSaving(true);

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
                        validUntil: new Date(formData.validUntil).toISOString()
                    };
                }
            }

            await axios.put(`/api/products/${id}`, payload);
            router.push('/vendor/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to update product');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <Loading fullScreen text="Loading product..." />;
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
                    <Text style={styles.headerTitle}>Edit Product</Text>
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
                                        {categories.map(cat => (
                                            <TouchableOpacity
                                                key={cat._id}
                                                style={styles.pickerItem}
                                                onPress={() => { handleChange('category', cat._id); setShowCategoryPicker(false); setShowSubcategoryPicker(false); handleChange('subcategory', ''); }}
                                            >
                                                <Text style={styles.pickerItemText}>{cat.name}</Text>
                                            </TouchableOpacity>
                                        ))}
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
                                        {subcategories.map(cat => (
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
                                {images.map((url, index) => (
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
                                    onPress={() => setShowAiModal(true)}
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
                        isLoading={isSaving}
                        onPress={handleSubmit}
                        style={{ marginTop: 8 }}
                    >
                        Save Changes
                    </Button>

                </ScrollView>
            </KeyboardAvoidingView>

            <AiEnhanceModal
                visible={showAiModal}
                onClose={() => setShowAiModal(false)}
                imageUrl={images[0] || ''}
                productId={id}
                productName={formData.title}
                onSuccess={(newImageUrl) => {
                    setImages(prev => [newImageUrl, ...prev]);
                }}
            />
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
});
