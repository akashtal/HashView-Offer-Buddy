'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
    FiPhone,
    FiMapPin,
    FiClock,
    FiStar,
    FiGlobe,
    FiMail,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useVendorStore } from '@/store/vendorStore';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card, { CardBody } from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import ProductCard from '@/components/products/ProductCard';

export default function VendorDetailPage() {
    const params = useParams();
    const vendorId = params.id as string;

    const { currentVendor, currentVendorProducts, isLoading, error, fetchVendorById, clearCurrentVendor } = useVendorStore();

    useEffect(() => {
        fetchVendorById(vendorId);
        return () => clearCurrentVendor();
    }, [vendorId, fetchVendorById, clearCurrentVendor]);

    if (isLoading) {
        return <Loading fullScreen text="Loading shop profile..." />;
    }

    if (error || !currentVendor) {
        return (
            <div className="container-custom py-12">
                <Card>
                    <CardBody>
                        <div className="text-center py-12">
                            <p className="text-red-600 font-medium mb-4">
                                {error || 'Shop not found'}
                            </p>
                            <Link href="/vendors">
                                <Button variant="primary">Back to Vendors</Button>
                            </Link>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    // The API response structure for fetchVendorById puts products in the store state?
    // Wait, looking at store/vendorStore.ts:
    // fetchVendorById sets `currentVendor`.
    // But where are the products?
    // The API returns { vendor, products }.
    // Let's re-read store/vendorStore.ts to see if it handles the products from the response.
    // It seems store ONLY sets currentVendor: response.data.data.vendor
    // It MIGHT be missing the products part?
    // I need to check store/vendorStore.ts again.
    // Line 113: currentVendor: response.data.data.vendor,
    // It does NOT set products. This implies the store might need updating OR I should fetch products separately/handle them in local state?
    // Actually, let's check the API response again.
    // API returns { vendor: { ...vendor, distance }, products }.
    // So the products ARE returned.
    // If the store ignores them, I can't access them via `currentVendor`.
    // I should check `store/vendorStore.ts` one more time.
    // If `vendors` array is not updated, and `currentVendor` is just the vendor object... where go the products?
    // I might need to update the store to hold `currentVendorProducts`.

    // For now, I will assume I might need to fix the store too.
    // But let's write the initial page code first. 
    // Wait, I can't simply assume.

    return (
        <div className="bg-accent-light min-h-screen pb-12">
            {/* Hero / Header */}
            <div className="bg-white border-b">
                <div className="container-custom py-8">
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                        {/* Logo */}
                        <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
                            {currentVendor.shopLogo ? (
                                <Image
                                    src={currentVendor.shopLogo}
                                    alt={currentVendor.shopName}
                                    fill
                                    className="object-cover rounded-full border-4 border-white shadow-md"
                                />
                            ) : (
                                <div className="w-full h-full bg-primary/20 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                                    <span className="text-4xl font-bold text-primary">
                                        {currentVendor.shopName[0]}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left space-y-2">
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-center md:justify-start">
                                <h1 className="text-3xl font-bold text-secondary">
                                    {currentVendor.shopName}
                                </h1>
                                {currentVendor.isApproved && (
                                    <Badge variant="success">Verified</Badge>
                                )}
                            </div>

                            <p className="text-gray-600 max-w-2xl">
                                {currentVendor.shopDescription}
                            </p>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500 pt-2">
                                <div className="flex items-center gap-1">
                                    <FiMapPin />
                                    <span>{currentVendor.location.city}, {currentVendor.location.state}</span>
                                </div>
                                {currentVendor.rating && (
                                    <div className="flex items-center gap-1 text-yellow-500 font-medium">
                                        <FiStar className="fill-current" />
                                        <span>{currentVendor.rating.toFixed(1)} ({currentVendor.totalReviews} reviews)</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <FiGlobe />
                                    <span>{currentVendor.category?.name || 'Local Shop'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 min-w-[200px]">
                            <Button
                                variant="primary"
                                onClick={() => window.open(`tel:${currentVendor.contactInfo.phone}`)}
                            >
                                <FiPhone className="inline mr-2" />
                                Call Now
                            </Button>
                            {(currentVendor.contactInfo.whatsapp || currentVendor.contactInfo.phone) && (
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        const phone = currentVendor.contactInfo.whatsapp || currentVendor.contactInfo.phone;
                                        window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
                                    }}
                                >
                                    <FaWhatsapp className="inline mr-2" />
                                    WhatsApp
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-custom py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left/Main Column: Products */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-secondary">
                                Latest Offers
                            </h2>
                        </div>

                        {/* We need to fetch/display products here. 
                        Since the store likely doesn't have them in 'currentVendor', 
                        and I suspect the store needs an update or I need to fetch them.
                        For now, I'll place a placeholder. 
                        Wait, I'll check if 'products' are attached to 'currentVendor' illegally or if I need to add 'currentVendorProducts' to the store.
                        I'll assume I need to fix the store. 
                        So I will map 'currentVendor.products' if it existed, but it doesn't on the type.
                        I will create a placeholder list or handle it after checking store.
                    */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {currentVendorProducts && currentVendorProducts.length > 0 ? (
                                currentVendorProducts.map((product: any) => (
                                    <ProductCard
                                        key={product._id}
                                        product={{
                                            ...product,
                                            vendorId: currentVendor
                                        }}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center bg-white rounded-lg border border-dashed border-gray-300">
                                    <p className="text-gray-500">No active offers from this shop yet.</p>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Right Sidebar: Details */}
                    <div className="space-y-6">
                        {/* Contact & Location */}
                        <Card>
                            <CardBody>
                                <h3 className="font-semibold text-lg text-secondary mb-4">
                                    Shop Details
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">Address</p>
                                        <p className="text-gray-700">
                                            {currentVendor.location.address}<br />
                                            {currentVendor.location.city} - {currentVendor.location.pincode}<br />
                                            {currentVendor.location.state}
                                        </p>
                                    </div>

                                    {currentVendor.contactInfo.email && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                                            <a href={`mailto:${currentVendor.contactInfo.email}`} className="text-primary hover:underline flex items-center gap-2">
                                                <FiMail size={14} />
                                                {currentVendor.contactInfo.email}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </CardBody>
                        </Card>

                        {/* Hours */}
                        {currentVendor.businessHours && currentVendor.businessHours.length > 0 && (
                            <Card>
                                <CardBody>
                                    <h3 className="font-semibold text-lg text-secondary mb-4 flex items-center gap-2">
                                        <FiClock />
                                        Business Hours
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        {currentVendor.businessHours.map((hours: any, index: number) => (
                                            <div key={index} className="flex justify-between py-1 border-b last:border-0 border-gray-100">
                                                <span className="text-gray-600 capitalize">{hours.day}</span>
                                                <span className="font-medium text-secondary">
                                                    {hours.isClosed
                                                        ? 'Closed'
                                                        : `${hours.openTime} - ${hours.closeTime}`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardBody>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
