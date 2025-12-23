'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useVendorStore } from '@/store/vendorStore';
import { useLocationStore } from '@/store/locationStore';
import { FiMapPin, FiStar } from 'react-icons/fi';
import Loading from '@/components/ui/Loading';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { formatDistance } from '@/lib/utils';

export default function VendorsPage() {
    const { latitude, longitude, radius, hasPermission } = useLocationStore();
    const { vendors, isLoading, fetchVendors } = useVendorStore();

    useEffect(() => {
        if (hasPermission && latitude && longitude) {
            fetchVendors(latitude, longitude, radius);
        }
    }, [hasPermission, latitude, longitude, radius]);

    if (isLoading) {
        return <Loading fullScreen text="Finding shops near you..." />;
    }

    return (
        <div className="container-custom py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-secondary mb-4">
                    Local Shops
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Discover trusted businesses in your neighborhood
                </p>
            </div>

            {!hasPermission ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <p className="text-lg text-gray-600 mb-4">
                        Please enable location to see shops near you
                    </p>
                </div>
            ) : vendors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vendors.map((vendor) => (
                        <Link key={vendor._id} href={`/vendors/${vendor._id}`}>
                            <Card hoverable className="h-full">
                                <div className="flex items-start gap-4 p-6">
                                    <div className="relative w-20 h-20 flex-shrink-0">
                                        {vendor.shopLogo ? (
                                            <Image
                                                src={vendor.shopLogo}
                                                alt={vendor.shopName}
                                                fill
                                                className="object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-primary/20 rounded-lg flex items-center justify-center">
                                                <span className="text-3xl font-bold text-primary">
                                                    {vendor.shopName[0]}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg text-secondary truncate mb-1">
                                            {vendor.shopName}
                                        </h3>
                                        <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                                            <FiMapPin size={14} />
                                            <span className="truncate">
                                                {vendor.distance
                                                    ? formatDistance(vendor.distance)
                                                    : `${vendor.location.city}`}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Badge variant="success" size="sm">
                                                Open Now
                                            </Badge>
                                            {vendor.rating && (
                                                <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold">
                                                    <FiStar className="fill-current" />
                                                    {vendor.rating.toFixed(1)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-xl text-gray-600">
                        No shops found in your area. Try increasing your search radius.
                    </p>
                </div>
            )}
        </div>
    );
}
