'use client';
// Force HMR update

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import CategoryCarousel from '@/components/SwiggyComponents/CategoryCarousel';
import RestaurantCard from '@/components/SwiggyComponents/RestaurantCard';
import RadiusFilter from '@/components/ui/RadiusFilter';
import ComprehensiveFilters, { FilterOptions } from '@/components/ui/ComprehensiveFilters';
import FilterChips from '@/components/ui/FilterChips';
import { useLocation } from '@/lib/LocationContext';

export default function ClientHomePage() {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]); // Added categories state
    const [selectedCategory, setSelectedCategory] = useState('');
    const [filters, setFilters] = useState<FilterOptions>({
        sortBy: 'relevance',
        rating: 0,
        hasOffer: false
    });
    const [radius, setRadius] = useState(50); // Default 50km
    const [facets, setFacets] = useState<any>(null); // State for facets
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const { location } = useLocation();

    // Fetch categories
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

    // Products are now fully managed by server-side filtering
    // This effect triggers whenever filters, location, or radius changes
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setIsLoading(true);
                const params: any = {
                    limit: 20,
                    sortBy: filters.sortBy || 'distance'
                };

                // Add location params
                if (location?.coordinates) {
                    params.latitude = location.coordinates.latitude;
                    params.longitude = location.coordinates.longitude;
                    params.radius = radius;
                }

                // Add Filters to API Params
                if (selectedCategory) params.category = selectedCategory;
                if (filters.category && !selectedCategory) params.category = filters.category;

                if (filters.hasOffer) params.hasOffer = true;
                if (filters.rating) params.rating = filters.rating;
                if (filters.minPrice) params.minPrice = filters.minPrice;
                if (filters.maxPrice) params.maxPrice = filters.maxPrice;

                const response = await axios.get('/api/products', { params });
                const fetchedProducts = response.data.data.products;
                const fetchedFacets = response.data.data.facets;

                setProducts(fetchedProducts || []);
                setPage(1);
                setHasMore(response.data.data.pagination?.hasMore ?? false);

                // Update facets if available (usually on first load or relevant queries)
                if (fetchedFacets) {
                    setFacets(fetchedFacets);
                }

                setIsLoading(false);
            } catch (error) {
                console.error('Failed to load products:', error);
                setProducts([]); // Clear products on error instead of using hardcoded mock data
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, [location, radius, filters, selectedCategory]);

    // Load more products
    const loadMore = async () => {
        if (isLoadingMore || !hasMore) return;

        try {
            setIsLoadingMore(true);
            const nextPage = page + 1;
            const params: any = {
                limit: 20,
                page: nextPage,
                sortBy: filters.sortBy || 'distance'
            };

            if (location?.coordinates) {
                params.latitude = location.coordinates.latitude;
                params.longitude = location.coordinates.longitude;
                params.radius = radius;
            }

            if (selectedCategory) params.category = selectedCategory;
            if (filters.category && !selectedCategory) params.category = filters.category;
            if (filters.hasOffer) params.hasOffer = true;
            if (filters.rating) params.rating = filters.rating;
            if (filters.minPrice) params.minPrice = filters.minPrice;
            if (filters.maxPrice) params.maxPrice = filters.maxPrice;

            const response = await axios.get('/api/products', { params });
            const newProducts = response.data.data.products || [];

            setProducts(prev => [...prev, ...newProducts]);
            setPage(nextPage);
            setHasMore(response.data.data.pagination?.hasMore ?? false);
        } catch (error) {
            console.error('Failed to load more products:', error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleFilterChange = (newFilters: FilterOptions) => {
        setFilters(newFilters);
        // Sync category selection from modal
        if (newFilters.category !== undefined && newFilters.category !== selectedCategory) {
            setSelectedCategory(newFilters.category || '');
        }
    };

    // Sync selectedCategory with filters for Chips display
    const currentFiltersForChips = {
        ...filters,
        category: selectedCategory || filters.category
    };

    return (
        <div className="min-h-screen bg-[#F5F5F5]">
            {/* Category Carousel */}
            <CategoryCarousel onCategorySelect={setSelectedCategory} selectedCategory={selectedCategory} />

            {/* Radius Control and Filters */}
            <div className="bg-white border-b border-gray-100 py-3 sticky top-16 z-30 shadow-sm">
                <div className="container-custom">
                    <div className="flex flex-col gap-3">
                        {/* Top Row: Controls */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
                                <RadiusFilter value={radius} onChange={setRadius} />
                                <div className="h-6 w-px bg-gray-200 shrink-0"></div>
                                <ComprehensiveFilters
                                    onApplyFilters={handleFilterChange}
                                    currentFilters={filters}
                                    categories={categories}
                                    facets={facets}
                                />
                            </div>
                            {/* Desktop: keep chips INLINE (no second row) */}
                            <div className="hidden lg:flex items-center gap-3 min-w-0">
                                {(selectedCategory || filters.hasOffer || (filters.rating || 0) > 0 || (filters.minPrice || 0) > 0) && (
                                    <div className="max-w-[42vw] min-w-0">
                                        <FilterChips
                                            currentFilters={currentFiltersForChips}
                                            categories={categories}
                                            onApplyFilters={(f) => {
                                                handleFilterChange(f);
                                                if (f.category === undefined) setSelectedCategory('');
                                            }}
                                        />
                                    </div>
                                )}
                                {location?.coordinates && (
                                    <p className="text-xs font-medium text-gray-500 whitespace-nowrap">
                                        {products.length} items near you
                                    </p>
                                )}
                            </div>

                            {/* Tablet/Desktop (below lg): count only */}
                            {location?.coordinates && (
                                <p className="hidden sm:block lg:hidden text-xs font-medium text-gray-500 whitespace-nowrap">
                                    {products.length} items near you
                                </p>
                            )}
                        </div>

                        {/* Bottom Row: Chips (mobile/tablet only) */}
                        <div className="lg:hidden">
                            {(selectedCategory || filters.hasOffer || (filters.rating || 0) > 0 || (filters.minPrice || 0) > 0) && (
                                <FilterChips
                                    currentFilters={currentFiltersForChips}
                                    categories={categories}
                                    onApplyFilters={(f) => {
                                        handleFilterChange(f);
                                        if (f.category === undefined) setSelectedCategory('');
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Restaurants/Products Grid */}
            <section className="py-4">
                <div className="container-custom">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-[#282C3F]">
                            Industrial Supplies & Machinery
                        </h2>
                        {/* Count for Mobile */}
                        {location?.coordinates && (
                            <p className="sm:hidden text-xs font-medium text-gray-500">
                                {products.length} items
                            </p>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="shimmer h-80 rounded-2xl"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {products.map((product) => (
                                <RestaurantCard
                                    key={product._id}
                                    id={product._id}
                                    name={product.title}
                                    image={product.images?.[0]}
                                    rating={product.rating}
                                    reviewCount={product.reviewCount}
                                    cuisine={product.description}
                                    priceForTwo={product.price?.original}
                                    offer={product.offer}
                                    distance={product.distance}
                                    vendorId={product.vendorId?._id}
                                    vendorName={product.vendorId?.shopName}
                                />
                            ))}
                        </div>
                    )}

                    {/* Load More Button */}
                    {!isLoading && hasMore && (
                        <div className="flex justify-center mt-8">
                            <button
                                onClick={loadMore}
                                disabled={isLoadingMore}
                                className="px-8 py-3 bg-[#FDB913] text-black font-semibold rounded-xl hover:bg-[#e5a811] transition-colors disabled:opacity-50"
                            >
                                {isLoadingMore ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
