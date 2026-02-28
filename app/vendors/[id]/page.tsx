'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
    Phone,
    MapPin,
    Clock,
    ShieldCheck,
    Star,
    Mail,
    Globe,
    CheckCircle,
    MessageSquare,
    Search,
} from 'lucide-react';
import axios from 'axios';
import { useLocation } from '@/lib/LocationContext';
import { calculateDistance } from '@/lib/location-utils';
import IndiaMArtProductCard from '@/components/IndiaMART/ProductCard';
import ChatButton from '@/components/chat/ChatButton';
import ComprehensiveFilters, { FilterOptions } from '@/components/ui/ComprehensiveFilters';
import FilterChips from '@/components/ui/FilterChips';
import VendorLocationMap from '@/components/VendorLocationMap';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';

export default function VendorDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const vendorId = params.id as string;
    const { location } = useLocation();

    const [vendor, setVendor] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProductsLoading, setIsProductsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('products');
    const [showEnquiryModal, setShowEnquiryModal] = useState(false);

    // Auth State
    const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();

    // Contact Supplier Form State
    const [contactMobile, setContactMobile] = useState('');
    const [contactRequirement, setContactRequirement] = useState('');
    const [isSubmittingContact, setIsSubmittingContact] = useState(false);
    const { showToast } = useToast();

    // Pagination state
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalProducts, setTotalProducts] = useState(0);

    // Filters state — same shape as homepage
    const [filters, setFilters] = useState<FilterOptions>({
        sortBy: 'relevance',
        rating: 0,
        hasOffer: false,
    });

    // Facets from Server
    const [facets, setFacets] = useState<any>({ minPrice: 0, maxPrice: 50000 });

    // Search from URL params (synced with header search)
    const searchQuery = searchParams.get('search') || '';
    const [localSearch, setLocalSearch] = useState(searchQuery);

    // Sync local search when URL params change (e.g. from header search)
    useEffect(() => {
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (localSearch.trim()) {
            params.set('search', localSearch.trim());
        } else {
            params.delete('search');
        }
        router.push(`/vendors/${vendorId}?${params.toString()}`, { scroll: false });
    };

    const clearSearch = () => {
        setLocalSearch('');
        const params = new URLSearchParams(searchParams.toString());
        params.delete('search');
        router.push(`/vendors/${vendorId}?${params.toString()}`, { scroll: false });
    };

    const handleFilterChange = (newFilters: FilterOptions) => {
        setFilters(newFilters);
        // Reset to page 1 is handled by the effect dependency
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactMobile.trim() || !contactRequirement.trim()) {
            showToast('Please provide both mobile number and requirement', 'error');
            return;
        }

        try {
            setIsSubmittingContact(true);
            await axios.post(`/api/vendors/${vendorId}/contact`, {
                mobileNumber: contactMobile.trim(),
                requirement: contactRequirement.trim()
            });
            showToast('Requirement submitted successfully. The vendor will contact you soon.', 'success');
            setShowEnquiryModal(false);
            setContactMobile('');
            setContactRequirement('');
        } catch (error: any) {
            console.error('Contact submit error:', error);
            showToast(error.response?.data?.error || 'Failed to submit requirement', 'error');
        } finally {
            setIsSubmittingContact(false);
        }
    };

    // Authentication Protection
    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push(`/signin?from=/vendors/${vendorId}`);
        }
    }, [isAuthLoading, isAuthenticated, router, vendorId]);

    // Load Vendor Details (Run once)
    useEffect(() => {
        const fetchVendor = async () => {
            try {
                const vendorRes = await axios.get(`/api/vendors/${vendorId}`);
                const vendorData = vendorRes.data.data.vendor;

                if (location?.coordinates && vendorData.location?.coordinates) {
                    let vendorLng, vendorLat;
                    const coords = vendorData.location.coordinates;

                    if (Array.isArray(coords)) {
                        [vendorLng, vendorLat] = coords;
                    } else if (coords?.coordinates && Array.isArray(coords.coordinates)) {
                        [vendorLng, vendorLat] = coords.coordinates;
                    }

                    if (typeof vendorLng === 'number' && typeof vendorLat === 'number') {
                        vendorData.distance = calculateDistance(
                            location.coordinates,
                            { latitude: vendorLat, longitude: vendorLng }
                        );
                    }
                }
                setVendor(vendorData);

                // Fetch categories for filter drawer
                try {
                    const catRes = await axios.get('/api/categories?parentOnly=true');
                    setCategories(catRes.data.data?.categories || []);
                } catch { }
            } catch (error) {
                console.error('Failed to load vendor:', error);
            } finally {
                setIsLoading(false);
            }
        };
        if (vendorId) fetchVendor();
    }, [vendorId, location]);

    // Fetch Products (Server-side filtering & pagination)
    const fetchGithubProducts = useCallback(async (isLoadMore = false) => {
        if (!vendorId) return;

        try {
            const currentPage = isLoadMore ? page + 1 : 1;
            if (!isLoadMore) setIsProductsLoading(true);

            const params: any = {
                vendorId,
                page: currentPage,
                limit: 20,
                sortBy: filters.sortBy || 'relevance',
            };

            // Pass user location so API computes distance server-side
            if (location?.coordinates) {
                params.latitude = location.coordinates.latitude;
                params.longitude = location.coordinates.longitude;
            }

            if (searchQuery) params.query = searchQuery;
            if (filters.category) params.category = filters.category;
            if (filters.hasOffer) params.hasOffer = true;
            if (filters.rating) params.rating = filters.rating;
            if (filters.minPrice) params.minPrice = filters.minPrice;
            if (filters.maxPrice) params.maxPrice = filters.maxPrice;

            const res = await axios.get('/api/products', { params });
            const newProducts = res.data.data.products || [];
            const pagination = res.data.data.pagination;
            const stats = res.data.data.stats;

            if (isLoadMore) {
                setProducts(prev => [...prev, ...newProducts]);
                setPage(currentPage);
            } else {
                setProducts(newProducts);
                setPage(1);
                // Update facets only on initial load or filter change (if needed)
                if (stats) setFacets({ minPrice: stats.minPrice, maxPrice: stats.maxPrice });
            }

            setHasMore(pagination?.hasMore || false);
            setTotalProducts(pagination?.total || 0);

        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setIsProductsLoading(false);
        }
    }, [vendorId, searchQuery, filters, page, location]);

    // Trigger fetch when filters/search change
    useEffect(() => {
        fetchGithubProducts(false); // Reset and fetch
    }, [vendorId, searchQuery, filters]);

    const loadMore = () => {
        if (!hasMore || isProductsLoading) return;
        fetchGithubProducts(true);
    };

    // Check if any filter is active (for chips display)
    const hasActiveFilters = filters.category || filters.hasOffer || (filters.rating || 0) > 0 || (filters.minPrice || 0) > 0 || (filters.maxPrice && filters.maxPrice < 50000);

    // Prevent rendering vendor content if unauthenticated
    if (isAuthLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (isLoading) {
        return <div className="min-h-screen bg-gray-50 p-8 text-center">Loading Supplier Profile...</div>;
    }

    if (!vendor) return <div className="p-12 text-center">Supplier not found</div>;

    return (
        <div className="min-h-screen bg-[#F3F3F3]">
            {/* IndiaMART Style Header/Banner for Vendor */}
            <div className="bg-white border-b border-gray-200">
                <div className="container-custom py-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                            <div className="relative w-24 h-24 md:w-32 md:h-32 border border-gray-200 rounded-lg overflow-hidden p-2 bg-white">
                                <Image
                                    src={vendor.shopLogo || '/placeholder-shop.jpg'}
                                    alt={vendor.shopName}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                {vendor.shopName}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
                                <span className="flex items-center gap-1 text-gray-600">
                                    <MapPin size={16} />
                                    {vendor.location?.city}, {vendor.location?.state}
                                </span>
                                {vendor.isApproved && (
                                    <span className="verified-badge">
                                        <ShieldCheck size={14} className="mr-1" />
                                        TrustSEAL Verified
                                    </span>
                                )}
                                {vendor.rating && (
                                    <span className="flex items-center gap-1 font-bold text-gray-900">
                                        {vendor.rating} <Star size={14} fill="currentColor" className="text-[#FDB913]" />
                                        <span className="text-gray-500 font-normal">({vendor.analytics?.totalViews} views)</span>
                                    </span>
                                )}
                            </div>

                            <p className="text-gray-600 text-sm max-w-3xl line-clamp-2 md:line-clamp-3 mb-4">
                                {vendor.shopDescription || `Leading supplier of ${vendor.category?.name || 'various products'} in ${vendor.location?.city}. Contact us for best quality and price.`}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => setShowEnquiryModal(true)}
                                    className="indiamart-btn-primary py-2 px-6 flex items-center gap-2"
                                >
                                    <Phone size={18} />
                                    Contact Supplier
                                </button>
                                {vendor.contactInfo?.whatsapp && (
                                    <a
                                        href={`https://wa.me/${vendor.contactInfo.whatsapp}`}
                                        target="_blank"
                                        className="flex items-center gap-2 bg-[#25D366] text-white font-bold py-2 px-6 rounded-lg hover:bg-[#128C7E] transition-colors"
                                    >
                                        <MessageSquare size={18} />
                                        WhatsApp
                                    </a>
                                )}
                                <ChatButton
                                    recipientId={vendor._id}
                                    recipientModel="Vendor"
                                    recipientName={vendor.shopName}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="container-custom mt-4">
                    <div className="flex gap-8 border-b border-gray-200 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`pb-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'products' ? 'border-[#FDB913] text-black' : 'border-transparent text-gray-500 hover:text-black'
                                }`}
                        >
                            Products & Services ({totalProducts})
                        </button>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`pb-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'profile' ? 'border-[#FDB913] text-black' : 'border-transparent text-gray-500 hover:text-black'
                                }`}
                        >
                            Company Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('contact')}
                            className={`pb-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'contact' ? 'border-[#FDB913] text-black' : 'border-transparent text-gray-500 hover:text-black'
                                }`}
                        >
                            Contact Us
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Bar — Same style as homepage */}
            {activeTab === 'products' && (
                <div className="bg-white border-b border-gray-100 py-3 sticky top-16 z-30 shadow-sm">
                    <div className="container-custom">
                        <div className="flex flex-col gap-3">
                            {/* Top Row: Search + Filters */}
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
                                    {/* Search bar */}
                                    <form onSubmit={handleSearch} className="relative flex-shrink-0">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder={`Search in ${vendor.shopName}...`}
                                            value={localSearch}
                                            onChange={(e) => setLocalSearch(e.target.value)}
                                            className="w-[200px] sm:w-[280px] bg-gray-50 border border-gray-200 rounded-full py-2 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-[#FDB913]/30 focus:border-[#FDB913] text-sm"
                                        />
                                    </form>

                                    <div className="h-6 w-px bg-gray-200 shrink-0"></div>

                                    {/* Same ComprehensiveFilters button as homepage */}
                                    <ComprehensiveFilters
                                        onApplyFilters={handleFilterChange}
                                        currentFilters={filters}
                                        categories={categories}
                                        facets={facets}
                                    />
                                </div>

                                {/* Desktop: inline chips + count */}
                                <div className="hidden lg:flex items-center gap-3 min-w-0">
                                    {hasActiveFilters && (
                                        <div className="max-w-[42vw] min-w-0">
                                            <FilterChips
                                                currentFilters={filters}
                                                categories={categories}
                                                onApplyFilters={handleFilterChange}
                                            />
                                        </div>
                                    )}
                                    <p className="text-xs font-medium text-gray-500 whitespace-nowrap">
                                        {products.length} of {totalProducts} products
                                    </p>
                                </div>

                                {/* Tablet: count only */}
                                <p className="hidden sm:block lg:hidden text-xs font-medium text-gray-500 whitespace-nowrap">
                                    {products.length} products
                                </p>
                            </div>

                            {/* Bottom Row: Chips (mobile/tablet only) */}
                            <div className="lg:hidden">
                                {hasActiveFilters && (
                                    <FilterChips
                                        currentFilters={filters}
                                        categories={categories}
                                        onApplyFilters={handleFilterChange}
                                    />
                                )}
                            </div>

                            {/* Search chip */}
                            {searchQuery && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Searching:</span>
                                    <button
                                        onClick={clearSearch}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold hover:bg-gray-200 transition-colors"
                                    >
                                        &ldquo;{searchQuery}&rdquo;
                                        <span className="text-gray-500">&times;</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="container-custom py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="hidden lg:block space-y-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">Contact Details</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex gap-2">
                                    <div className="w-6 mt-1 text-gray-400"><MapPin size={16} /></div>
                                    <div className="text-gray-600">
                                        {vendor.location?.address}<br />
                                        {vendor.location?.city} - {vendor.location?.pincode}<br />
                                        {vendor.location?.state}, India
                                    </div>
                                </div>

                                {/* Interactive Location Map */}
                                {(() => {
                                    const coords = vendor.location?.coordinates?.coordinates;
                                    const lng = coords?.[0];
                                    const lat = coords?.[1];
                                    const hasGPS = lat && lng;
                                    const addressText = [
                                        vendor.location?.address,
                                        vendor.location?.city,
                                        vendor.location?.state,
                                        'India'
                                    ].filter(Boolean).join(', ');

                                    if (!hasGPS && !addressText) return null;

                                    const mapsQuery = hasGPS ? `${lat},${lng}` : encodeURIComponent(addressText);
                                    const googleMapsUrl = hasGPS
                                        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`;
                                    const directionsUrl = hasGPS
                                        ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
                                        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressText)}`;
                                    const embedUrl = hasGPS
                                        ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed&hl=en`
                                        : `https://maps.google.com/maps?q=${encodeURIComponent(addressText)}&z=14&output=embed&hl=en`;

                                    return (
                                        <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                            <div className="relative">
                                                <iframe
                                                    src={embedUrl}
                                                    width="100%"
                                                    height="180"
                                                    style={{ border: 0 }}
                                                    allowFullScreen={false}
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer-when-downgrade"
                                                    title={`${vendor.shopName} location`}
                                                    className="block"
                                                />
                                                <a
                                                    href={googleMapsUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="absolute inset-0 z-10"
                                                    title="Open in Google Maps"
                                                />
                                            </div>
                                            <div className="bg-white px-3 py-2 flex items-center justify-between gap-2">
                                                <p className="text-xs text-gray-500 truncate">📍 {vendor.location?.city || 'View on map'}</p>
                                                <a
                                                    href={directionsUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors"
                                                >
                                                    Directions
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {vendor.contactInfo?.phone && (
                                    <div className="flex gap-2 items-center">
                                        <div className="w-6 text-gray-400"><Phone size={16} /></div>
                                        <div className="font-bold text-gray-900">{vendor.contactInfo.phone}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-[#FFF9E6] p-4 rounded-lg border border-[#FFEBA1]">
                            <h3 className="font-bold text-gray-900 mb-2">Tell us what you need</h3>
                            <p className="text-xs text-gray-600 mb-3">Get quotes from this supplier</p>
                            <button
                                onClick={() => setShowEnquiryModal(true)}
                                className="w-full indiamart-btn-secondary text-sm py-2"
                            >
                                Send Enquiry
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3">
                        {activeTab === 'products' && (
                            <div className="space-y-4">
                                {/* Products Grid */}
                                {products.length === 0 && !isProductsLoading ? (
                                    <div className="bg-white p-8 rounded-lg text-center border border-dashed border-gray-300">
                                        <Search className="mx-auto text-gray-300 mb-3" size={40} />
                                        <p className="text-gray-500 font-medium">No products found</p>
                                        <p className="text-gray-400 text-sm mt-1">
                                            {searchQuery || hasActiveFilters ? 'Try different search terms or clear filters' : 'No products listed by this supplier yet.'}
                                        </p>
                                        {(searchQuery || hasActiveFilters) && (
                                            <button
                                                onClick={() => {
                                                    setFilters({ sortBy: 'relevance', rating: 0, hasOffer: false });
                                                    clearSearch();
                                                }}
                                                className="mt-3 text-sm text-[#FDB913] hover:underline font-medium"
                                            >
                                                Clear all filters
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {products.map(product => (
                                                <IndiaMArtProductCard
                                                    key={product._id}
                                                    id={product._id}
                                                    title={product.title}
                                                    image={product.images?.[0]}
                                                    price={product.price}
                                                    offer={product.offer}
                                                    vendor={{ shopName: vendor.shopName, city: vendor.location?.city }}
                                                    vendorId={product.vendorId?._id || product.vendorId}
                                                    distance={product.distance}
                                                />
                                            ))}
                                            {isProductsLoading && (
                                                <>
                                                    {Array.from({ length: 3 }).map((_, i) => (
                                                        <div key={i} className="shimmer h-[340px] rounded-lg"></div>
                                                    ))}
                                                </>
                                            )}
                                        </div>

                                        {/* Load More Button */}
                                        {hasMore && !isProductsLoading && (
                                            <div className="flex justify-center mt-6">
                                                <button
                                                    onClick={loadMore}
                                                    className="px-6 py-2 border border-gray-300 rounded-full text-sm font-semibold hover:bg-gray-50 hover:border-[#FDB913] transition-colors"
                                                >
                                                    Load More Products
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* SM: count */}
                                <p className="sm:hidden text-xs font-medium text-gray-500 text-center mt-4">
                                    Showing {products.length} of {totalProducts} products
                                </p>
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <h2 className="text-xl font-bold mb-4">About Us</h2>
                                <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-line">
                                    {vendor.shopDescription || 'No description available.'}
                                </p>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-3">Company Facts</h3>
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="text-gray-500">Nature of Business</span>
                                                <span className="font-medium">Supplier / Distributor</span>
                                            </li>
                                            <li className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="text-gray-500">Year of Establishment</span>
                                                <span className="font-medium">{vendor.yearEstablished || 'N/A'}</span>
                                            </li>
                                            <li className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="text-gray-500">Legal Status</span>
                                                <span className="font-medium">Proprietorship</span>
                                            </li>
                                        </ul>
                                    </div>

                                    {vendor.businessHours && (
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-3">Opening Hours</h3>
                                            <ul className="space-y-1 text-sm">
                                                {vendor.businessHours.map((h: any, i: number) => (
                                                    <li key={i} className="flex justify-between">
                                                        <span className="text-gray-500 w-24">{h.day}</span>
                                                        <span className="font-medium">
                                                            {h.isClosed ? 'Closed' : `${h.openTime} - ${h.closeTime}`}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'contact' && (
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <h2 className="text-xl font-bold mb-6">Contact Us</h2>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-gray-100 p-2 rounded-full"><MapPin size={20} className="text-[#FDB913]" /></div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">Registered Address</h4>
                                                <p className="text-gray-600">
                                                    {vendor.location?.address}<br />
                                                    {vendor.location?.city} - {vendor.location?.pincode},<br />
                                                    {vendor.location?.state}, India
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="bg-gray-100 p-2 rounded-full"><Phone size={20} className="text-[#FDB913]" /></div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">Call Us</h4>
                                                <p className="text-gray-900 font-bold text-lg">{vendor.contactInfo?.phone}</p>
                                            </div>
                                        </div>

                                        {vendor.contactInfo?.email && (
                                            <div className="flex items-start gap-3">
                                                <div className="bg-gray-100 p-2 rounded-full"><Mail size={20} className="text-[#FDB913]" /></div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">Email Us</h4>
                                                    <p className="text-gray-600">{vendor.contactInfo.email}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Visit Us — Google Maps link */}
                                        {(() => {
                                            const coords = vendor.location?.coordinates?.coordinates;
                                            const lng = coords?.[0];
                                            const lat = coords?.[1];
                                            const hasGPS = lat && lng;
                                            const addressText = [
                                                vendor.location?.address,
                                                vendor.location?.city,
                                                vendor.location?.state,
                                                'India'
                                            ].filter(Boolean).join(', ');
                                            if (!hasGPS && !addressText) return null;
                                            const googleMapsUrl = hasGPS
                                                ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                                                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`;
                                            const directionsUrl = hasGPS
                                                ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
                                                : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressText)}`;
                                            const embedUrl = hasGPS
                                                ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed&hl=en`
                                                : `https://maps.google.com/maps?q=${encodeURIComponent(addressText)}&z=14&output=embed&hl=en`;
                                            return (
                                                <div className="flex items-start gap-3">
                                                    <div className="bg-gray-100 p-2 rounded-full shrink-0"><MapPin size={20} className="text-[#FDB913]" /></div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-900 mb-2">Visit Us</h4>
                                                        {/* Embedded mini map */}
                                                        <div className="relative rounded-lg overflow-hidden border border-gray-200 mb-2">
                                                            <iframe
                                                                src={embedUrl}
                                                                width="100%"
                                                                height="180"
                                                                style={{ border: 0 }}
                                                                allowFullScreen={false}
                                                                loading="lazy"
                                                                referrerPolicy="no-referrer-when-downgrade"
                                                                title="Vendor location map"
                                                                className="block"
                                                            />
                                                            <a
                                                                href={googleMapsUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="absolute inset-0 z-10"
                                                                title="Open in Google Maps"
                                                            />
                                                        </div>
                                                        <a
                                                            href={directionsUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                                                        >
                                                            <MapPin size={14} />
                                                            Get Directions
                                                        </a>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    <div className="bg-gray-50 p-6 rounded-lg">
                                        <h3 className="font-bold text-gray-900 mb-4">Send Message</h3>
                                        <div className="space-y-3">
                                            <input type="text" placeholder="Your Name" className="w-full p-2 border border-gray-300 rounded focus:border-[#FDB913] outline-none" />
                                            <input type="text" placeholder="Mobile Number" className="w-full p-2 border border-gray-300 rounded focus:border-[#FDB913] outline-none" />
                                            <textarea rows={3} placeholder="Requirement Details" className="w-full p-2 border border-gray-300 rounded focus:border-[#FDB913] outline-none"></textarea>
                                            <button className="w-full indiamart-btn-primary py-2">Submit</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Enquiry Modal */}
            {showEnquiryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden relative">
                        <button
                            onClick={() => setShowEnquiryModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"
                        >
                            ✕
                        </button>
                        <div className="bg-[#FDB913] p-4 text-black">
                            <h3 className="text-xl font-bold">Contact Supplier</h3>
                            <p className="text-sm opacity-90">{vendor.shopName}</p>
                        </div>
                        <form onSubmit={handleContactSubmit} className="p-6 space-y-4">
                            <input
                                type="tel"
                                className="block w-full rounded-md border-gray-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Mobile number"
                                value={contactMobile}
                                onChange={(e) => setContactMobile(e.target.value)}
                                required
                            />
                            <textarea
                                rows={3}
                                className="block w-full rounded-md border-gray-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Describe your requirement..."
                                value={contactRequirement}
                                onChange={(e) => setContactRequirement(e.target.value)}
                                required
                            ></textarea>
                            <button
                                type="submit"
                                disabled={isSubmittingContact}
                                className="w-full indiamart-btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                            >
                                {isSubmittingContact ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    "Submit Requirement"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
