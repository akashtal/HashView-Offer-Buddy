'use client';

import { useEffect } from 'react';
import { useProductStore } from '@/store/productStore';
import ProductCard from '@/components/products/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Loading';
import { FiPercent } from 'react-icons/fi';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function OffersPage() {
    const { products, isLoading, fetchProducts } = useProductStore();

    useEffect(() => {
        fetchProducts(0, 0, 0, { hasOffer: true });
    }, [fetchProducts]);

    return (
        <div className="container-custom py-12">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                    <FiPercent className="text-3xl text-red-600" />
                </div>
                <h1 className="text-4xl font-bold text-secondary mb-4">
                    Best Local Offers
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Discover exclusive discounts and limited-time deals from shops near you
                </p>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))}
                </div>
            ) : products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-xl text-gray-600 mb-4">
                        No active offers found.
                    </p>
                    <Link href="/categories">
                        <Button variant="primary">Browse All Products</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
