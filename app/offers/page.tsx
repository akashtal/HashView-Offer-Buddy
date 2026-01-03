'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Tag, Percent, Clock } from 'lucide-react';
import axios from 'axios';

export default function OffersPage() {
    const [offerProducts, setOfferProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadOffers();
    }, []);

    const loadOffers = async () => {
        try {
            const response = await axios.get('/api/products?hasOffer=true&limit=50');
            setOfferProducts(response.data.data.products);
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to load offers:', error);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Local Header Removed - Using Global Header */}

            {/* Banner */}
            <section className="bg-gradient-to-r from-red-500 to-orange-500 py-12">
                <div className="container-custom text-center text-white">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Tag size={40} />
                        <h1 className="text-4xl md:text-5xl font-bold">Special Offers</h1>
                    </div>
                    <p className="text-xl">Grab the best deals from verified suppliers</p>
                </div>
            </section>

            {/* Offers Grid */}
            <section className="py-12">
                <div className="container-custom">
                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div key={i} className="shimmer h-80 rounded-lg"></div>
                            ))}
                        </div>
                    ) : offerProducts.length === 0 ? (
                        <div className="text-center py-20">
                            <Tag size={64} className="mx-auto text-gray-300 mb-4" />
                            <h2 className="text-2xl font-bold text-gray-700 mb-2">No Offers Available</h2>
                            <p className="text-gray-600 mb-6">Check back soon for exciting deals!</p>
                            <Link href="/products" className="indiamart-btn-primary">
                                Browse All Products
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="indiamart-section-title mb-0">
                                    {offerProducts.length} Offers Available
                                </h2>
                                <div className="text-sm text-gray-600">
                                    Limited time deals
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {offerProducts.map((product) => (
                                    <Link
                                        key={product._id}
                                        href={`/products/${product._id}`}
                                        className="indiamart-product-card group relative"
                                    >
                                        {/* Offer Badge */}
                                        <div className="offer-badge-indiamart">
                                            <Percent size={14} className="inline" />
                                            {product.offer?.value}% OFF
                                        </div>

                                        {/* Product Image */}
                                        <div className="relative h-48 bg-gray-100">
                                            <Image
                                                src={product.images?.[0] || '/placeholder-product.jpg'}
                                                alt={product.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>

                                        {/* Product Info */}
                                        <div className="p-3">
                                            <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-[#FDB913] transition-colors">
                                                {product.title}
                                            </h3>

                                            {/* Pricing */}
                                            {product.price && (
                                                <div className="mb-2">
                                                    {product.price.discounted && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="indiamart-price text-lg">
                                                                ₹{product.price.discounted}
                                                            </span>
                                                            <span className="text-xs text-gray-400 line-through">
                                                                ₹{product.price.original}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {!product.price.discounted && (
                                                        <span className="indiamart-price text-lg">
                                                            ₹{product.price.original}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Offer Description */}
                                            {product.offer?.description && (
                                                <div className="text-xs text-red-600 font-semibold mb-2 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {product.offer.description}
                                                </div>
                                            )}

                                            {/* Supplier Info */}
                                            <p className="text-xs text-gray-500 mb-3">
                                                {product.vendorId?.shopName || 'Verified Supplier'}
                                            </p>

                                            {/* CTA Button */}
                                            <button className="w-full get-best-price-btn py-2 text-xs font-bold">
                                                Get Best Price
                                            </button>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}
