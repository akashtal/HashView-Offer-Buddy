import ProductGridSkeleton from '@/components/products/ProductGridSkeleton';

export default function ProductsLoading() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Mobile Header Skeleton */}
            <div className="lg:hidden bg-white sticky top-16 z-30 shadow-sm border-b border-gray-100">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="flex-1 flex gap-2 overflow-hidden">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-20 h-8 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
                            ))}
                        </div>
                    </div>
                    <div className="py-2 flex justify-between">
                        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 pt-6">
                <div className="flex gap-8">
                    {/* Desktop Sidebar Skeleton */}
                    <div className="hidden lg:block w-64 flex-shrink-0">
                        <div className="bg-white rounded-xl p-4 space-y-4 animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-24" />
                            <div className="space-y-2">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-4 bg-gray-100 rounded" />
                                ))}
                            </div>
                            <div className="h-px bg-gray-200 my-4" />
                            <div className="h-6 bg-gray-200 rounded w-20" />
                            <div className="flex gap-2">
                                <div className="h-10 bg-gray-100 rounded flex-1" />
                                <div className="h-10 bg-gray-100 rounded flex-1" />
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Desktop Header Skeleton */}
                        <div className="hidden lg:flex items-center justify-between mb-6">
                            <div>
                                <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
                                <div className="h-4 bg-gray-100 rounded w-64 animate-pulse" />
                            </div>
                        </div>

                        {/* Product Grid Skeleton */}
                        <ProductGridSkeleton count={8} />
                    </div>
                </div>
            </div>
        </div>
    );
}
