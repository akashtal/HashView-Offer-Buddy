import { Suspense } from 'react';
import { MapPin } from 'lucide-react';
import { getProducts, getCategories } from '@/lib/products';
import ProductListClient from './ProductListClient';
import FilterSidebar from '@/components/ui/FilterSidebar';
import ProductGridSkeleton from '@/components/products/ProductGridSkeleton';
import ProductMobileFilters from '@/components/products/ProductMobileFilters';

interface SearchParams {
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    rating?: string;
    hasOffer?: string;
    query?: string;
    page?: string;
}

interface ProductsPageProps {
    searchParams: Promise<SearchParams>;
}

export const revalidate = 60; // Revalidate every 60 seconds

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    const params = await searchParams;

    // Fetch data server-side
    const [{ products, pagination }, categories] = await Promise.all([
        getProducts(
            {
                category: params.category,
                minPrice: params.minPrice ? Number(params.minPrice) : undefined,
                maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
                rating: params.rating ? Number(params.rating) : undefined,
                hasOffer: params.hasOffer === 'true',
                query: params.query,
            },
            1, // Always start at page 1 for SSR
            20
        ),
        getCategories(),
    ]);

    // Build base URL for Load More
    const baseUrlParams = new URLSearchParams();
    if (params.category) baseUrlParams.set('category', params.category);
    if (params.minPrice) baseUrlParams.set('minPrice', params.minPrice);
    if (params.maxPrice) baseUrlParams.set('maxPrice', params.maxPrice);
    if (params.sortBy) baseUrlParams.set('sortBy', params.sortBy);
    if (params.rating) baseUrlParams.set('rating', params.rating);
    if (params.hasOffer) baseUrlParams.set('hasOffer', params.hasOffer);
    if (params.query) baseUrlParams.set('query', params.query);

    const baseUrl = `/api/products${baseUrlParams.toString() ? '?' + baseUrlParams.toString() : ''}`;

    const currentFilters = {
        category: params.category,
        minPrice: params.minPrice ? Number(params.minPrice) : undefined,
        maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
        sortBy: (params.sortBy as 'relevance' | 'distance' | 'rating' | 'price-low' | 'price-high' | 'newest' | 'popular') || 'newest',
        rating: params.rating ? Number(params.rating) : 0,
        hasOffer: params.hasOffer === 'true',
        query: params.query,
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white sticky top-16 z-30 shadow-sm border-b border-gray-100">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>{pagination.total} products found</span>
                        <ProductMobileFilters
                            currentFilters={currentFilters}
                            categories={categories}
                        />
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 pt-6">
                <div className="flex gap-8">
                    {/* Desktop Sidebar */}
                    <FilterSidebar
                        currentFilters={currentFilters}
                        categories={categories}
                        className="sticky top-24 h-fit"
                    />

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Desktop Header */}
                        <div className="hidden lg:flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {params.query
                                        ? `Results for "${params.query}"`
                                        : 'All Products'}
                                </h1>
                                <p className="text-gray-500 text-sm mt-1">
                                    Showing {pagination.total} products
                                </p>
                            </div>
                        </div>

                        {/* Products Grid */}
                        <Suspense fallback={<ProductGridSkeleton count={8} />}>
                            <ProductListClient
                                initialProducts={products}
                                initialPagination={{
                                    page: 1,
                                    hasMore: pagination.hasMore,
                                }}
                                baseUrl={baseUrl}
                            />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}
