'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import Input from '@/components/ui/Input';
import { FiTrash2, FiPlus, FiGrid } from 'react-icons/fi';

// Available icons for manual selection
const AVAILABLE_ICONS = [
    'fi fi-rr-apps',
    'fi fi-rr-smartphone',
    'fi fi-rr-computer',
    'fi fi-rr-shopping-bag',
    'fi fi-rr-home',
    'fi fi-rr-heart',
    'fi fi-rr-gamepad',
    'fi fi-rr-book',
    'fi fi-rr-paw',
    'fi fi-rr-football',
    'fi fi-rr-star',
    'fi fi-rr-camera',
    'fi fi-rr-music',
    'fi fi-rr-gift',
    'fi fi-rr-coffee',
    'fi fi-rr-car',
    'fi fi-rr-plane',
    'fi fi-rr-user',
    'fi fi-rr-settings',
    'fi fi-rr-search'
];

export default function AdminCategoriesPage() {
    const { categories, fetchCategories, createCategory, deleteCategory, isLoading } = useAdminStore();
    const [newCategory, setNewCategory] = useState({ name: '', slug: '', icon: 'fi fi-rr-apps' });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        // Removed auto-icon logic
        setNewCategory(prev => ({ ...prev, name, slug }));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsCreating(true);
            await createCategory(newCategory);
            setNewCategory({ name: '', slug: '', icon: 'fi fi-rr-apps' });
        } catch (error: any) {
            alert(error.message || 'Failed to create category');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this category? Products in this category might be affected.')) return;
        try {
            await deleteCategory(id);
        } catch (error: any) {
            alert(error.message || 'Failed to delete category');
        }
    };

    if (isLoading && categories.length === 0) return <Loading fullScreen text="Loading categories..." />;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Category Management</h1>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Create Form */}
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <h3 className="font-bold flex items-center gap-2">
                                <FiPlus className="text-primary" /> Add New Category
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Icon</label>
                                    <div className="grid grid-cols-5 gap-2 p-2 border rounded-lg max-h-48 overflow-y-auto">
                                        {AVAILABLE_ICONS.map(icon => (
                                            <button
                                                key={icon}
                                                type="button"
                                                onClick={() => setNewCategory({ ...newCategory, icon })}
                                                className={`p-2 rounded hover:bg-gray-100 flex items-center justify-center transition-colors ${newCategory.icon === icon ? 'bg-primary/10 text-primary ring-2 ring-primary ring-inset' : 'text-gray-500'}`}
                                                title={icon}
                                            >
                                                <i className={`${icon} text-xl`}></i>
                                            </button>
                                        ))}
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
                                    disabled
                                    className="bg-gray-50"
                                />
                                <Button type="submit" fullWidth isLoading={isCreating}>
                                    Create Category
                                </Button>
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
                                    <div key={cat._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary/20 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-white flex items-center justify-center text-primary border shadow-sm">
                                                <i className={`${cat.icon && cat.icon.startsWith('fi') ? cat.icon : 'fi fi-rr-apps'} text-lg`}></i>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{cat.name}</p>
                                                <p className="text-xs text-gray-400 font-mono">{cat.slug}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(cat._id)}
                                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"
                                            title="Delete Category"
                                        >
                                            <FiTrash2 />
                                        </button>
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
