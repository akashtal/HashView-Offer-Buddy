'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import Input from '@/components/ui/Input';
import { FiTrash2, FiPlus, FiGrid, FiUpload, FiImage, FiEdit2, FiX } from 'react-icons/fi';
import Image from 'next/image';
import axios from 'axios';

export default function AdminCategoriesPage() {
    const { categories, fetchCategories, createCategory, updateCategory, deleteCategory, isLoading } = useAdminStore();
    const [newCategory, setNewCategory] = useState({ name: '', slug: '', image: '' });
    const [isCreating, setIsCreating] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        setNewCategory(prev => ({ ...prev, name, slug }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                setNewCategory(prev => ({ ...prev, image: response.data.data.url }));
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsCreating(true);
            if (editingId) {
                await updateCategory(editingId, newCategory);
                alert('Category updated successfully');
            } else {
                await createCategory(newCategory);
            }
            handleCancel();
        } catch (error: any) {
            alert(error.message || 'Failed to save category');
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

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this category? Products in this category might be affected.')) return;
        try {
            await deleteCategory(id);
            if (editingId === id) handleCancel();
        } catch (error: any) {
            alert(error.message || 'Failed to delete category');
        }
    };

    if (isLoading && categories.length === 0) return <Loading fullScreen text="Loading categories..." />;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Category Management</h1>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Create/Edit Form */}
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <h3 className="font-bold flex items-center gap-2">
                                {editingId ? <FiEdit2 className="text-secondary" /> : <FiPlus className="text-primary" />}
                                {editingId ? 'Edit Category' : 'Add New Category'}
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Category Image</label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                                            {uploading ? (
                                                <Loading />
                                            ) : newCategory.image ? (
                                                <Image
                                                    src={newCategory.image}
                                                    alt="Preview"
                                                    fill
                                                    className="object-cover"
                                                    sizes="96px"
                                                />
                                            ) : (
                                                <FiImage className="text-gray-400 text-2xl" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                id="cat-image-upload"
                                            />
                                            <label
                                                htmlFor="cat-image-upload"
                                                className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                            >
                                                <FiUpload />
                                                {uploading ? 'Uploading...' : 'Upload Image'}
                                            </label>
                                            <p className="text-xs text-gray-500 mt-1">Recommended: Square, PNG/JPG</p>
                                        </div>
                                    </div>
                                </div>

                                <Input
                                    label="Category Name"
                                    value={newCategory.name}
                                    onChange={handleNameChange}
                                    required
                                    placeholder="e.g. Electronics"
                                />
                                <Input
                                    label="Slug"
                                    value={newCategory.slug}
                                    onChange={e => setNewCategory({ ...newCategory, slug: e.target.value })}
                                    placeholder="e.g. electronics"
                                    required
                                    // Slug is editable? Maybe restrict if editing, or allow. Let's allow but usually better to keep stable.
                                    // If we auto-generate on name change, better to keep it synced.
                                    className="bg-gray-50"
                                />
                                <div className="flex gap-2">
                                    <Button type="submit" fullWidth isLoading={isCreating} disabled={uploading}>
                                        {editingId ? 'Update Category' : 'Create Category'}
                                    </Button>
                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <FiX size={20} />
                                        </button>
                                    )}
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>

                {/* List */}
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <h3 className="font-bold flex items-center gap-2">
                                <FiGrid className="text-primary" /> Existing Categories
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {categories.map((cat: any) => (
                                    <div key={cat._id} className={`flex justify-between items-center p-4 rounded-lg border transition-all group ${editingId === cat._id ? 'border-primary ring-1 ring-primary bg-blue-50' : 'bg-gray-50 border-gray-100 hover:border-primary/20'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-12 h-12 rounded-lg bg-white border shadow-sm overflow-hidden flex-shrink-0">
                                                {cat.image ? (
                                                    <Image
                                                        src={cat.image}
                                                        alt={cat.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="48px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <FiImage />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 line-clamp-1">{cat.name}</p>
                                                <p className="text-xs text-gray-400 font-mono">{cat.slug}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(cat)}
                                                className="text-gray-400 hover:text-blue-500 p-2 rounded-full hover:bg-white transition-colors"
                                                title="Edit Category"
                                            >
                                                <FiEdit2 />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat._id)}
                                                className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-white transition-colors"
                                                title="Delete Category"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {categories.length === 0 && (
                                    <p className="text-gray-500 col-span-2 text-center py-4">No categories found.</p>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
