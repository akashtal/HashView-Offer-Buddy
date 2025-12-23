'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useProductStore } from '@/store/productStore';
import { useLocationStore } from '@/store/locationStore';
import ProductCard from '@/components/products/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Loading';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import axios from 'axios';

function SearchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { latitude, longitude, radius, hasPermission } = useLocationStore();
    const { products, isLoading, fetchProducts } = useProductStore();

    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [categories, setCategories] = useState<any[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    // Fetch categories for filter
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await axios.get('/api/categories?parentOnly=true');
                setCategories(response.data.data.categories);
            } catch (error) {
                console.error('Failed to load categories:', error);
            }
        };
        loadCategories();
    }, []);

    // Fetch products when params or location changes
    useEffect(() => {
        if (hasPermission && latitude && longitude) {
            const params: any = {};

            const q = searchParams.get('q');
            if (q) params.query = q;

            const cat = searchParams.get('category');
            if (cat) params.category = cat;

            const minPrice = searchParams.get('minPrice');
            if (minPrice) params.minPrice = minPrice;

            const maxPrice = searchParams.get('maxPrice');
            if (maxPrice) params.maxPrice = maxPrice;

            // Reset local state if URL changes
            if (q && q !== query) setQuery(q);
            if (cat && cat !== selectedCategory) setSelectedCategory(cat);

            fetchProducts(latitude, longitude, radius, params);
        }
    }, [searchParams, hasPermission, latitude, longitude, radius]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());

        if (query) {
            params.set('q', query);
        } else {
            params.delete('q');
        }

        if (selectedCategory) {
            params.set('category', selectedCategory);
        } else {
            params.delete('category');
        }

        router.push(`/search?${params.toString()}`);
    };

    const clearFilters = () => {
        setQuery('');
        setSelectedCategory('');
        router.push('/search');
    };

    return (
        <div className="container-custom py-8">
            {/* Search Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-secondary mb-6">
                    Find Products Nearby
                </h1>

                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search for products..."
                            icon={<FiSearch />}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white min-w-[150px]"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        <Button type="submit" variant="primary">
                            Search
                        </Button>
                        {/* Mobile Filter Toggle could go here */}
                    </div>
                </form>

                {(searchParams.toString()) && (
                    <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
                        <span>Active Filters:</span>
                        <button
                            onClick={clearFilters}
                            className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                        >
                            <FiX /> Clear All
                        </button>
                    </div>
                )}
            </div>

            {/* Results */}
            {!hasPermission ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <p className="text-lg text-gray-600 mb-4">
                        Please enable location to search for products near you
                    </p>
                </div>
            ) : (
                <>
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : products.length > 0 ? (
                        <>
                            <p className="text-gray-600 mb-4">
                                Found {products.length} products
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {products.map((product) => (
                                    <ProductCard key={product._id} product={product} />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-xl text-gray-600 mb-4">
                                No products found matching your search.
                            </p>
                            <p className="text-gray-500">
                                Try adjusting your filters or search radius.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="container-custom py-12 text-center">Loading search...</div>}>
            <SearchContent />
        </Suspense>
    );
}
