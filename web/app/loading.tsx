import ProductGridSkeleton from '@/components/products/ProductGridSkeleton';

export default function HomeLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section Skeleton */}
            <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-8 lg:py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl animate-pulse">
                        <div className="h-10 bg-gray-200 rounded w-3/4 mb-4" />
                        <div className="h-6 bg-gray-200 rounded w-1/2 mb-6" />
                        <div className="flex gap-3">
                            <div className="h-12 bg-gray-200 rounded-xl w-32" />
                            <div className="h-12 bg-gray-100 rounded-xl w-28" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Skeleton */}
            <section className="py-6 border-b bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex gap-4 overflow-hidden">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex-shrink-0 animate-pulse">
                                <div className="w-16 h-16 bg-gray-200 rounded-full mb-2" />
                                <div className="h-3 bg-gray-200 rounded w-14 mx-auto" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Filters Skeleton */}
            <section className="py-4 bg-white border-b">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-4">
                        <div className="h-10 bg-gray-200 rounded-full w-24 animate-pulse" />
                        <div className="flex gap-2 overflow-hidden">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-8 bg-gray-100 rounded-full w-20 flex-shrink-0 animate-pulse" />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Products Grid Skeleton */}
            <section className="py-8">
                <div className="container mx-auto px-4">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
                    <ProductGridSkeleton count={8} />
                </div>
            </section>
        </div>
    );
}
