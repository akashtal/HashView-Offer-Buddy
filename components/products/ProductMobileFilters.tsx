'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import MobileFilterDrawer from '@/components/ui/MobileFilterDrawer';
import { FilterOptions } from '@/components/ui/ComprehensiveFilters';

interface ProductMobileFiltersProps {
    currentFilters: FilterOptions;
    categories: any[];
    className?: string;
}

export default function ProductMobileFilters({ currentFilters, categories, className = '' }: ProductMobileFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const activeFiltersCount = Object.keys(currentFilters).filter(key => {
        const k = key as keyof FilterOptions;
        const value = currentFilters[k];
        if (k === 'sortBy' && value === 'distance') return false;
        if (k === 'minPrice' && (!value || value === 0)) return false;
        if (k === 'maxPrice' && (!value || value === 50000)) return false;
        if (k === 'query') return false;
        return value !== undefined && value !== 0 && value !== false;
    }).length;

    const updateFilters = (newFilters: FilterOptions) => {
        const params = new URLSearchParams(searchParams.toString());

        // Helper to update or delete param
        const setOrDelete = (key: string, value: any) => {
            if (value === undefined || value === null || value === '' || value === false) {
                params.delete(key);
            } else {
                params.set(key, String(value));
            }
        };

        // Update all filter keys
        Object.keys(newFilters).forEach(key => {
            setOrDelete(key, newFilters[key as keyof FilterOptions]);
        });

        // Always reset to page 1 when filters change
        params.delete('page');

        router.push(`${pathname}?${params.toString()}`);
        setIsOpen(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 active:scale-95 transition-all ${className}`}
            >
                <SlidersHorizontal size={16} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-[#FDB913] text-black text-[10px] font-bold rounded-full">
                        {activeFiltersCount}
                    </span>
                )}
            </button>

            <MobileFilterDrawer
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                currentFilters={currentFilters}
                categories={categories}
                onApplyFilters={updateFilters}
            />
        </>
    );
}
