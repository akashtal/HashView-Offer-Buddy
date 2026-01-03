'use client';

import { useEffect, useState } from 'react';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { useLocation } from '@/lib/LocationContext';
import { sortByDistance, INDIAN_CITIES } from '@/lib/location-utils';
import SupplierCard from '@/components/IndiaMART/SupplierCard';
import Link from 'next/link';

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const { location, setManualLocation } = useLocation();

    useEffect(() => {
        loadSuppliers();
    }, [location]);

    const loadSuppliers = async () => {
        try {
            const response = await axios.get('/api/vendors');
            let suppliersData = response.data.data.vendors || response.data.data || [];

            // Sort by distance if location available
            if (location?.coordinates) {
                suppliersData = sortByDistance(suppliersData, location.coordinates);
            }

            setSuppliers(suppliersData);
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to load suppliers:', error);
            setIsLoading(false);
        }
    };

    const filteredSuppliers = searchQuery
        ? suppliers.filter((s) =>
            s.shopName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.location?.city?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : suppliers;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Local Header Removed - Using Global Header */}

            {/* Banner */}
            <section className="bg-gradient-to-r from-[#FDB913] to-[#FFD700] py-12">
                <div className="container-custom text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
                        Verified Suppliers Directory
                    </h1>
                    <p className="text-xl text-black/80">
                        Connect with trusted business partners near you
                    </p>
                </div>
            </section>

            {/* Suppliers Grid */}
            <section className="py-12">
                <div className="container-custom">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="indiamart-section-title mb-0">
                            {filteredSuppliers.length} Suppliers Available
                        </h2>
                        {location?.city && (
                            <p className="text-gray-600">
                                Showing suppliers near <span className="font-semibold">{location.city}</span>
                            </p>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="shimmer h-80 rounded-lg"></div>
                            ))}
                        </div>
                    ) : filteredSuppliers.length === 0 ? (
                        <div className="text-center py-20">
                            <MapPin size={64} className="mx-auto text-gray-300 mb-4" />
                            <h2 className="text-2xl font-bold text-gray-700 mb-2">No Suppliers Found</h2>
                            <p className="text-gray-600 mb-6">Try adjusting your search or location</p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    loadSuppliers();
                                }}
                                className="indiamart-btn-primary"
                            >
                                Clear Search
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredSuppliers.map((supplier) => (
                                <SupplierCard
                                    key={supplier._id}
                                    id={supplier._id}
                                    shopName={supplier.shopName}
                                    businessName={supplier.businessName}
                                    logo={supplier.shopLogo}
                                    location={{
                                        city: supplier.location?.city || '',
                                        state: supplier.location?.state,
                                    }}
                                    phone={supplier.phone || supplier.contactInfo?.phone}
                                    email={supplier.email || supplier.contactInfo?.email}
                                    description={supplier.description}
                                    rating={supplier.rating}
                                    verified={supplier.isApproved}
                                    distance={supplier.distance}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-black">
                <div className="container-custom text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Are you a supplier?
                    </h2>
                    <p className="text-xl text-gray-300 mb-8">
                        Join thousands of verified suppliers and connect with buyers across India
                    </p>
                    <Link href="/vendor/signup" className="indiamart-btn-primary px-10 py-4 text-lg inline-block">
                        Register as Supplier
                    </Link>
                </div>
            </section>
        </div>
    );
}
