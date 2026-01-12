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
    const [showFilters, setShowFilters] = useState(false);
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

            // Add location params if available - but don't enforce strict radius filtering
            // This allows showing all products sorted by distance when none in radius
            if (location?.coordinates) {
                params.latitude = location.coordinates.latitude;
                params.longitude = location.coordinates.longitude;
                // Add radius as preference, not hard limit
                params.radius = 10000000; // Very large to explicitly ensure we get all products (including those with no location)
            }

            // Add filters
            if (selectedCategory) {
                params.category = selectedCategory;
            }

            // Fetch products
            const productsRes = await axios.get('/api/products', { params });
            const productsData = productsRes.data.data.products;
            setProducts(productsData);

            // Fetch categories - Fixed data extraction
            const categoriesRes = await axios.get('/api/categories?parentOnly=true');
            const categoriesData = categoriesRes.data.data?.categories || categoriesRes.data.data || [];
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

    // Check how many products are within the selected radius
    const productsWithinRadius = filtered.filter((p) => {
        if (!p.distance) return true; // Include products without distance
        return p.distance <= radius;
    });

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
            case 'distance':
            default:
                // Sort by distance (nearest first)
                sorted.sort((a, b) => {
                    if (!a.distance && !b.distance) return 0;
                    if (!a.distance) return 1;
                    if (!b.distance) return -1;
                    return a.distance - b.distance;
                });
                break;
        }
        filtered = sorted;
    }

    const filteredProducts = filtered;
    const showNearbyMessage = location?.coordinates && productsWithinRadius.length === 0 && filteredProducts.length > 0;

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
            {/* Horizontal Filter Bar - Fully Responsive */}
            <div className="bg-white border-b border-gray-200 sticky top-20 z-30 shadow-sm">
                <div className="container-custom py-3">
                    {/* Scrollable Filter Chips Container */}
                    <div className="flex items-center gap-2 md:gap-3 overflow-x-auto scrollbar-hide">
                        {/* Filter Button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 md:py-2.5 bg-white border-2 rounded-full font-medium hover:border-gray-400 transition-all whitespace-nowrap flex-shrink-0 ${showFilters ? 'border-[#FDB913] bg-[#FFF9E6]' : 'border-gray-300'
                                }`}
                            aria-label="Toggle filters"
                        >
                            <SlidersHorizontal size={16} className="md:w-[18px] md:h-[18px]" />
                            <span className="text-sm md:text-base">Filter</span>
                        </button>

                        {/* Sort By Dropdown */}
                        <div className="relative flex-shrink-0">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none pl-4 pr-9 py-2 md:py-2.5 bg-white border-2 border-gray-300 rounded-full font-medium hover:border-gray-400 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FDB913] whitespace-nowrap text-sm md:text-base"
                                aria-label="Sort products"
                            >
                                <option value="distance">Sort by: Nearest</option>
                                <option value="price-low">Sort by: Price Low</option>
                                <option value="price-high">Sort by: Price High</option>
                                <option value="newest">Sort by: Newest</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600" size={16} />
                        </div>

                        {/* Radius Filter Chip */}
                        <div className="flex-shrink-0">
                            <RadiusFilter value={radius} onChange={setRadius} />
                        </div>

                        {/* Active Category Filter Chip */}
                        {selectedCategory && (
                            <button
                                onClick={() => setSelectedCategory('')}
                                className="flex items-center gap-2 px-4 py-2 md:py-2.5 bg-[#FDB913] text-black font-medium rounded-full hover:bg-[#E5A600] transition-all whitespace-nowrap flex-shrink-0 shadow-sm text-sm md:text-base"
                                aria-label="Remove category filter"
                            >
                                <span className="max-w-[120px] md:max-w-none truncate">
                                    {categories.find(c => c._id === selectedCategory)?.name}
                                </span>
                                <span className="text-lg leading-none">×</span>
                            </button>
                        )}

                        {/* Active Price Filter Chip */}
                        {(priceMin || priceMax) && (
                            <button
                                onClick={() => {
                                    setPriceMin('');
                                    setPriceMax('');
                                }}
                                className="flex items-center gap-2 px-4 py-2 md:py-2.5 bg-[#FDB913] text-black font-medium rounded-full hover:bg-[#E5A600] transition-all whitespace-nowrap flex-shrink-0 shadow-sm text-sm md:text-base"
                                aria-label="Remove price filter"
                            >
                                ₹{priceMin || '0'} - ₹{priceMax || '∞'}
                                <span className="text-lg leading-none">×</span>
                            </button>
                        )}

                        {/* Clear All - Only show if filters are active */}
                        {(selectedCategory || priceMin || priceMax || sortBy !== 'distance') && (
                            <button
                                onClick={clearFilters}
                                className="ml-auto px-4 py-2 text-sm md:text-base text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap flex-shrink-0 transition-colors"
                                aria-label="Clear all filters"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    {/* Results count - Mobile optimized */}
                    {location?.coordinates && filteredProducts.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2 px-1">
                            {productsWithinRadius.length > 0
                                ? `${productsWithinRadius.length} product${productsWithinRadius.length !== 1 ? 's' : ''} within ${radius}km`
                                : `Showing ${filteredProducts.length} products from nearby areas`
                            }
                        </p>
                    )}
                </div>
            </div>

            {/* Expandable Filter Panel - Smooth Animation */}
            <div
                className={`bg-gray-50 border-b border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="container-custom py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Category Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-3 py-2.5 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDB913] focus:border-[#FDB913] transition-all text-sm md:text-base"
                            >
                                <option value="">All Categories</option>
                                {Array.isArray(categories) && categories.map((cat) => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Price Range - Min */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Min Price</label>
                            <input
                                type="number"
                                value={priceMin}
                                onChange={(e) => setPriceMin(e.target.value)}
                                placeholder="₹ 0"
                                className="w-full px-3 py-2.5 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDB913] focus:border-[#FDB913] transition-all text-sm md:text-base"
                            />
                        </div>

                        {/* Price Range - Max */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Max Price</label>
                            <input
                                type="number"
                                value={priceMax}
                                onChange={(e) => setPriceMax(e.target.value)}
                                placeholder="₹ No Limit"
                                className="w-full px-3 py-2.5 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FDB913] focus:border-[#FDB913] transition-all text-sm md:text-base"
                            />
                        </div>

                        {/* Apply Button */}
                        <div className="flex items-end">
                            <button
                                onClick={() => setShowFilters(false)}
                                className="w-full indiamart-btn-primary py-2.5 text-sm md:text-base font-bold shadow-md hover:shadow-lg transition-all"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <section className="py-8">
                <div className="container-custom">
                    {/* Location Display Banner */}
                    {location?.city && (
                        <div className="bg-gradient-to-r from-[#FDB913] to-[#E5A600] text-black px-6 py-4 rounded-lg mb-6 shadow-md">
                            <div className="flex items-center gap-3">
                                <MapPin size={24} className="flex-shrink-0" />
                                <div>
                                    <div className="font-bold text-lg">
                                        {location.city}{location.state ? `, ${location.state}` : ''}
                                    </div>
                                    <div className="text-sm opacity-90">
                                        Showing products near your location
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-6">
                        <h1 className="indiamart-section-title mb-0">
                            {filteredProducts.length} Products Available
                        </h1>
                    </div>

                    {/* No Products at Location Message */}
                    {showNearbyMessage && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
                            <div className="flex items-start gap-3">
                                <SlidersHorizontal className="text-blue-500 flex-shrink-0 mt-1" size={24} />
                                <div>
                                    <h3 className="font-bold text-blue-900 mb-2">
                                        No products found at your exact location
                                    </h3>
                                    <p className="text-blue-800 text-sm mb-3">
                                        We couldn&apos;t find products within {radius}km of {location.city}.
                                        Showing products from nearby areas instead.
                                    </p>
                                    <button
                                        onClick={() => setRadius(radius + 50)}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
                                    >
                                        Increase search radius to {radius + 50}km
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div key={i} className="shimmer h-80 rounded-lg"></div>
                            ))}
                        </div>
                    ) : filteredProducts.length === 0 && products.length === 0 ? (
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
