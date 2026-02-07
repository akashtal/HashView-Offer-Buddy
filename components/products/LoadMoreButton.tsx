'use client';

import { useState, useTransition } from 'react';
import { FiLoader } from 'react-icons/fi';

interface LoadMoreButtonProps {
    currentPage: number;
    hasMore: boolean;
    baseUrl: string;
    onLoadMore: (newProducts: any[]) => void;
}

export default function LoadMoreButton({
    currentPage,
    hasMore,
    baseUrl,
    onLoadMore
}: LoadMoreButtonProps) {
    const [page, setPage] = useState(currentPage);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMoreProducts, setHasMoreProducts] = useState(hasMore);

    const handleLoadMore = async () => {
        setIsLoading(true);
        try {
            const nextPage = page + 1;
            const separator = baseUrl.includes('?') ? '&' : '?';
            const response = await fetch(`${baseUrl}${separator}page=${nextPage}&limit=20`);
            const data = await response.json();

            if (data.data?.products) {
                onLoadMore(data.data.products);
                setPage(nextPage);
                setHasMoreProducts(data.data.pagination?.hasMore ?? false);
            }
        } catch (error) {
            console.error('Failed to load more products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!hasMoreProducts) return null;

    return (
        <div className="flex justify-center py-8">
            <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="px-8 py-3 bg-primary text-white font-semibold rounded-xl shadow-lg hover:bg-primary-dark hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {isLoading ? (
                    <>
                        <FiLoader className="animate-spin" />
                        Loading...
                    </>
                ) : (
                    'Load More Products'
                )}
            </button>
        </div>
    );
}
