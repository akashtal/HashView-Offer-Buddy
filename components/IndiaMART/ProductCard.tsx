'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone } from 'lucide-react';

interface IndiaMArtProductCardProps {
    id: string;
    title: string;
    image: string;
    price?: {
        original: number;
        discounted?: number;
    };
    offer?: {
        value: number;
        description?: string;
    };
    vendor?: {
        shopName: string;
        city?: string;
    };
    distance?: number;
}

export default function IndiaMArtProductCard({
    id,
    title,
    image,
    price,
    offer,
    vendor,
    distance,
}: IndiaMArtProductCardProps) {
    return (
        <Link href={`/products/${id}`} className="indiamart-product-card group flex flex-col h-full">
            {/* Product Image */}
            <div className="relative h-48 flex-shrink-0 bg-gray-100">
                <Image
                    src={image || '/placeholder-product.jpg'}
                    alt={title}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Offer Badge */}
                {offer && (
                    <div className="offer-badge-indiamart">
                        {offer.value}% OFF
                    </div>
                )}
            </div>

            {/* Product Details */}
            <div className="p-4 flex flex-col flex-1">
                {/* Title */}
                <h3 className="font-bold text-base text-gray-900 mb-2 line-clamp-2 group-hover:text-[#FDB913] transition-colors min-h-[3rem]">
                    {title}
                </h3>

                {/* Price */}
                {price && (
                    <div className="mb-3">
                        {price.discounted ? (
                            <div className="flex items-center gap-2">
                                <span className="indiamart-price">₹{price.discounted}</span>
                                <span className="text-sm text-gray-400 line-through">₹{price.original}</span>
                            </div>
                        ) : (
                            <span className="indiamart-price">₹{price.original}</span>
                        )}
                    </div>
                )}

                {/* Vendor Info */}
                {vendor && (
                    <div className="text-sm text-gray-600 mb-3 flex-1">
                        <div className="font-medium mb-1 line-clamp-1">{vendor.shopName}</div>
                        {vendor.city && (
                            <div className="flex items-center gap-1 text-xs">
                                <MapPin size={12} />
                                <span>{vendor.city}</span>
                                {distance !== undefined && (
                                    <span className="distance-badge ml-2">
                                        {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`} away
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Get Best Price Button */}
                <button className="w-full get-best-price-btn py-2.5 text-sm font-bold mt-auto">
                    <Phone size={14} className="inline mr-2" />
                    Get Best Price
                </button>
            </div>
        </Link>
    );
}
