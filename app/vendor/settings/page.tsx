'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useVendorStore } from '@/store/vendorStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import { FiSave, FiShoppingBag, FiMapPin, FiPhone, FiClock, FiNavigation } from 'react-icons/fi';
import Loading from '@/components/ui/Loading';
import axios from 'axios';

export default function VendorSettingsPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const { myVendorProfile, fetchMyProfile, isLoading: isVendorLoading } = useVendorStore();

    const [isLoading, setIsLoading] = useState(false);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
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
            coordinates: null as { latitude: number; longitude: number } | null,
        },
        businessHours: [] as any[]
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
            const coords: any = myVendorProfile.location?.coordinates;
            // coords is a GeoJSON object { type: 'Point', coordinates: [lng, lat] } or undefined
            let latitude: number | null = null;
            let longitude: number | null = null;
            if (coords?.coordinates && Array.isArray(coords.coordinates) && coords.coordinates.length === 2) {
                [longitude, latitude] = coords.coordinates;
            }

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
                    coordinates: latitude && longitude ? { latitude, longitude } : null,
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

    // Geocode the saved address to get GPS coordinates
    const detectLocationFromAddress = async () => {
        setIsDetectingLocation(true);
        setError('');
        try {
            // First try browser geolocation (most accurate)
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setFormData(prev => ({
                            ...prev,
                            location: {
                                ...prev.location,
                                coordinates: {
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude,
                                }
                            }
                        }));
                        setSuccess('✅ Location detected from your device! Save to apply.');
                        setIsDetectingLocation(false);
                    },
                    async () => {
                        // Fallback: geocode from address string
                        await geocodeFromAddress();
                    },
                    { timeout: 8000 }
                );
            } else {
                await geocodeFromAddress();
            }
        } catch (err) {
            setError('Could not detect location. Please enter coordinates manually.');
            setIsDetectingLocation(false);
        }
    };

    const geocodeFromAddress = async () => {
        try {
            const addressQuery = [
                formData.location.address,
                formData.location.city,
                formData.location.state,
                formData.location.pincode,
                'India'
            ].filter(Boolean).join(', ');

            const res = await axios.get(`/api/google/places/autocomplete?input=${encodeURIComponent(addressQuery)}`);
            const place = res.data?.predictions?.[0];

            if (place?.place_id) {
                const detailsRes = await axios.get(`/api/google/places/details?placeId=${place.place_id}`);
                const loc = detailsRes.data?.location;
                if (loc?.lat && loc?.lng) {
                    setFormData(prev => ({
                        ...prev,
                        location: {
                            ...prev.location,
                            coordinates: { latitude: loc.lat, longitude: loc.lng }
                        }
                    }));
                    setSuccess('✅ Location found from address! Save to apply.');
                    return;
                }
            }
            setError('Could not geocode address. Please enter coordinates manually or fill in a more specific address.');
        } catch {
            setError('Could not geocode address. Please enter coordinates manually.');
        } finally {
            setIsDetectingLocation(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            // Build payload — include coordinates in GeoJSON format if present
            const payload: any = {
                shopName: formData.shopName,
                shopDescription: formData.shopDescription,
                contactInfo: formData.contactInfo,
                location: {
                    address: formData.location.address,
                    city: formData.location.city,
                    state: formData.location.state,
                    country: formData.location.country,
                    pincode: formData.location.pincode,
                },
                businessHours: formData.businessHours,
            };

            // Attach coordinates if they exist
            if (formData.location.coordinates?.latitude && formData.location.coordinates?.longitude) {
                payload.location.coordinates = {
                    type: 'Point',
                    coordinates: [
                        formData.location.coordinates.longitude,
                        formData.location.coordinates.latitude,
                    ],
                };
            }

            await axios.put('/api/vendors/me', payload);
            setSuccess('Shop profile updated successfully');
            fetchMyProfile();
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

                            {/* GPS Coordinates Section */}
                            <div className="border rounded-lg p-4 bg-blue-50 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                                            <FiNavigation className="text-blue-600" /> GPS Coordinates
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Required to show accurate distance to customers
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={detectLocationFromAddress}
                                        disabled={isDetectingLocation}
                                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        <FiNavigation size={14} />
                                        {isDetectingLocation ? 'Detecting...' : 'Detect My Location'}
                                    </button>
                                </div>

                                {formData.location.coordinates ? (
                                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
                                        <FiMapPin className="text-green-600 shrink-0" />
                                        <div>
                                            <p className="font-medium">✅ Location set</p>
                                            <p className="text-xs text-gray-500">
                                                Lat: {formData.location.coordinates.latitude.toFixed(6)},
                                                Lng: {formData.location.coordinates.longitude.toFixed(6)}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                location: { ...prev.location, coordinates: null }
                                            }))}
                                            className="ml-auto text-xs text-red-500 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
                                        ⚠️ No GPS coordinates set. Customers will not see distance to your shop.
                                        Click &quot;Detect My Location&quot; above.
                                    </div>
                                )}
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
