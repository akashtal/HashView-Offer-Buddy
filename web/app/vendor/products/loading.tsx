export default function VendorProductsLoading() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
                <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                        <div className="h-8 bg-gray-200 rounded w-16" />
                    </div>
                ))}
            </div>

            {/* Table Skeleton */}
            <div className="bg-white rounded-xl border overflow-hidden">
                <div className="p-4 border-b">
                    <div className="h-10 bg-gray-100 rounded w-64 animate-pulse" />
                </div>
                <div className="divide-y">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                            <div className="w-16 h-16 bg-gray-200 rounded" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-3 bg-gray-100 rounded w-1/2" />
                            </div>
                            <div className="h-6 bg-gray-200 rounded w-20" />
                            <div className="h-8 bg-gray-100 rounded w-24" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
