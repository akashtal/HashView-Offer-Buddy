'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import { useVendorStore } from '@/store/vendorStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import { FiShoppingBag, FiMapPin, FiPhone, FiUpload, FiX, FiFileText } from 'react-icons/fi';
import axios from 'axios';

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
        shopLogo: '',
        coordinates: [0, 0] as [number, number],
        // KYC Documents
        idProofUrl: '',
        idProofType: 'aadhaar' as 'aadhaar' | 'pan' | 'voter_id' | 'passport',
        businessDocUrl: '',
        businessDocType: 'gst_certificate' as 'gst_certificate' | 'trade_license' | 'udyam' | 'other',
    });
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
            router.push('/signin');
        } else {
            // Pre-fill phone if available
            if (user.phone) {
                setFormData(prev => ({ ...prev, phone: user.phone! }));
            }
        }
    }, [isAuthenticated, user, router]);

    useEffect(() => {
        // Fetch categories
        const loadCategories = async () => {
            try {
                const response = await fetch('/api/categories?parentOnly=true');
                const data = await response.json();
                setCategories(data.data.categories);
                if (data.data.categories.length > 0) {
                    setFormData(prev => ({ ...prev, category: data.data.categories[0]._id }));
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size should be less than 5MB');
            return;
        }

        try {
            setUploading(true);
            const uploadData = new FormData();
            uploadData.append('file', file);

            const res = await axios.post('/api/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setFormData(prev => ({ ...prev, shopLogo: res.data.data.url }));
                setError('');
            }
        } catch (err: any) {
            console.error('Upload failed', err);
            setError(err.response?.data?.message || 'Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, shopLogo: '' }));
    };

    // KYC Document Upload Handlers
    const handleIdProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError('File size should be less than 5MB');
            return;
        }
        try {
            setUploadingIdProof(true);
            const uploadData = new FormData();
            uploadData.append('file', file);
            const res = await axios.post('/api/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                setFormData(prev => ({ ...prev, idProofUrl: res.data.data.url }));
                setError('');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload ID proof');
        } finally {
            setUploadingIdProof(false);
        }
    };

    const handleBusinessDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError('File size should be less than 5MB');
            return;
        }
        try {
            setUploadingBusinessDoc(true);
            const uploadData = new FormData();
            uploadData.append('file', file);
            const res = await axios.post('/api/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                setFormData(prev => ({ ...prev, businessDocUrl: res.data.data.url }));
                setError('');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload business document');
        } finally {
            setUploadingBusinessDoc(false);
        }
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
            const payload: any = {
                shopName: formData.shopName,
                shopDescription: formData.shopDescription,
                shopLogo: formData.shopLogo,
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
                    coordinates: formData.coordinates
                }
            };

            // Add KYC Documents if uploaded
            if (formData.idProofUrl || formData.businessDocUrl) {
                payload.kycDocuments = {
                    status: 'pending',
                };
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

                                {/* Shop Logo Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Store Logo / Image
                                    </label>

                                    {formData.shopLogo ? (
                                        <div className="relative w-32 h-32 border rounded-lg overflow-hidden group">
                                            <Image
                                                src={formData.shopLogo}
                                                alt="Shop Logo"
                                                fill
                                                className="object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <FiX size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center w-full">
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    {uploading ? (
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                    ) : (
                                                        <>
                                                            <FiUpload className="w-8 h-8 mb-2 text-gray-500" />
                                                            <p className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span> store image</p>
                                                            <p className="text-xs text-gray-500">PNG, JPG (MAX. 5MB)</p>
                                                        </>
                                                    )}
                                                </div>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    disabled={uploading}
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>

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

                                <AddressAutocomplete
                                    label="Street Address"
                                    name="address"
                                    placeholder="Search for your shop location..."
                                    value={formData.address}
                                    onChange={(val) => setFormData({ ...formData, address: val })}
                                    onSelect={handleAddressSelect}
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

                            {/* KYC Documents */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-secondary flex items-center gap-2 border-b pb-2">
                                    <FiFileText /> KYC Verification Documents
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Upload your ID proof and business documents for verification. These will be reviewed by our team.
                                </p>

                                {/* ID Proof Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ID Proof (Aadhaar / PAN / Voter ID / Passport)
                                    </label>
                                    <div className="flex gap-3 mb-2">
                                        <select
                                            name="idProofType"
                                            value={formData.idProofType}
                                            onChange={handleChange}
                                            className="input-field w-48"
                                        >
                                            <option value="aadhaar">Aadhaar Card</option>
                                            <option value="pan">PAN Card</option>
                                            <option value="voter_id">Voter ID</option>
                                            <option value="passport">Passport</option>
                                        </select>
                                    </div>
                                    {formData.idProofUrl ? (
                                        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <FiFileText className="text-green-600" size={20} />
                                            <span className="text-sm text-green-700 flex-1">ID Proof uploaded successfully</span>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, idProofUrl: '' }))}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <FiX size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                            <div className="flex flex-col items-center">
                                                {uploadingIdProof ? (
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                                ) : (
                                                    <>
                                                        <FiUpload className="w-6 h-6 mb-1 text-gray-500" />
                                                        <p className="text-sm text-gray-500">Click to upload ID proof</p>
                                                    </>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*,.pdf"
                                                onChange={handleIdProofUpload}
                                                disabled={uploadingIdProof}
                                            />
                                        </label>
                                    )}
                                </div>

                                {/* Business Document Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Business Document (GST Certificate / Trade License / Udyam)
                                    </label>
                                    <div className="flex gap-3 mb-2">
                                        <select
                                            name="businessDocType"
                                            value={formData.businessDocType}
                                            onChange={handleChange}
                                            className="input-field w-48"
                                        >
                                            <option value="gst_certificate">GST Certificate</option>
                                            <option value="trade_license">Trade License</option>
                                            <option value="udyam">Udyam Registration</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    {formData.businessDocUrl ? (
                                        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <FiFileText className="text-green-600" size={20} />
                                            <span className="text-sm text-green-700 flex-1">Business document uploaded successfully</span>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, businessDocUrl: '' }))}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <FiX size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                            <div className="flex flex-col items-center">
                                                {uploadingBusinessDoc ? (
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                                ) : (
                                                    <>
                                                        <FiUpload className="w-6 h-6 mb-1 text-gray-500" />
                                                        <p className="text-sm text-gray-500">Click to upload business document</p>
                                                    </>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*,.pdf"
                                                onChange={handleBusinessDocUpload}
                                                disabled={uploadingBusinessDoc}
                                            />
                                        </label>
                                    )}
                                </div>
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
