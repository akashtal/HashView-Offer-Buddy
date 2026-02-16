'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useVendorStore } from '@/store/vendorStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import { FiSave, FiShoppingBag, FiMapPin, FiPhone, FiClock } from 'react-icons/fi';
import Loading from '@/components/ui/Loading';
import axios from 'axios';

export default function VendorSettingsPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const { myVendorProfile, fetchMyProfile, isLoading: isVendorLoading } = useVendorStore();

    const [isLoading, setIsLoading] = useState(false);
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
        },
        businessHours: [] as any[] // Simplified for now
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!isAuthenticated || (user && user.role !== 'vendor')) {
            router.push('/signin');
        } else {
            fetchMyProfile();
        }
    }, [isAuthenticated, user, router, fetchMyProfile]);

    useEffect(() => {
        if (myVendorProfile) {
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
                },
                businessHours: myVendorProfile.businessHours || []
            });
        }
    }, [myVendorProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, section?: string) => {
        const { name, value } = e.target;

        if (section) {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section as keyof typeof prev] as any,
                    [name]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            await axios.put('/api/vendors/me', formData);
            setSuccess('Shop profile updated successfully');
            fetchMyProfile(); // Refresh data
            window.scrollTo(0, 0);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update shop profile');
            window.scrollTo(0, 0);
        } finally {
            setIsLoading(false);
        }
    };

    if (isVendorLoading || !myVendorProfile) return <Loading fullScreen />;

    return (
        <div className="min-h-screen bg-accent-light py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-secondary">Shop Settings</h1>
                    <Button variant="outline" onClick={() => router.push('/vendor/dashboard')}>
                        Back to Dashboard
                    </Button>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader className="border-b pb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <FiShoppingBag /> Basic Information
                            </h2>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            {error && <div className="p-3 bg-red-100 text-red-700 rounded border border-red-300">{error}</div>}
                            {success && <div className="p-3 bg-green-100 text-green-700 rounded border border-green-300">{success}</div>}

                            <Input
                                label="Shop Name"
                                name="shopName"
                                value={formData.shopName}
                                onChange={handleChange}
                                required
                            />

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    name="shopDescription"
                                    value={formData.shopDescription}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    placeholder="Describe your shop..."
                                />
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="mt-6">
                        <CardHeader className="border-b pb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <FiPhone /> Contact Information
                            </h2>
                        </CardHeader>
                        <CardBody className="grid md:grid-cols-2 gap-4">
                            <Input
                                label="Phone Number"
                                name="phone"
                                value={formData.contactInfo.phone}
                                onChange={(e) => handleChange(e, 'contactInfo')}
                                required
                            />
                            <Input
                                label="WhatsApp"
                                name="whatsapp"
                                value={formData.contactInfo.whatsapp}
                                onChange={(e) => handleChange(e, 'contactInfo')}
                            />
                            <Input
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.contactInfo.email}
                                onChange={(e) => handleChange(e, 'contactInfo')}
                            />
                            <Input
                                label="Website"
                                name="website"
                                value={formData.contactInfo.website}
                                onChange={(e) => handleChange(e, 'contactInfo')}
                            />
                        </CardBody>
                    </Card>

                    <Card className="mt-6">
                        <CardHeader className="border-b pb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <FiMapPin /> Location
                            </h2>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <Input
                                label="Address"
                                name="address"
                                value={formData.location.address}
                                onChange={(e) => handleChange(e, 'location')}
                                required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="City"
                                    name="city"
                                    value={formData.location.city}
                                    onChange={(e) => handleChange(e, 'location')}
                                    required
                                />
                                <Input
                                    label="Pincode"
                                    name="pincode"
                                    value={formData.location.pincode}
                                    onChange={(e) => handleChange(e, 'location')}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="State"
                                    name="state"
                                    value={formData.location.state}
                                    onChange={(e) => handleChange(e, 'location')}
                                    required
                                />
                                <Input
                                    label="Country"
                                    name="country"
                                    value={formData.location.country}
                                    onChange={(e) => handleChange(e, 'location')}
                                    disabled
                                />
                            </div>
                        </CardBody>
                    </Card>

                    <div className="mt-6 flex justify-end">
                        <Button type="submit" variant="primary" size="lg" isLoading={isLoading}>
                            <FiSave className="mr-2" /> Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
