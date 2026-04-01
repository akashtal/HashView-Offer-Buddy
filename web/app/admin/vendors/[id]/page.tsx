'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import { FiArrowLeft, FiSave, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

export default function AdminEditVendorPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

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
            try {
                const [vendorRes, catRes] = await Promise.all([
                    axios.get(`/api/admin/vendors/${id}`),
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
                        maxSubcategories: vendor.limits?.maxSubcategories || 5,
                        maxProductsPerSubcategory: vendor.limits?.maxProductsPerSubcategory || 20,
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
    }, [id]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            await axios.put(`/api/admin/vendors/${id}`, formData);
            setSuccess('Vendor updated successfully');
            window.scrollTo(0, 0);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update vendor');
            window.scrollTo(0, 0);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <Loading />;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => router.back()}>
                    <FiArrowLeft className="mr-2" /> Back to Vendors
                </Button>
                <h1 className="text-2xl font-bold">Edit Vendor: {formData.shopName}</h1>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
                    <FiAlertCircle /> {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 text-green-600 p-4 rounded-lg flex items-center gap-2">
                    <FiCheckCircle /> {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <Card>
                    <CardHeader><h3>Basic Information</h3></CardHeader>
                    <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Shop Name"
                            value={formData.shopName}
                            onChange={(e) => handleChange('root', 'shopName', e.target.value)}
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                className="w-full border border-gray-300 rounded-md p-2"
                                value={formData.category}
                                onChange={(e) => handleChange('root', 'category', e.target.value)}
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map((cat: any) => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                className="w-full border border-gray-300 rounded-md p-2"
                                rows={3}
                                value={formData.shopDescription}
                                onChange={(e) => handleChange('root', 'shopDescription', e.target.value)}
                            />
                        </div>
                    </CardBody>
                </Card>

                {/* Contact Info */}
                <Card>
                    <CardHeader><h3>Contact Information</h3></CardHeader>
                    <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Phone"
                            value={formData.contactInfo.phone}
                            onChange={(e) => handleChange('contactInfo', 'phone', e.target.value)}
                            required
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={formData.contactInfo.email}
                            onChange={(e) => handleChange('contactInfo', 'email', e.target.value)}
                        />
                        <Input
                            label="WhatsApp"
                            value={formData.contactInfo.whatsapp}
                            onChange={(e) => handleChange('contactInfo', 'whatsapp', e.target.value)}
                        />
                        <Input
                            label="Website"
                            value={formData.contactInfo.website}
                            onChange={(e) => handleChange('contactInfo', 'website', e.target.value)}
                        />
                    </CardBody>
                </Card>

                {/* Location */}
                <Card>
                    <CardHeader><h3>Location</h3></CardHeader>
                    <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Input
                                label="Address"
                                value={formData.location.address}
                                onChange={(e) => handleChange('location', 'address', e.target.value)}
                                required
                            />
                        </div>
                        <Input
                            label="City"
                            value={formData.location.city}
                            onChange={(e) => handleChange('location', 'city', e.target.value)}
                            required
                        />
                        <Input
                            label="State"
                            value={formData.location.state}
                            onChange={(e) => handleChange('location', 'state', e.target.value)}
                            required
                        />
                        <Input
                            label="Pincode"
                            value={formData.location.pincode}
                            onChange={(e) => handleChange('location', 'pincode', e.target.value)}
                            required
                        />
                    </CardBody>
                </Card>

                {/* Status & Limits */}
                <Card>
                    <CardHeader><h3>Status & Limits</h3></CardHeader>
                    <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isApproved"
                                    checked={formData.isApproved}
                                    onChange={(e) => handleChange('root', 'isApproved', e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <label htmlFor="isApproved" className="font-medium text-gray-700">Vendor Approved</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => handleChange('root', 'isActive', e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <label htmlFor="isActive" className="font-medium text-gray-700">Account Active</label>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Input
                                label="Max Subcategories"
                                type="number"
                                value={formData.limits.maxSubcategories}
                                onChange={(e) => handleChange('limits', 'maxSubcategories', parseInt(e.target.value))}
                            />
                            <Input
                                label="Max Products Per Subcategory"
                                type="number"
                                value={formData.limits.maxProductsPerSubcategory}
                                onChange={(e) => handleChange('limits', 'maxProductsPerSubcategory', parseInt(e.target.value))}
                            />
                        </div>
                    </CardBody>
                </Card>

                {/* KYC Status */}
                <Card>
                    <CardHeader><h3>KYC Status</h3></CardHeader>
                    <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                className="w-full border border-gray-300 rounded-md p-2"
                                value={formData.kycDocuments.status}
                                onChange={(e) => handleChange('kycDocuments', 'status', e.target.value)}
                            >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="not_submitted">Not Submitted</option>
                            </select>
                        </div>
                        {formData.kycDocuments.status === 'rejected' && (
                            <div className="md:col-span-2">
                                <Input
                                    label="Rejection Reason"
                                    value={formData.kycDocuments.rejectionReason}
                                    onChange={(e) => handleChange('kycDocuments', 'rejectionReason', e.target.value)}
                                />
                            </div>
                        )}
                    </CardBody>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button type="submit" isLoading={isSaving} className="flex items-center gap-2">
                        <FiSave /> Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
}
