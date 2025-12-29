'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useVendorStore } from '@/store/vendorStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import axios from 'axios';
import { FiShoppingBag, FiMapPin, FiPhone } from 'react-icons/fi';

export default function VendorOnboardingPage() {
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
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'vendor') {
            router.push('/login');
        } else {
            // Pre-fill phone if available
            if (user.phone) {
                setFormData(prev => ({ ...prev, phone: user.phone! }));
            }

            // Check if profile exists (redirect if already approved/created)
            // fetchMyProfile().then(() => {
            //    if (myVendorProfile) router.push('/vendor/dashboard');
            // }).catch(() => { /* expected 404 */ });
        }
    }, [isAuthenticated, user, router]);

    useEffect(() => {
        // Fetch categories
        const loadCategories = async () => {
            try {
                const response = await axios.get('/api/categories?parentOnly=true');
                setCategories(response.data.data.categories);
                if (response.data.data.categories.length > 0) {
                    setFormData(prev => ({ ...prev, category: response.data.data.categories[0]._id }));
                }
            } catch (err) {
                console.error('Failed to load categories');
            }
        };
        loadCategories();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.category) {
            setError('Please select a business category');
            return;
        }

        try {
            // Structure usage of API matches models/Vendor.ts
            const payload = {
                shopName: formData.shopName,
                shopDescription: formData.shopDescription,
                category: formData.category,
                contactInfo: {
                    phone: formData.phone,
                    email: user?.email, // Default to user email
                },
                location: {
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode,
                    country: 'India', // Default
                    coordinates: [0, 0] // Default until map picker is added
                }
            };

            await createVendorProfile(payload);
            router.push('/vendor/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to create profile');
        }
    };

    return (
        <div className="min-h-screen bg-accent-light py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-secondary mb-2">
                                Setup Your Shop
                            </h1>
                            <p className="text-gray-600">
                                Tell us about your business to get started
                            </p>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {(error || storeError) && (
                                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                                    {error || storeError}
                                </div>
                            )}

                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-secondary flex items-center gap-2 border-b pb-2">
                                    <FiShoppingBag /> Business Details
                                </h3>

                                <Input
                                    label="Shop Name"
                                    name="shopName"
                                    placeholder="e.g. John's Electronics"
                                    value={formData.shopName}
                                    onChange={handleChange}
                                    required
                                />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="input-field w-full"
                                        required
                                    >
                                        <option value="" disabled>Select a category</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        name="shopDescription"
                                        rows={3}
                                        className="input-field w-full py-2"
                                        placeholder="Tell customers what you sell..."
                                        value={formData.shopDescription}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Contact & Location */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-secondary flex items-center gap-2 border-b pb-2">
                                    <FiMapPin /> Location & Contact
                                </h3>

                                <Input
                                    label="Business Phone"
                                    name="phone"
                                    placeholder="+91 9876543210"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    icon={<FiPhone />}
                                />

                                <Input
                                    label="Street Address"
                                    name="address"
                                    placeholder="Shop No, Street, Area"
                                    value={formData.address}
                                    onChange={handleChange}
                                    required
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="City"
                                        name="city"
                                        placeholder="Bangalore"
                                        value={formData.city}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Input
                                        label="Pincode"
                                        name="pincode"
                                        placeholder="560001"
                                        value={formData.pincode}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <Input
                                    label="State"
                                    name="state"
                                    placeholder="Karnataka"
                                    value={formData.state}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    fullWidth
                                    size="lg"
                                    isLoading={isLoading}
                                >
                                    Create Shop Profile
                                </Button>
                            </div>

                        </form>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
