'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, Mail, Building2, Star } from 'lucide-react';

interface SupplierCardProps {
    id: string;
    shopName: string;
    businessName?: string;
    logo?: string;
    location?: {
        city: string;
        state?: string;
    };
    phone?: string;
    email?: string;
    description?: string;
    rating?: number;
    verified?: boolean;
    distance?: number;
}

export default function SupplierCard({
    id,
    shopName,
    businessName,
    logo,
    location,
    phone,
    email,
    description,
    rating = 4.2,
    verified = true,
    distance,
}: SupplierCardProps) {
    return (
        <div className="supplier-card">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {logo ? (
                        <div className="relative w-16 h-16">
                            <Image
                                src={logo}
                                alt={shopName}
                                fill
                                className="object-cover rounded-lg"
                            />
                        </div>
                    ) : (
                        <div className="w-16 h-16 bg-[#FDB913] rounded-lg flex items-center justify-center text-black text-2xl font-bold">
                            {shopName[0] || 'S'}
                        </div>
                    )}
                </div>
                {verified && (
                    <div className="verified-badge">
                        <Star size={12} fill="currentColor" />
                        Verified
                    </div>
                )}
            </div>

            {/* Supplier Name */}
            <h3 className="font-bold text-lg text-gray-900 mb-1">{shopName}</h3>
            {businessName && businessName !== shopName && (
                <p className="text-sm text-gray-600 mb-3">{businessName}</p>
            )}

            {/* Location */}
            {location && (
                <div className="location-badge mb-3">
                    <MapPin size={14} />
                    <span>{location.city}{location.state ? `, ${location.state}` : ''}</span>
                    {distance !== undefined && (
                        <span className="distance-badge ml-2">
                            {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`} away
                        </span>
                    )}
                </div>
            )}

            {/* Description */}
            {description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {description}
                </p>
            )}

            {/* Contact Info */}
            <div className="space-y-2 mb-4">
                {phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Phone size={14} className="text-[#FDB913]" />
                        <span>{phone}</span>
                    </div>
                )}
                {email && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Mail size={14} className="text-[#FDB913]" />
                        <span className="truncate">{email}</span>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <button className="flex-1 indiamart-btn-primary py-2.5 text-sm">
                    <Phone size={14} className="inline mr-1" />
                    Contact
                </button>
                <Link
                    href={`/vendor/${id}`}
                    className="flex-1 indiamart-btn-outline py-2.5 text-sm text-center"
                >
                    View Profile
                </Link>
            </div>
        </div>
    );
}
