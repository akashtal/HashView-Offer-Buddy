export default function AdminProductsLoading() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
                <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
                <div className="h-10 bg-gray-200 rounded w-64 animate-pulse" />
            </div>

            {/* Table Card Skeleton */}
            <div className="bg-white rounded-xl border overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50 border-b">
                    <div className="flex items-center py-3 px-4 gap-4">
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded w-16 ml-auto animate-pulse" />
                    </div>
                </div>

                {/* Table Rows */}
                <div className="divide-y">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex items-center py-3 px-4 gap-4 animate-pulse">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-12 h-12 bg-gray-200 rounded" />
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-48" />
                                    <div className="h-3 bg-gray-100 rounded w-32" />
                                </div>
                            </div>
                            <div className="h-4 bg-gray-200 rounded w-16" />
                            <div className="h-6 bg-gray-100 rounded-full w-20" />
                            <div className="h-4 bg-gray-200 rounded w-24" />
                            <div className="h-4 bg-gray-200 rounded w-16" />
                            <div className="h-8 bg-gray-100 rounded w-8 ml-auto" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
