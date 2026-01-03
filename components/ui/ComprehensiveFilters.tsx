'use client';

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

export interface FilterOptions {
    sortBy?: 'relevance' | 'distance' | 'rating' | 'price-low' | 'price-high';
    hasOffer?: boolean;
    rating?: number;
}

interface ComprehensiveFiltersProps {
    onApplyFilters: (filters: FilterOptions) => void;
    currentFilters?: FilterOptions;
}

export default function ComprehensiveFilters({ onApplyFilters, currentFilters = {} }: ComprehensiveFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);

    const sortOptions = [
        { value: 'relevance', label: 'Relevance' },
        { value: 'distance', label: 'Distance' },
        { value: 'rating', label: 'Rating' },
        { value: 'price-low', label: 'Price: Low to High' },
        { value: 'price-high', label: 'Price: High to Low' },
    ];

    const ratingOptions = [
        { value: 0, label: 'Any' },
        { value: 4, label: '4.0+' },
        { value: 4.5, label: '4.5+' },
    ];

    const handleFilterChange = (key: keyof FilterOptions, value: any) => {
        const newFilters = { ...currentFilters, [key]: value };
        onApplyFilters(newFilters);
    };

    const activeFiltersCount = Object.keys(currentFilters).filter(key => {
        const value = currentFilters[key as keyof FilterOptions];
        return value && value !== 'relevance' && value !== 0;
    }).length;

    // If filter button not working, show as modal instead
    if (isOpen) {
        return (
            <>
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/20 z-[998]"
                    onClick={() => setIsOpen(false)}
                />

                {/* Filter Button */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium shadow-sm relative z-[999]"
                >
                    <SlidersHorizontal size={16} />
                    <span>Filter</span>
                    {activeFiltersCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-[#FDB913] text-black text-xs font-bold rounded-full">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>

                {/* Modal Dropdown */}
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm bg-white rounded-xl shadow-2xl z-[999] max-h-[80vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="font-bold text-lg">Filters</h3>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Sort By */}
                    <div className="p-4 border-b">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-3">Sort By</p>
                        <div className="space-y-2">
                            {sortOptions.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        handleFilterChange('sortBy', option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${currentFilters.sortBy === option.value
                                        ? 'bg-[#FDB913] text-black font-medium'
                                        : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rating */}
                    <div className="p-4 border-b">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-3">Rating</p>
                        <div className="flex gap-2">
                            {ratingOptions.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleFilterChange('rating', option.value)}
                                    className={`flex-1 px-2 py-2 rounded-lg text-sm font-medium transition-colors ${currentFilters.rating === option.value
                                        ? 'bg-[#FDB913] text-black'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Offers */}
                    <div className="p-4">
                        <button
                            type="button"
                            onClick={() => handleFilterChange('hasOffer', !currentFilters.hasOffer)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${currentFilters.hasOffer
                                ? 'bg-[#FDB913] text-black font-medium'
                                : 'hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            <span className="mr-2">{currentFilters.hasOffer ? '✓' : ''}</span>
                            Offers Only
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-[#FDB913] transition-all text-sm font-medium shadow-sm"
        >
            <SlidersHorizontal size={16} />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
                <span className="px-1.5 py-0.5 bg-[#FDB913] text-black text-xs font-bold rounded-full">
                    {activeFiltersCount}
                </span>
            )}
        </button>
    );
}
