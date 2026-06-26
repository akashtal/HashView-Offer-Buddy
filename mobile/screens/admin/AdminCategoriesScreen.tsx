import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import Input from '@/components/ui/Input';
import axios from 'axios';

import { Image } from 'expo-image';
export default function AdminCategoriesScreen() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const { categories, fetchCategories, createCategory, updateCategory, deleteCategory, isLoading } = useAdminStore();

    const [newCategory, setNewCategory] = useState({ name: '', slug: '', image: '' });
    const [isCreating, setIsCreating] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/(tabs)/signin');
        } else {
            fetchCategories();
        }
    }, [isAuthenticated, user, fetchCategories, router]);

    const handleNameChange = (name: string) => {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        setNewCategory(prev => ({ ...prev, name, slug }));
    };

    const handleImageUpload = () => {
        // Mock image upload handling for React Native Expo (No expo-image-picker configured yet)
        setUploading(true);
        setTimeout(() => {
            setNewCategory(prev => ({ ...prev, image: 'https://placehold.co/400x400/png?text=Category' }));
            setUploading(false);
        }, 1500);
    };

    const handleSubmit = async () => {
        if (!newCategory.name || !newCategory.slug) {
            Alert.alert("Validation Error", "Name and Slug are required.");
            return;
        }

        try {
            setIsCreating(true);
            if (editingId) {
                await updateCategory(editingId, newCategory);
                Alert.alert("Success", "Category updated successfully");
            } else {
                await createCategory(newCategory);
                Alert.alert("Success", "Category created successfully");
            }
            handleCancel();
        } catch (error: any) {
            Alert.alert("Error", error.message || 'Failed to save category');
        } finally {
            setIsCreating(false);
        }
    };

    const handleEdit = (cat: any) => {
        setEditingId(cat._id);
        setNewCategory({ name: cat.name, slug: cat.slug, image: cat.image || '' });
    };

    const handleCancel = () => {
        setEditingId(null);
        setNewCategory({ name: '', slug: '', image: '' });
    };

    const handleDelete = (id: string, name: string) => {
        Alert.alert(
            "Delete Category",
            `Are you sure you want to delete ${name}? Products in this category might be affected.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteCategory(id);
                            if (editingId === id) handleCancel();
                        } catch (error: any) {
                            Alert.alert("Error", error.message || 'Failed to delete category');
                        }
                    }
                }
            ]
        );
    };

    if (!isAuthenticated || user?.role !== 'admin') {
        return <Loading fullScreen />;
    }

    if (isLoading && categories.length === 0) {
        return <Loading fullScreen text="Loading categories..." />;
    }

    return (
        <View style={styles.safeArea}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    {/* Create / Edit Form */}
                    <Card style={styles.formCard}>
                        <CardHeader>
                            <View style={styles.cardTitleRow}>
                                <Feather name={editingId ? 'edit-2' : 'plus'} size={18} color={editingId ? '#FDB913' : '#002B4E'} />
                                <Text style={styles.cardTitleText}>{editingId ? 'Edit Category' : 'Add New Category'}</Text>
                            </View>
                        </CardHeader>
                        <CardBody>
                            <View style={styles.formSpacing}>
                                {/* Image Upload */}
                                <View style={styles.imageUploadRow}>
                                    <View style={styles.imagePreviewBox}>
                                        {uploading ? (
                                            <ActivityIndicator color="#002B4E" />
                                        ) : newCategory.image ? (
                                            <Image source={{ uri: newCategory.image }} style={styles.previewImg} />
                                        ) : (
                                            <Feather name="image" size={24} color="#9CA3AF" />
                                        )}
                                    </View>
                                    <View style={styles.imageActions}>
                                        <TouchableOpacity style={styles.uploadBtn} onPress={handleImageUpload} disabled={uploading}>
                                            <Feather name="upload" size={16} color="#374151" />
                                            <Text style={styles.uploadBtnText}>{uploading ? 'Uploading...' : 'Upload Image'}</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.uploadHelperText}>Recommended: Square, PNG/JPG</Text>
                                    </View>
                                </View>

                                <Input
                                    label="Category Name"
                                    placeholder="e.g. Electronics"
                                    value={newCategory.name}
                                    onChangeText={handleNameChange}
                                />
                                <Input
                                    label="Slug"
                                    placeholder="e.g. electronics"
                                    value={newCategory.slug}
                                    onChangeText={(val) => setNewCategory({ ...newCategory, slug: val })}
                                    editable={false} // keeping it disabled by default for better integrity
                                />

                                <View style={styles.actionRow}>
                                    <View style={{ flex: 1 }}>
                                        <Button onPress={handleSubmit} variant="primary" isLoading={isCreating} disabled={uploading}>
                                            {editingId ? 'Update Category' : 'Create Category'}
                                        </Button>
                                    </View>
                                    {editingId && (
                                        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                                            <Feather name="x" size={20} color="#6B7280" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </CardBody>
                    </Card>

                    {/* Categories List */}
                    <Card style={styles.listCard}>
                        <CardHeader>
                            <View style={styles.cardTitleRow}>
                                <Feather name="grid" size={18} color="#002B4E" />
                                <Text style={styles.cardTitleText}>Existing Categories</Text>
                            </View>
                        </CardHeader>
                        <CardBody>
                            {categories.length === 0 ? (
                                <Text style={styles.emptyText}>No categories found.</Text>
                            ) : (
                                categories.map((cat: any) => (
                                    <View
                                        key={cat._id}
                                        style={[
                                            styles.categoryItem,
                                            editingId === cat._id && styles.categoryItemEditing
                                        ]}
                                    >
                                        <View style={styles.catItemLeft}>
                                            <View style={styles.catImgBox}>
                                                {cat.image ? (
                                                    <Image source={{ uri: cat.image }} style={styles.catImg} />
                                                ) : (
                                                    <Feather name="image" size={20} color="#D1D5DB" />
                                                )}
                                            </View>
                                            <View style={styles.catInfo}>
                                                <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
                                                <Text style={styles.catSlug} numberOfLines={1}>{cat.slug}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.catActions}>
                                            <TouchableOpacity style={styles.iconBtn} onPress={() => handleEdit(cat)}>
                                                <Feather name="edit-2" size={16} color="#3B82F6" />
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(cat._id, cat.name)}>
                                                <Feather name="trash-2" size={16} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            )}
                        </CardBody>
                    </Card>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
    scrollContent: { padding: 16, paddingBottom: 40 },

    formCard: { marginBottom: 20 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardTitleText: { fontSize: 16, fontWeight: 'bold', color: '#111827' },

    formSpacing: { gap: 16 },

    imageUploadRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
    imagePreviewBox: { width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'dashed', backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    previewImg: { width: '100%', height: '100%' },
    imageActions: { flex: 1 },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, alignSelf: 'flex-start', gap: 8 },
    uploadBtnText: { fontSize: 13, color: '#374151', fontWeight: '500' },
    uploadHelperText: { fontSize: 11, color: '#6B7280', marginTop: 6 },

    actionRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 4 },
    cancelBtn: { padding: 12, backgroundColor: '#F3F4F6', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

    listCard: { marginBottom: 16 },
    emptyText: { textAlign: 'center', color: '#6B7280', paddingVertical: 16 },

    categoryItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 12 },
    categoryItemEditing: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },

    catItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
    catImgBox: { width: 44, height: 44, borderRadius: 6, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: 12 },
    catImg: { width: '100%', height: '100%' },
    catInfo: { flex: 1 },
    catName: { fontSize: 15, fontWeight: '600', color: '#111827' },
    catSlug: { fontSize: 12, color: '#6B7280', marginTop: 2 },

    catActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    iconBtn: { padding: 8, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6' },
});
