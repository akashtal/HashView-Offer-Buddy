'use client';

import { useState } from 'react';
import IndiaMArtProductCard from '@/components/IndiaMART/ProductCard';
import LoadMoreButton from '@/components/products/LoadMoreButton';

interface ProductListClientProps {
    initialProducts: any[];
    initialPagination: {
        page: number;
        hasMore: boolean;
    };
    baseUrl: string;
}

export default function ProductListClient({
    initialProducts,
    initialPagination,
    baseUrl
}: ProductListClientProps) {
    const [products, setProducts] = useState(initialProducts);

    const handleLoadMore = (newProducts: any[]) => {
        setProducts(prev => [...prev, ...newProducts]);
    };

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">No Products Found</h2>
                <p className="text-gray-500 max-w-md">
                    Try adjusting your search criteria or browse all products.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                    <IndiaMArtProductCard
                        key={product._id}
                        id={product._id}
                        title={product.title}
                        image={product.images?.[0]}
                        price={product.price}
                        offer={product.offer}
                        vendor={{
                            shopName: product.vendorId?.shopName || 'Verified Supplier',
                            city: product.vendorId?.location?.city,
                        }}
                        vendorId={product.vendorId?._id || product.vendorId}
                        distance={product.distance}
                    />
                ))}
            </div>

            <LoadMoreButton
                currentPage={initialPagination.page}
                hasMore={initialPagination.hasMore}
                baseUrl={baseUrl}
                onLoadMore={handleLoadMore}
            />
        </>
    );
}
