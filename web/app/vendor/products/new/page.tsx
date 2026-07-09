'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useVendorStore } from '@/store/vendorStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import { FiPackage, FiImage, FiTag, FiUpload, FiX, FiPlus, FiFolder } from 'react-icons/fi';
import { FaIndianRupeeSign } from 'react-icons/fa6';

export default function NewProductPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const { myVendorProfile, fetchMyProfile } = useVendorStore();

    const [categories, setCategories] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        priceOriginal: '',
        priceDiscounted: '',
        offerDescription: '',
        offerType: 'discount',
        validUntil: '',

    });
    const [hasDiscount, setHasDiscount] = useState(false);

    // Image State
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Subcategory State
    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [selectedSubcategory, setSelectedSubcategory] = useState('');
    const [subcategoryUsage, setSubcategoryUsage] = useState({ used: 0, max: 5 });
    const [showCreateSubcatModal, setShowCreateSubcatModal] = useState(false);
    const [newSubcatName, setNewSubcatName] = useState('');
    const [creatingSubcat, setCreatingSubcat] = useState(false);

    // Category Creation State
    const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryImage, setNewCategoryImage] = useState('');
    const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);
    const [creatingCategory, setCreatingCategory] = useState(false);

    // Auth & Profile Check
    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'vendor') {
            router.push('/signin');
            return;
        }
        fetchMyProfile().catch(() => router.push('/vendor/onboarding'));
    }, [isAuthenticated, user, router, fetchMyProfile]);

    // Load Categories
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await fetch('/api/categories?parentOnly=true');
                const data = await response.json();
                setCategories(data.data.categories);
            } catch (err) {
                console.error('Failed to load categories');
            }
        };
        loadCategories();
    }, []);

    // Load Subcategories
    useEffect(() => {
        const loadSubcategories = async () => {
            try {
                const response = await fetch('/api/vendor/subcategories');
                const data = await response.json();
                if (data.success) {
                    setSubcategories(data.data.subcategories || []);
                    setSubcategoryUsage({
                        used: data.data.usage?.subcategoriesUsed || 0,
                        max: data.data.usage?.maxSubcategories || 5,
                    });
                }
            } catch (err) {
                console.error('Failed to load subcategories');
            }
        };
        loadSubcategories();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateSubcategory = async () => {
        if (!newSubcatName.trim() || !formData.category) {
            setError('Please enter a subcategory name and select a category first');
            return;
        }

        setCreatingSubcat(true);
        setError('');

        try {
            const response = await fetch('/api/vendor/subcategories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newSubcatName.trim(),
                    parentCategory: formData.category,
                }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create subcategory');
            }

            // Add to list and select it
            setSubcategories(prev => [data.data.subcategory, ...prev]);
            setSelectedSubcategory(data.data.subcategory._id);
            setSubcategoryUsage(prev => ({ ...prev, used: prev.used + 1 }));
            setNewSubcatName('');
            setShowCreateSubcatModal(false);
        } catch (err: any) {
            setError(err.message || 'Failed to create subcategory');
        } finally {
            setCreatingSubcat(false);
        }
    };

    const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingCategoryImage(true);
        try {
            const data = new FormData();
            data.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: data });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Upload failed');
            setNewCategoryImage(result.data.url);
        } catch (err: any) {
            setError('Failed to upload category image');
        } finally {
            setUploadingCategoryImage(false);
            e.target.value = '';
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            setError('Please enter a category name');
            return;
        }
        setCreatingCategory(true);
        setError('');
        try {
            const slug = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const token = useAuthStore.getState().token;
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    name: newCategoryName.trim(),
                    slug,
                    ...(newCategoryImage ? { image: newCategoryImage } : {}),
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create category');
            const newCat = data.data.category;
            setCategories(prev => [...prev, newCat]);
            setFormData(prev => ({ ...prev, category: newCat._id }));
            setNewCategoryName('');
            setNewCategoryImage('');
            setShowCreateCategoryModal(false);
        } catch (err: any) {
            setError(err.message || 'Failed to create category');
        } finally {
            setCreatingCategory(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setUploading(true);
        setError('');

        try {
            const uploadPromises = files.map(async (file) => {
                const data = new FormData();
                data.append('file', file);
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: data
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.error || 'Failed to upload');
                return result.data.url;
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            setImages(prev => [...prev, ...uploadedUrls]);
        } catch (err: any) {
            setError('Failed to upload some images. Please try again.');
            console.error(err);
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Validate
            if (!formData.category) throw new Error('Please select a category');

            const priceOriginal = formData.priceOriginal !== '' && !isNaN(parseFloat(formData.priceOriginal)) ? parseFloat(formData.priceOriginal) : undefined;
            const priceDiscounted = formData.priceDiscounted !== '' && !isNaN(parseFloat(formData.priceDiscounted)) ? parseFloat(formData.priceDiscounted) : undefined;

            if (images.length === 0) throw new Error('Please upload at least one image');

            const payload: any = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                subcategory: selectedSubcategory || undefined,
                images,
                isActive: true
            };

            if (priceOriginal !== undefined || priceDiscounted !== undefined) {
                payload.price = {
                    original: priceOriginal,
                    currency: 'INR'
                };
            } else {
                payload.price = { currency: 'INR' };
            }

            // Add offer/discount if specified
            if (hasDiscount) {
                if (priceDiscounted !== undefined && priceOriginal !== undefined && priceDiscounted >= priceOriginal) {
                    throw new Error('Discounted price must be less than original price');
                }
                if (!payload.price) {
                    payload.price = { currency: 'INR' };
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

            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to create product');
            router.push('/vendor/dashboard');

        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to create product');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-accent-light py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <Card>
                    <CardHeader>
                        <h1 className="text-2xl font-bold text-secondary flex items-center gap-2">
                            <FiPackage /> Add New Product
                        </h1>
                    </CardHeader>
                    <CardBody>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {error && (
                                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                                    {error}
                                </div>
                            )}

                            {/* Basic Details */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium border-b pb-2">Basic Information</h3>

                                <Input
                                    label="Product Title"
                                    name="title"
                                    placeholder="e.g. Wireless Headphones"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        rows={3}
                                        className="input-field w-full py-2"
                                        value={formData.description}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    {/* Category select + Create button */}
                                <div className="flex gap-2">
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="input-field flex-1"
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateCategoryModal(true)}
                                        className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1 text-sm whitespace-nowrap"
                                        title="Create new category"
                                    >
                                        <FiPlus size={16} />
                                        <span className="hidden sm:inline">New</span>
                                    </button>
                                </div>
                                </div>

                                {/* Subcategory Section */}
                                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <FiFolder className="text-primary" />
                                            Subcategory
                                        </label>
                                        <span className="text-xs text-gray-500">
                                            {subcategoryUsage.used}/{subcategoryUsage.max} used
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <select
                                            value={selectedSubcategory}
                                            onChange={(e) => setSelectedSubcategory(e.target.value)}
                                            className="input-field flex-1"
                                        >
                                            <option value="">Select Subcategory (Optional)</option>
                                            {subcategories.map(subcat => (
                                                <option key={subcat._id} value={subcat._id}>
                                                    {subcat.name} ({subcat.productCount || 0} products)
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateSubcatModal(true)}
                                            disabled={subcategoryUsage.used >= subcategoryUsage.max}
                                            className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                                            title={subcategoryUsage.used >= subcategoryUsage.max ? 'Subcategory limit reached' : 'Create new subcategory'}
                                        >
                                            <FiPlus size={16} />
                                            <span className="hidden sm:inline">New</span>
                                        </button>
                                    </div>

                                    {subcategoryUsage.used >= subcategoryUsage.max && (
                                        <p className="text-xs text-amber-600">
                                            You have reached your subcategory limit. Contact admin to increase.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Create Category Modal */}
                            {showCreateCategoryModal && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <FiTag className="text-indigo-600" />
                                            Create New Category
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Category Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newCategoryName}
                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                    placeholder="e.g. Electronics, Fashion"
                                                    className="input-field w-full"
                                                    autoFocus
                                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                                                />
                                            </div>

                                            {/* Category Image Upload */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Category Image <span className="text-xs text-gray-400">(optional)</span>
                                                </label>
                                                {newCategoryImage ? (
                                                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                                                        <Image src={newCategoryImage} alt="Category" fill className="object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewCategoryImage('')}
                                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                        >
                                                            <FiX size={20} className="text-white" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                                                        {uploadingCategoryImage ? (
                                                            <span className="text-xs text-gray-400 animate-pulse">...</span>
                                                        ) : (
                                                            <>
                                                                <FiUpload size={18} className="text-gray-400 mb-1" />
                                                                <span className="text-[10px] text-gray-400 text-center">Upload</span>
                                                            </>
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleCategoryImageUpload}
                                                            className="hidden"
                                                            disabled={uploadingCategoryImage}
                                                        />
                                                    </label>
                                                )}
                                            </div>

                                            {newCategoryName.trim() && (
                                                <p className="text-xs text-gray-500">
                                                    Slug: <span className="font-mono text-indigo-600">{newCategoryName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}</span>
                                                </p>
                                            )}
                                            <div className="flex gap-3 justify-end pt-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => { setShowCreateCategoryModal(false); setNewCategoryName(''); setNewCategoryImage(''); }}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="primary"
                                                    onClick={handleCreateCategory}
                                                    isLoading={creatingCategory}
                                                    disabled={!newCategoryName.trim()}
                                                >
                                                    Create Category
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Create Subcategory Modal */}
                            {showCreateSubcatModal && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <FiFolder className="text-primary" />
                                            Create Subcategory
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Subcategory Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newSubcatName}
                                                    onChange={(e) => setNewSubcatName(e.target.value)}
                                                    placeholder="e.g. Smartphones, Laptops"
                                                    className="input-field w-full"
                                                    autoFocus
                                                />
                                            </div>

                                            <p className="text-xs text-gray-500">
                                                This subcategory will be created under:{' '}
                                                <span className="font-medium">
                                                    {categories.find(c => c._id === formData.category)?.name || 'Selected category'}
                                                </span>
                                            </p>

                                            <div className="flex gap-3 justify-end pt-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setShowCreateSubcatModal(false);
                                                        setNewSubcatName('');
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="primary"
                                                    onClick={handleCreateSubcategory}
                                                    isLoading={creatingSubcat}
                                                    disabled={!newSubcatName.trim() || !formData.category}
                                                >
                                                    Create
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Pricing & Offer */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium border-b pb-2 flex items-center gap-2">
                                    <FaIndianRupeeSign /> Pricing & Offer
                                </h3>

                                <div className="space-y-4">
                                    <Input
                                        label="Original Price (₹) (Optional)"
                                        name="priceOriginal"
                                        type="number"
                                        min="0"
                                        placeholder="1000"
                                        value={formData.priceOriginal}
                                        onChange={handleChange}
                                    />

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="hasDiscount"
                                            checked={hasDiscount}
                                            onChange={(e) => setHasDiscount(e.target.checked)}
                                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                        />
                                        <label htmlFor="hasDiscount" className="text-sm font-medium text-gray-700 select-none">
                                            Run a Discount or Offer?
                                        </label>
                                    </div>

                                    {hasDiscount && (
                                        <div className="border-l-2 border-primary pl-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <Input
                                                label="Discounted Price (₹)"
                                                name="priceDiscounted"
                                                type="number"
                                                min="0"
                                                placeholder="800"
                                                value={formData.priceDiscounted}
                                                onChange={handleChange}
                                            />

                                            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                                                <h4 className="font-medium text-sm text-gray-700">Special Offer Details</h4>
                                                <Input
                                                    label="Offer Description"
                                                    name="offerDescription"
                                                    placeholder="e.g. 20% OFF for Students"
                                                    value={formData.offerDescription}
                                                    onChange={handleChange}
                                                />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Offer Type
                                                        </label>
                                                        <select
                                                            name="offerType"
                                                            value={formData.offerType}
                                                            onChange={handleChange}
                                                            className="input-field w-full"
                                                        >
                                                            <option value="discount">Discount</option>
                                                            <option value="bogo">Buy 1 Get 1</option>
                                                            <option value="clearance">Clearance</option>
                                                        </select>
                                                    </div>
                                                    <Input
                                                        label="Valid Until"
                                                        name="validUntil"
                                                        type="date"
                                                        value={formData.validUntil}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Images */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium border-b pb-2 flex items-center gap-2">
                                    <FiImage /> Images
                                </h3>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {images.map((url, index) => (
                                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                                            <Image src={url} alt="Product" fill className="object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                            >
                                                <FiX size={12} />
                                            </button>
                                        </div>
                                    ))}

                                    {images.length < 10 && (
                                        <label className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer hover:border-primary hover:bg-blue-50 transition-colors h-32">
                                            {uploading ? (
                                                <span className="text-sm text-gray-500 animate-pulse text-center">Uploading...</span>
                                            ) : (
                                                <>
                                                    <FiUpload className="text-gray-400 mb-2" size={24} />
                                                    <span className="text-sm text-gray-500 text-center">Upload Images<br /><span className="text-xs">(Max 10)</span></span>
                                                </>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                disabled={uploading}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4 justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => router.back()}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    isLoading={isLoading}
                                    disabled={uploading}
                                >
                                    Create Product
                                </Button>
                            </div>

                        </form>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
