'use client';

import { X } from 'lucide-react';
import { FilterOptions } from './ComprehensiveFilters';

interface FilterChipsProps {
    currentFilters: FilterOptions;
    onApplyFilters: (filters: FilterOptions) => void;
    categories: any[];
    className?: string;
}

export default function FilterChips({ currentFilters, onApplyFilters, categories, className = '' }: FilterChipsProps) {
    const handleRemove = (key: keyof FilterOptions) => {
        const newFilters = { ...currentFilters };
        if (key === 'category') newFilters.category = undefined;
        else if (key === 'hasOffer') newFilters.hasOffer = false;
        else if (key === 'rating') newFilters.rating = 0;
        else if (key === 'minPrice') newFilters.minPrice = 0;
        else if (key === 'maxPrice') newFilters.maxPrice = 50000;
        onApplyFilters(newFilters);
    };

    const chips = [];

    if (currentFilters.category) {
        const catName = categories.find(c => c._id === currentFilters.category)?.name || 'Category';
        chips.push({ key: 'category', label: catName });
    }

    if (currentFilters.hasOffer) {
        chips.push({ key: 'hasOffer', label: 'Offers Only' });
    }

    if (currentFilters.rating && currentFilters.rating > 0) {
        chips.push({ key: 'rating', label: `${currentFilters.rating}+ Stars` });
    }

    if ((currentFilters.minPrice && currentFilters.minPrice > 0) || (currentFilters.maxPrice && currentFilters.maxPrice < 50000)) {
        chips.push({ key: 'price', label: `₹${currentFilters.minPrice || 0} - ₹${currentFilters.maxPrice || 50000}` });
    }

    if (chips.length === 0) return null;

    return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {chips.map((chip: any) => (
                <button
                    key={chip.key}
                    onClick={() => handleRemove(chip.key === 'price' ? 'minPrice' : chip.key)} // For price, reset min/max logic roughly
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold hover:bg-gray-200 transition-colors"
                >
                    {chip.label}
                    <X size={12} className="text-gray-500" />
                </button>
            ))}
            <button
                onClick={() => onApplyFilters({})}
                className="px-3 py-1.5 text-xs font-semibold text-[#B45309] hover:underline"
            >
                Clear All
            </button>
        </div>
    );
}
