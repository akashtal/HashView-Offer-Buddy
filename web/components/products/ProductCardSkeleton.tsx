export default function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-xl overflow-hidden border border-gray-100 animate-pulse">
            {/* Image skeleton */}
            <div className="aspect-square bg-gray-200" />

            {/* Content skeleton */}
            <div className="p-4 space-y-3">
                {/* Title */}
                <div className="h-4 bg-gray-200 rounded w-3/4" />

                {/* Price */}
                <div className="flex items-center gap-2">
                    <div className="h-5 bg-gray-200 rounded w-20" />
                    <div className="h-4 bg-gray-100 rounded w-14" />
                </div>

                {/* Vendor info */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <div className="w-6 h-6 bg-gray-200 rounded-full" />
                    <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
            </div>
        </div>
    );
}
