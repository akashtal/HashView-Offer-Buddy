'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { FiSearch, FiFilter, FiX, FiChevronDown } from 'react-icons/fi';
import ProductCard from '@/components/products/ProductCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import Card from '@/components/ui/Card';

// Filter Sidebar Component
const FilterSidebar = ({
    categories,
    selectedCategory,
    priceRange,
    setPriceRange,
    handleCategoryChange,
    onApply,
    onClear
}: any) => {
    return (
        <div className="space-y-8">
            {/* Categories */}
            <div>
                <h3 className="font-bold text-gray-900 mb-4">Categories</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                            type="radio"
                            name="category"
                            checked={!selectedCategory}
                            onChange={() => handleCategoryChange('')}
                            className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <span className={`text-sm group-hover:text-primary transition-colors ${!selectedCategory ? 'font-medium text-primary' : 'text-gray-600'}`}>
                            All Categories
                        </span>
                    </label>
                    {categories.map((cat: any) => (
                        <label key={cat._id} className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="radio"
                                name="category"
                                checked={selectedCategory === cat._id}
                                onChange={() => handleCategoryChange(cat._id)}
                                className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                            />
                            <span className={`text-sm group-hover:text-primary transition-colors ${selectedCategory === cat._id ? 'font-medium text-primary' : 'text-gray-600'}`}>
                                {cat.name}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div>
                <h3 className="font-bold text-gray-900 mb-4">Price Range</h3>
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label className="text-xs text-gray-500 mb-1 block">Min</label>
                            <input
                                type="number"
                                value={priceRange.min}
                                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                placeholder="0"
                            />
                        </div>
                        <div className="w-1/2">
                            <label className="text-xs text-gray-500 mb-1 block">Max</label>
                            <input
                                type="number"
                                value={priceRange.max}
                                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                placeholder="10000"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 flex gap-3">
                <Button onClick={onApply} fullWidth size="sm">
                    Apply Filters
                </Button>
                <button
                    onClick={onClear}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
                >
                    Clear
                </button>
            </div>
        </div>
    );
};

function ProductsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // Filters State
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [priceRange, setPriceRange] = useState({
        min: searchParams.get('minPrice') || '',
        max: searchParams.get('maxPrice') || ''
    });
    const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');

    // Fetch Initial Data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [catsRes] = await Promise.all([
                    axios.get('/api/categories?parentOnly=true')
                ]);
                setCategories(catsRes.data.data.categories);
            } catch (error) {
                console.error('Error loading initial data:', error);
            }
        };
        fetchInitialData();
    }, []);

    // Fetch Products with Filters
    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: any = {
                limit: 50,
                sortBy
            };

            if (searchTerm) params.search = searchTerm;
            if (selectedCategory) params.category = selectedCategory;
            if (priceRange.min) params.minPrice = priceRange.min;
            if (priceRange.max) params.maxPrice = priceRange.max;

            const response = await axios.get('/api/products', { params });
            setProducts(response.data.data.products);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, selectedCategory, priceRange.min, priceRange.max, sortBy]);

    // Initial load and URL param sync
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Handlers
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchProducts();
        updateUrl();
    };

    const handleApplyFilters = () => {
        fetchProducts();
        updateUrl();
        setIsMobileFilterOpen(false);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedCategory('');
        setPriceRange({ min: '', max: '' });
        setSortBy('newest');
        router.push('/products');
    };

    const updateUrl = () => {
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (selectedCategory) params.set('category', selectedCategory);
        if (priceRange.min) params.set('minPrice', priceRange.min);
        if (priceRange.max) params.set('maxPrice', priceRange.max);
        if (sortBy) params.set('sortBy', sortBy);
        router.push(`/products?${params.toString()}`);
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* Header / Breadcrumb Area */}
            <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
                <div className="container-custom py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">All Products</h1>
                            <p className="text-sm text-gray-500">
                                {products.length} results found
                            </p>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {/* Mobile Filter Toggle */}
                            <button
                                onClick={() => setIsMobileFilterOpen(true)}
                                className="md:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium"
                            >
                                <FiFilter /> Filters
                            </button>

                            {/* Search Bar */}
                            <form onSubmit={handleSearch} className="relative flex-1 md:w-80">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-primary rounded-lg text-sm transition-all outline-none border"
                                />
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </form>

                            {/* Sort Dropdown */}
                            <div className="relative hidden md:block">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none bg-white border border-gray-200 px-4 py-2 pr-8 rounded-lg text-sm focus:border-primary outline-none cursor-pointer"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="price_low">Price: Low to High</option>
                                    <option value="price_high">Price: High to Low</option>
                                    <option value="popular">Most Popular</option>
                                </select>
                                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-custom py-8">
                <div className="flex gap-8">
                    {/* Desktop Sidebar */}
                    <aside className="hidden md:block w-64 flex-shrink-0">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-24">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-bold text-lg flex items-center gap-2">
                                    <FiFilter className="text-primary" /> Filters
                                </h2>
                            </div>
                            <FilterSidebar
                                categories={categories}
                                selectedCategory={selectedCategory}
                                priceRange={priceRange}
                                setPriceRange={setPriceRange}
                                handleCategoryChange={setSelectedCategory}
                                onApply={handleApplyFilters}
                                onClear={handleClearFilters}
                            />
                        </div>
                    </aside>

                    {/* Product Grid */}
                    <main className="flex-1">
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : products.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map((product) => (
                                    <div key={product._id} className="h-full">
                                        <ProductCard product={product} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FiSearch className="text-3xl text-gray-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                                <p className="text-gray-500 max-w-sm mx-auto mb-6">
                                    We couldn&apos;t find any products matching your current filters. Try adjusting your search or clearing filters.
                                </p>
                                <Button variant="outline" onClick={handleClearFilters}>
                                    Clear All Filters
                                </Button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile Filter Drawer */}
            {isMobileFilterOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileFilterOpen(false)} />
                    <div className="absolute inset-y-0 right-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold">Filters</h2>
                            <button
                                onClick={() => setIsMobileFilterOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <FiX className="text-xl" />
                            </button>
                        </div>
                        <FilterSidebar
                            categories={categories}
                            selectedCategory={selectedCategory}
                            priceRange={priceRange}
                            setPriceRange={setPriceRange}
                            handleCategoryChange={setSelectedCategory}
                            onApply={handleApplyFilters}
                            onClear={handleClearFilters}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<Loading fullScreen text="Loading products..." />}>
            <ProductsContent />
        </Suspense>
    );
}
