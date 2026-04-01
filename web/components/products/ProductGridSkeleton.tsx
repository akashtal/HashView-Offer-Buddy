import ProductCardSkeleton from './ProductCardSkeleton';

interface ProductGridSkeletonProps {
    count?: number;
    columns?: string;
}

export default function ProductGridSkeleton({
    count = 8,
    columns = 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
}: ProductGridSkeletonProps) {
    return (
        <div className={`grid ${columns} gap-4`}>
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}
