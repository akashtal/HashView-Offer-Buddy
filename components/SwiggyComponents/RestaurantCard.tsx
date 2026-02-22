'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';

interface RestaurantCardProps {
    id: string;
    name: string;
    image: string;
    rating?: number;
    reviewCount?: number;
    deliveryTime?: string;
    cuisine?: string;
    priceForTwo?: number;
    distance?: number; // Distance in km
    offer?: {
        description: string;
        value?: number;
    };
}

export default function RestaurantCard({
    id,
    name,
    image,
    rating,
    reviewCount,
    cuisine,
    priceForTwo,
    distance,
    offer,
}: RestaurantCardProps) {
    return (
        <Link href={`/products/${id}`} className="block group">
            <div className="swiggy-card hover:scale-[1.01] md:hover:scale-[1.02] transition-transform">
                {/* Product Image */}
                <div className="relative h-32 sm:h-40 md:h-48 bg-gray-100 overflow-hidden rounded-t-2xl">
                    <Image
                        src={image || '/placeholder-product.jpg'}
                        alt={name}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {offer && (
                        <div className="absolute bottom-0 left-0 bg-gradient-to-r from-[#FD9139] to-[#FCA65E] text-white px-2 md:px-3 py-1 text-xs font-bold uppercase">
                            {offer.value ? `${offer.value}% OFF` : offer.description}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="p-2.5 md:p-4 space-y-1.5 md:space-y-2">
                    {/* Name */}
                    <h3 className="font-bold text-sm md:text-base lg:text-lg text-[#282C3F] line-clamp-2 leading-tight">
                        {name}
                    </h3>

                    {/* Rating & Distance */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {rating != null && (
                            <div className="flex items-center gap-1">
                                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#48C479] text-white text-xs font-bold">
                                    <Star size={10} fill="white" />
                                    <span>{rating}</span>
                                </div>
                                {reviewCount != null && reviewCount > 0 && (
                                    <span className="text-xs text-[#686B78]">({reviewCount})</span>
                                )}
                            </div>
                        )}
                        {distance != null && distance < 99999 && (
                            <div className="flex items-center gap-1 text-xs font-bold text-[#FDB913]">
                                <span>📍</span>
                                <span>{distance < 0 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(0)}km`}</span>
                            </div>
                        )}
                    </div>

                    {/* Cuisine/Description */}
                    <p className="text-xs md:text-sm text-[#686B78] line-clamp-1">
                        {cuisine}
                    </p>

                    {/* Price */}
                    {priceForTwo != null && (
                        <p className="text-sm md:text-base text-[#282C3F] font-semibold pt-0.5">
                            ₹{priceForTwo.toLocaleString('en-IN')}
                        </p>
                    )}
                </div>
            </div>
        </Link>
    );
}
