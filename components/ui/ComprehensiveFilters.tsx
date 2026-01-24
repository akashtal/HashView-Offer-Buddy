'use client';

import { useState, useEffect } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import MobileFilterDrawer from './MobileFilterDrawer';

export interface FilterOptions {
    category?: string;
    sortBy?: 'relevance' | 'distance' | 'rating' | 'price-low' | 'price-high' | 'newest' | 'popular';
    hasOffer?: boolean;
    rating?: number;
    minPrice?: number;
    maxPrice?: number;
    query?: string;
}

export interface Facets {
    minPrice: number;
    maxPrice: number;
}

interface ComprehensiveFiltersProps {
    onApplyFilters: (filters: FilterOptions) => void;
    currentFilters?: FilterOptions;
    categories: any[];
    className?: string; // Allow styling positioning
    facets?: Facets;
}

export default function ComprehensiveFilters({ onApplyFilters, currentFilters = {}, categories = [], className = '', facets }: ComprehensiveFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);

    const activeFiltersCount = Object.keys(currentFilters).filter(key => {
        const k = key as keyof FilterOptions;
        const value = currentFilters[k];
        if (k === 'sortBy' && value === 'distance') return false;
        if (k === 'minPrice' && (!value || value === 0)) return false;
        if (k === 'maxPrice' && (!value || value === 50000)) return false;
        if (k === 'query') return false;
        return value !== undefined && value !== 0 && value !== false;
    }).length;

    return (
        <div className={className}>
            {/* Filter Trigger Button - Beautiful & Modern */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="group flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full hover:border-[#FDB913] hover:bg-gray-50 hover:shadow-md transition-all duration-200 text-sm font-semibold text-gray-700 active:scale-95"
            >
                <SlidersHorizontal size={16} className="text-gray-500 group-hover:text-[#B45309] transition-colors" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-[#FDB913] text-black text-[10px] font-bold rounded-full">
                        {activeFiltersCount}
                    </span>
                )}
            </button>

            {/* Mobile/Drawer Filter Component */}
            <MobileFilterDrawer
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                currentFilters={currentFilters}
                categories={categories}
                onApplyFilters={onApplyFilters}
                facets={facets}
            />
        </div>
    );
}
