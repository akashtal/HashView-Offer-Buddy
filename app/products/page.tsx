'use client';

import { useEffect, useState, useCallback, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Search } from 'lucide-react';
import axios from 'axios';
import { useLocation } from '@/lib/LocationContext';
import IndiaMArtProductCard from '@/components/IndiaMART/ProductCard';
import ComprehensiveFilters, { FilterOptions } from '@/components/ui/ComprehensiveFilters';
import FilterSidebar from '@/components/ui/FilterSidebar';
import FilterChips from '@/components/ui/FilterChips';
import Link from 'next/link';

// Suspense wrapper component for search params
function ProductGrid() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { location } = useLocation();

    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalProducts, setTotalProducts] = useState(0);

    // Current filter state derived from URL
    const currentFilters: FilterOptions = useMemo(() => ({
        category: searchParams.get('category') || undefined,
        minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : 0,
        maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 50000,
        sortBy: (searchParams.get('sortBy') as any) || 'distance',
        rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : 0,
        hasOffer: searchParams.get('hasOffer') === 'true',
        query: searchParams.get('query') || undefined,
    }), [searchParams]);

    // Load initial data (categories)
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get('/api/categories?parentOnly=true');
                setCategories(res.data.data?.categories || []);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };
        fetchCategories();
    }, []);

    // Load products when filters or location change
    const loadProducts = useCallback(async () => {
        try {
            setIsLoading(true);

            const params: any = {
                limit: 50,
                page: 1,
                ...currentFilters
            };

            // Add location if available
            if (location?.coordinates) {
                params.latitude = location.coordinates.latitude;
                params.longitude = location.coordinates.longitude;
            }

            const res = await axios.get('/api/products', { params });
            setProducts(res.data.data.products || []);
            setTotalProducts(res.data.data.pagination?.total || 0);
        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            setIsLoading(false);
        }
    }, [location, currentFilters]); // Reload when URL params or location changes

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const handleApplyFilters = (newFilters: FilterOptions) => {
        const params = new URLSearchParams(searchParams.toString());

        // Update params based on new filters
        if (newFilters.category) params.set('category', newFilters.category);
        else params.delete('category');

        if (newFilters.minPrice !== undefined && newFilters.minPrice > 0) params.set('minPrice', newFilters.minPrice.toString());
        else params.delete('minPrice');

        if (newFilters.maxPrice !== undefined && newFilters.maxPrice < 50000) params.set('maxPrice', newFilters.maxPrice.toString());
        else params.delete('maxPrice');

        if (newFilters.sortBy) params.set('sortBy', newFilters.sortBy);
        else params.delete('sortBy');

        if (newFilters.rating && newFilters.rating > 0) params.set('rating', newFilters.rating.toString());
        else params.delete('rating');

        if (newFilters.hasOffer) params.set('hasOffer', 'true');
        else params.delete('hasOffer');

        // Push new URL without full reload
        router.push(`/products?${params.toString()}`);
    };

    const handleClearFilters = () => {
        router.push('/products');
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Mobile Header / Filter Bar - Sticky */}
            <div className="lg:hidden bg-white sticky top-16 z-30 shadow-sm border-b border-gray-100">
                <div className="container-custom py-3">
                    <div className="flex items-center justify-between gap-3">
                        {/* Filter Trigger */}
                        <ComprehensiveFilters
                            currentFilters={currentFilters}
                            categories={categories}
                            onApplyFilters={handleApplyFilters}
                            className="flex-shrink-0"
                        />

                        {/* Horizontal Chips Scroll */}
                        <div className="flex-1 overflow-x-auto scrollbar-hide">
                            <FilterChips
                                currentFilters={currentFilters}
                                onApplyFilters={handleApplyFilters}
                                categories={categories}
                                className="flex-nowrap"
                            />
                        </div>
                    </div>
                    {/* Results Count Mobile */}
                    <div className="container-custom py-2 text-xs text-gray-500 flex justify-between items-center">
                        <span>{isLoading ? '...' : `${totalProducts} results`}</span>
                        {location?.city && <span className="flex items-center gap-1"><MapPin size={10} /> {location.city}</span>}
                    </div>
                </div>
            </div>

            <div className="container-custom pt-6">
                <div className="custom-grid-layout flex gap-8">

                    {/* Desktop Sidebar - Sticky */}
                    <FilterSidebar
                        currentFilters={currentFilters}
                        categories={categories}
                        onApplyFilters={handleApplyFilters}
                        className="sticky top-24 h-fit"
                    />

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0">
                        {/* Desktop Header Info */}
                        <div className="hidden lg:flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Industrial Products</h1>
                                <p className="text-gray-500 text-sm mt-1">
                                    {isLoading ? 'Loading products...' : `Showing ${totalProducts} results ${location?.city ? `near ${location.city}` : ''}`}
                                </p>
                            </div>

                            {/* Filter Chips Desktop */}
                            <FilterChips
                                currentFilters={currentFilters}
                                onApplyFilters={handleApplyFilters}
                                categories={categories}
                            />
                        </div>

                        {/* Products Grid */}
                        <section>
                            {isLoading ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="bg-white rounded-xl h-80 shimmer border border-gray-100"></div>
                                    ))}
                                </div>
                            ) : products.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100">
                                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                        <Search size={40} className="text-gray-300" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-2">No Products Found</h2>
                                    <p className="text-gray-500 max-w-md mb-8">
                                        We couldn&apos;t find any products matching your filters. Try adjusting your search criteria or clearing filters.
                                    </p>
                                    <button
                                        onClick={handleClearFilters}
                                        className="px-8 py-3 bg-[#FDB913] text-black font-bold rounded-xl shadow-lg shadow-[#FDB913]/20 hover:shadow-xl hover:translate-y-[-2px] transition-all"
                                    >
                                        Clear All Filters
                                    </button>
                                </div>
                            ) : (
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
                                            distance={product.distance}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="spinner w-8 h-8 border-4 border-[#FDB913] border-t-transparent rounded-full"></div></div>}>
            <ProductGrid />
        </Suspense>
    );
}
