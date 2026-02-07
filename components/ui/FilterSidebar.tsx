'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown, Check, Star } from 'lucide-react';
import { FilterOptions } from './ComprehensiveFilters';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterSidebarProps {
    currentFilters: FilterOptions;
    categories: any[];
    className?: string;
}

export default function FilterSidebar({ currentFilters, categories, className = '' }: FilterSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [priceMin, setPriceMin] = useState(currentFilters.minPrice || 0);
    const [priceMax, setPriceMax] = useState(currentFilters.maxPrice || 50000);

    useEffect(() => {
        setPriceMin(currentFilters.minPrice || 0);
        setPriceMax(currentFilters.maxPrice || 50000);
    }, [currentFilters.minPrice, currentFilters.maxPrice]);

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
    };

    const handleFilterChange = (key: keyof FilterOptions, value: any) => {
        const newFilters = { ...currentFilters, [key]: value };
        updateFilters(newFilters);
    };

    const commitPriceChange = () => {
        updateFilters({
            ...currentFilters,
            minPrice: priceMin > 0 ? priceMin : undefined,
            maxPrice: priceMax < 50000 ? priceMax : undefined
        });
    }

    const clearAllFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        // List of keys to clear
        ['category', 'minPrice', 'maxPrice', 'sortBy', 'rating', 'hasOffer'].forEach(key => params.delete(key));
        params.delete('page');
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <aside className={`w-64 flex-shrink-0 hidden lg:block ${className}`}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-lg">Filters</h3>
                    <button
                        onClick={clearAllFilters}
                        className="text-xs text-[#B45309] font-medium hover:underline"
                    >
                        Clear All
                    </button>
                </div>

                <div className="max-h-[calc(100vh-180px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">

                    {/* Offers Toggle */}
                    <div className="p-4 border-b border-gray-100">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="font-medium text-gray-700 group-hover:text-[#FDB913] transition-colors">Offers Only</span>
                            <div className={`w-10 h-5 flex items-center bg-gray-200 rounded-full p-1 duration-300 ease-in-out ${currentFilters.hasOffer ? 'bg-[#FDB913]' : ''}`}>
                                <motion.div
                                    className="bg-white w-3 h-3 rounded-full shadow-md"
                                    animate={{ x: currentFilters.hasOffer ? 20 : 0 }}
                                />
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={!!currentFilters.hasOffer}
                                onChange={(e) => handleFilterChange('hasOffer', e.target.checked)}
                            />
                        </label>
                    </div>

                    {/* Sort By */}
                    <FilterSection title="Sort By" defaultOpen>
                        <div className="space-y-2">
                            {[
                                { value: 'relevance', label: 'Relevance' },
                                { value: 'distance', label: 'Nearest' },
                                { value: 'price-low', label: 'Price: Low to High' },
                                { value: 'price-high', label: 'Price: High to Low' },
                                { value: 'rating', label: 'Top Rated' },
                            ].map((option) => (
                                <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${currentFilters.sortBy === option.value ? 'border-[#FDB913] bg-[#FDB913]' : 'border-gray-300 bg-white group-hover:border-[#FDB913]'}`}>
                                        {currentFilters.sortBy === option.value && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                                    </div>
                                    <input
                                        type="radio"
                                        name="sortBy"
                                        value={option.value}
                                        checked={currentFilters.sortBy === option.value}
                                        onChange={() => handleFilterChange('sortBy', option.value)}
                                        className="hidden"
                                    />
                                    <span className={`text-sm ${currentFilters.sortBy === option.value ? 'text-gray-900 font-medium' : 'text-gray-600 group-hover:text-gray-900'}`}>
                                        {option.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>

                    {/* Categories */}
                    <FilterSection title="Categories" defaultOpen>
                        <div className="space-y-1">
                            <button
                                onClick={() => handleFilterChange('category', undefined)}
                                className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-all ${!currentFilters.category ? 'bg-[#FDB913]/10 text-black font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                All Categories
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat._id}
                                    onClick={() => handleFilterChange('category', currentFilters.category === cat._id ? undefined : cat._id)}
                                    className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-all flex items-center justify-between group ${currentFilters.category === cat._id ? 'bg-[#FDB913]/10 text-black font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <span className="truncate">{cat.name}</span>
                                    {currentFilters.category === cat._id && <Check size={14} className="text-[#FDB913]" />}
                                </button>
                            ))}
                        </div>
                    </FilterSection>

                    {/* Price Range */}
                    <FilterSection title="Price Range" defaultOpen>
                        <div className="space-y-4 pt-2">
                            {/* Slider Visual */}
                            <div className="relative h-1.5 bg-gray-100 rounded-full">
                                <div
                                    className="absolute h-full bg-[#FDB913] rounded-full"
                                    style={{
                                        left: `${Math.min((priceMin / 50000) * 100, 100)}%`,
                                        right: `${100 - Math.min((priceMax / 50000) * 100, 100)}%`
                                    }}
                                />
                                <input
                                    type="range"
                                    min="0"
                                    max="50000"
                                    step="500"
                                    value={priceMin}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (val < priceMax) setPriceMin(val);
                                    }}
                                    onMouseUp={commitPriceChange}
                                    onTouchEnd={commitPriceChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <input
                                    type="range"
                                    min="0"
                                    max="50000"
                                    step="500"
                                    value={priceMax}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (val > priceMin) setPriceMax(val);
                                    }}
                                    onMouseUp={commitPriceChange}
                                    onTouchEnd={commitPriceChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />

                                {/* Thumbs (Visual Only) */}
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#FDB913] rounded-full shadow cursor-pointer pointer-events-none"
                                    style={{ left: `${Math.min((priceMin / 50000) * 100, 100)}%` }}
                                />
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#FDB913] rounded-full shadow cursor-pointer pointer-events-none"
                                    style={{ left: `${Math.min((priceMax / 50000) * 100, 100)}%`, transform: 'translateX(-100%)' }}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 flex-1">
                                    <span className="text-xs text-gray-400">Min</span>
                                    <input
                                        type="number"
                                        value={priceMin}
                                        onChange={(e) => setPriceMin(Number(e.target.value))}
                                        onBlur={commitPriceChange}
                                        className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                                    />
                                </div>
                                <span className="text-gray-400">-</span>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 flex-1">
                                    <span className="text-xs text-gray-400">Max</span>
                                    <input
                                        type="number"
                                        value={priceMax}
                                        onChange={(e) => setPriceMax(Number(e.target.value))}
                                        onBlur={commitPriceChange}
                                        className="w-full bg-transparent text-sm font-bold text-gray-900 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </FilterSection>

                    {/* Rating */}
                    <FilterSection title="Rating">
                        <div className="space-y-2">
                            {[4, 3, 2, 1].map((rating) => (
                                <label key={rating} className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${currentFilters.rating === rating ? 'bg-[#FDB913] border-[#FDB913]' : 'border-gray-300 bg-white group-hover:border-[#FDB913]'}`}>
                                        {currentFilters.rating === rating && <Check size={12} className="text-black" />}
                                    </div>
                                    <input
                                        type="radio"
                                        name="rating"
                                        checked={currentFilters.rating === rating}
                                        onChange={() => handleFilterChange('rating', rating)}
                                        className="hidden"
                                    />
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm text-gray-700">{rating}+</span>
                                        <Star size={12} className="fill-[#FDB913] text-[#FDB913]" />
                                    </div>
                                </label>
                            ))}
                        </div>
                    </FilterSection>

                </div>
            </div>
        </aside>
    );
}

function FilterSection({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-gray-100 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
            >
                <span className="font-semibold text-gray-900 text-sm">{title}</span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
