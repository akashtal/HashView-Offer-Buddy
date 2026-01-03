'use client';

import { useEffect, useState } from 'react';
import { Search, MapPin, SlidersHorizontal, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { useLocation } from '@/lib/LocationContext';
import { INDIAN_CITIES } from '@/lib/location-utils';
import IndiaMArtProductCard from '@/components/IndiaMART/ProductCard';
import RadiusFilter from '@/components/ui/RadiusFilter';
import Link from 'next/link';

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [priceMin, setPriceMin] = useState('');
    const [priceMax, setPriceMax] = useState('');
    const [sortBy, setSortBy] = useState('distance');
    const [radius, setRadius] = useState(50); // Default 50km
    const { location } = useLocation();

    useEffect(() => {
        loadData();
    }, [location, radius, selectedCategory, sortBy]); // Reload when these change

    const loadData = async () => {
        try {
            setIsLoading(true);

            const params: any = {
                limit: 100,
                sortBy: sortBy || 'distance'
            };

            // Add location params if available
            if (location?.coordinates) {
                params.latitude = location.coordinates.latitude;
                params.longitude = location.coordinates.longitude;
                params.radius = radius;
            }

            // Add filters
            if (selectedCategory) {
                params.category = selectedCategory;
            }

            // Fetch products
            const productsRes = await axios.get('/api/products', { params });
            const productsData = productsRes.data.data.products;
            setProducts(productsData);

            // Fetch categories
            const categoriesRes = await axios.get('/api/categories?parentOnly=true');
            const categoriesData = categoriesRes.data.data;
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);

            setIsLoading(false);
        } catch (error) {
            console.error('Failed to load data:', error);
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            // Filter products by search query
            const filtered = products.filter((p) =>
                p.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setProducts(filtered);
        } else {
            loadData();
        }
    };

    // Apply filters
    let filtered = selectedCategory
        ? products.filter((p) => p.category?._id === selectedCategory || p.category === selectedCategory)
        : products;

    // Price range filter
    if (priceMin || priceMax) {
        filtered = filtered.filter((p) => {
            const price = p.price?.discounted || p.price?.original || 0;
            const min = priceMin ? parseFloat(priceMin) : 0;
            const max = priceMax ? parseFloat(priceMax) : Infinity;
            return price >= min && price <= max;
        });
    }

    // Sorting
    if (sortBy) {
        const sorted = [...filtered];
        switch (sortBy) {
            case 'price-low':
                sorted.sort((a, b) => {
                    const priceA = a.price?.discounted || a.price?.original || 0;
                    const priceB = b.price?.discounted || b.price?.original || 0;
                    return priceA - priceB;
                });
                break;
            case 'price-high':
                sorted.sort((a, b) => {
                    const priceA = a.price?.discounted || a.price?.original || 0;
                    const priceB = b.price?.discounted || b.price?.original || 0;
                    return priceB - priceA;
                });
                break;
            case 'newest':
                sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
        }
        filtered = sorted;
    }

    const filteredProducts = filtered;

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('');
        setPriceMin('');
        setPriceMax('');
        setSortBy('');
        loadData();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Radius Filter Only */}
            <div className="bg-white border-b border-gray-200 py-4 sticky top-20 z-30">
                <div className="container-custom">
                    <div className="flex items-center justify-between">
                        <RadiusFilter value={radius} onChange={setRadius} />
                        {location?.coordinates && (
                            <p className="text-xs text-gray-500">
                                {products.length} products within {radius}km
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Search & Filter Section */}
            <div className="bg-white border-b border-gray-200 py-6">
                <div className="container-custom">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search Bar */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Search for products, services, suppliers..."
                                className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FDB913] focus:border-transparent"
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FDB913] focus:border-transparent bg-white"
                        >
                            <option value="distance">Nearest First</option>
                            <option value="price_low">Price: Low to High</option>
                            <option value="price_high">Price: High to Low</option>
                            <option value="newest">Newest First</option>
                            <option value="popular">Most Popular</option>
                        </select>

                        {/* Search Button */}
                        <button
                            onClick={handleSearch}
                            className="indiamart-btn-primary px-8 whitespace-nowrap flex items-center gap-2"
                        >
                            <Search size={18} />
                            Search
                        </button>

                        {/* Clear Filters */}
                        {(searchQuery || selectedCategory || priceMin || priceMax || sortBy) && (
                            <button
                                onClick={clearFilters}
                                className="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors whitespace-nowrap"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    {/* Price Range Filter */}
                    <div className="flex items-center gap-4 mt-4">
                        <span className="text-sm font-medium text-gray-700">Price Range:</span>
                        <input
                            type="number"
                            value={priceMin}
                            onChange={(e) => setPriceMin(e.target.value)}
                            placeholder="Min"
                            className="w-32 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FDB913] focus:border-transparent"
                        />
                        <span className="text-gray-500">—</span>
                        <input
                            type="number"
                            value={priceMax}
                            onChange={(e) => setPriceMax(e.target.value)}
                            placeholder="Max"
                            className="w-32 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FDB913] focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Categories Bar */}
            <div className="bg-white border-b border-gray-200 py-4 sticky top-20 z-30">
                <div className="container-custom">
                    <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => setSelectedCategory('')}
                            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${!selectedCategory
                                ? 'bg-[#FDB913] text-black'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All Products
                        </button>
                        {Array.isArray(categories) && categories.map((cat) => (
                            <button
                                key={cat._id}
                                onClick={() => setSelectedCategory(cat._id)}
                                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${selectedCategory === cat._id
                                    ? 'bg-[#FDB913] text-black'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <section className="py-8">
                <div className="container-custom">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="indiamart-section-title mb-0">
                            {filteredProducts.length} Products Available
                        </h1>
                        {location?.city && (
                            <p className="text-gray-600">
                                Showing products near <span className="font-semibold">{location.city}</span>
                            </p>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div key={i} className="shimmer h-80 rounded-lg"></div>
                            ))}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-20">
                            <SlidersHorizontal size={64} className="mx-auto text-gray-300 mb-4" />
                            <h2 className="text-2xl font-bold text-gray-700 mb-2">No Products Found</h2>
                            <p className="text-gray-600 mb-6">Try adjusting your filters or search terms</p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('');
                                    loadData();
                                }}
                                className="indiamart-btn-primary"
                            >
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredProducts.map((product) => (
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
                </div>
            </section>
        </div>
    );
}
