'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Check, Star } from 'lucide-react';
import { FilterOptions, Facets } from './ComprehensiveFilters';
import { motion, AnimatePresence } from 'framer-motion';

interface Category {
    _id: string;
    name: string;
}

interface MobileFilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    currentFilters: FilterOptions;
    categories: Category[];
    onApplyFilters: (filters: FilterOptions) => void;
    facets?: Facets;
}

const DEFAULT_MAX_PRICE = 50000;
const PRICE_STEP = 500;

export default function MobileFilterDrawer({
    isOpen,
    onClose,
    currentFilters,
    categories,
    onApplyFilters,
    facets
}: MobileFilterDrawerProps) {
    // Dynamic Max Price from DB or Default
    const maxPriceLimit = facets?.maxPrice || DEFAULT_MAX_PRICE;

    const [localFilters, setLocalFilters] = useState<FilterOptions>(currentFilters);
    const [priceMin, setPriceMin] = useState(currentFilters.minPrice || 0);
    const [priceMax, setPriceMax] = useState(currentFilters.maxPrice || maxPriceLimit);
    const [activeSection, setActiveSection] = useState<string>('sort');
    const originalOverflowRef = useRef<string>('');

    useEffect(() => {
        if (isOpen) {
            setLocalFilters(currentFilters);
            setPriceMin(currentFilters.minPrice || 0);
            setPriceMax(currentFilters.maxPrice || maxPriceLimit);

            // Store original overflow value
            originalOverflowRef.current = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        } else {
            // Restore original overflow value
            document.body.style.overflow = originalOverflowRef.current;
        }

        return () => {
            // Cleanup: restore original overflow
            if (isOpen) {
                document.body.style.overflow = originalOverflowRef.current;
            }
        };
    }, [isOpen, currentFilters]);

    const handleLocalChange = (key: keyof FilterOptions, value: any) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApply = () => {
        onApplyFilters({
            ...localFilters,
            minPrice: priceMin > 0 ? priceMin : undefined,
            maxPrice: priceMax < maxPriceLimit ? priceMax : undefined
        });
        onClose();
    };

    const handleReset = () => {
        setLocalFilters({
            sortBy: 'distance',
            hasOffer: false,
            rating: 0,
            category: undefined,
        });
        setPriceMin(0);
        setPriceMax(maxPriceLimit);
    };

    const handlePriceMinChange = (value: number) => {
        const clampedValue = Math.max(0, Math.min(value, priceMax - PRICE_STEP));
        setPriceMin(clampedValue);
    };

    const handlePriceMaxChange = (value: number) => {
        const clampedValue = Math.max(priceMin + PRICE_STEP, Math.min(value, maxPriceLimit));
        setPriceMax(clampedValue);
    };

    const handlePriceMinInput = (value: string) => {
        const numValue = parseInt(value) || 0;
        if (numValue >= 0 && numValue < priceMax) {
            setPriceMin(numValue);
        }
    };

    const handlePriceMaxInput = (value: string) => {
        const numValue = parseInt(value) || maxPriceLimit;
        if (numValue > priceMin && numValue <= maxPriceLimit) {
            setPriceMax(numValue);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001] animate-in fade-in duration-200"
                onClick={onClose}
                style={{
                    animation: 'fadeIn 0.2s ease-out'
                }}
            />

            {/* Bottom Sheet Container */}
            <div className="fixed inset-0 z-[1002] flex items-end sm:items-center justify-center pointer-events-none p-0 sm:p-4">
                <div
                    className="w-full bg-white rounded-t-[32px] sm:max-w-md sm:rounded-2xl shadow-2xl flex flex-col h-[85dvh] sm:h-[80vh] overflow-hidden pointer-events-auto"
                    style={{
                        animation: 'slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                        <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                        <button
                            onClick={onClose}
                            className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors"
                            aria-label="Close filters"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 flex overflow-hidden min-h-0">
                        {/* Sidebar Tabs */}
                        <div className="w-[100px] sm:w-1/3 bg-gray-50 border-r border-gray-100 overflow-y-auto">
                            {[
                                { id: 'sort', label: 'Sort By' },
                                { id: 'category', label: 'Category' },
                                { id: 'price', label: 'Price' },
                                { id: 'rating', label: 'Rating' },
                                { id: 'offer', label: 'Offers' },
                            ].map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full text-left px-3 sm:px-4 py-4 text-xs sm:text-sm font-medium border-l-4 transition-all relative ${activeSection === section.id
                                        ? 'bg-white border-[#FDB913] text-gray-900 shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
                                        : 'border-transparent text-gray-500 hover:bg-gray-100'
                                        }`}
                                >
                                    {section.label}
                                    {section.id === 'category' && localFilters.category && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#FDB913] inline-block ml-1 absolute top-4 right-2" />
                                    )}
                                    {section.id === 'price' && (priceMin > 0 || priceMax < maxPriceLimit) && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#FDB913] inline-block ml-1 absolute top-4 right-2" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-5 overflow-y-auto">

                            {/* SORT SECTION */}
                            {activeSection === 'sort' && (
                                <div className="space-y-3">
                                    {[
                                        { value: 'relevance', label: 'Relevance' },
                                        { value: 'distance', label: 'Nearest' },
                                        { value: 'price-low', label: 'Price: Low to High' },
                                        { value: 'price-high', label: 'Price: High to Low' },
                                        { value: 'rating', label: 'Top Rated' },
                                    ].map((option) => (
                                        <label
                                            key={option.value}
                                            className={`flex items-center gap-3 p-3 bg-white border rounded-xl cursor-pointer transition-all ${localFilters.sortBy === option.value
                                                ? 'border-[#FDB913] bg-[#FDB913]/5'
                                                : 'border-gray-200 hover:border-[#FDB913]/50'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${localFilters.sortBy === option.value
                                                ? 'border-[#FDB913] bg-[#FDB913]'
                                                : 'border-gray-300'
                                                }`}>
                                                {localFilters.sortBy === option.value && (
                                                    <div className="w-2 h-2 bg-black rounded-full" />
                                                )}
                                            </div>
                                            <input
                                                type="radio"
                                                name="sortBy"
                                                value={option.value}
                                                checked={localFilters.sortBy === option.value}
                                                onChange={() => handleLocalChange('sortBy', option.value)}
                                                className="sr-only"
                                            />
                                            <span className={`text-sm ${localFilters.sortBy === option.value
                                                ? 'text-gray-900 font-bold'
                                                : 'text-gray-700'
                                                }`}>
                                                {option.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {/* CATEGORY SECTION */}
                            {activeSection === 'category' && (
                                <div className="space-y-2">
                                    <button
                                        onClick={() => handleLocalChange('category', undefined)}
                                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${!localFilters.category
                                            ? 'bg-[#FDB913]/10 border-[#FDB913] text-black font-bold'
                                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        All Categories
                                    </button>
                                    {categories.map((cat) => (
                                        <button
                                            key={cat._id}
                                            onClick={() => handleLocalChange('category', localFilters.category === cat._id ? undefined : cat._id)}
                                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between ${localFilters.category === cat._id
                                                ? 'bg-[#FDB913]/10 border-[#FDB913] text-black font-bold'
                                                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                                                }`}
                                        >
                                            <span>{cat.name}</span>
                                            {localFilters.category === cat._id && (
                                                <Check size={16} className="text-[#FDB913]" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* PRICE SECTION */}
                            {activeSection === 'price' && (
                                <div className="pt-4">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 flex-1 mr-2">
                                            <span className="text-xs text-gray-500 block">Min Price</span>
                                            <div className="flex items-center">
                                                <span className="text-gray-400 text-sm font-medium mr-1">₹</span>
                                                <input
                                                    type="number"
                                                    value={priceMin}
                                                    onChange={(e) => handlePriceMinInput(e.target.value)}
                                                    min="0"
                                                    max={priceMax - PRICE_STEP}
                                                    className="w-full bg-transparent font-bold text-gray-900 outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 flex-1 ml-2">
                                            <span className="text-xs text-gray-500 block">Max Price</span>
                                            <div className="flex items-center">
                                                <span className="text-gray-400 text-sm font-medium mr-1">₹</span>
                                                <input
                                                    type="number"
                                                    value={priceMax}
                                                    onChange={(e) => handlePriceMaxInput(e.target.value)}
                                                    min={priceMin + PRICE_STEP}
                                                    max={maxPriceLimit}
                                                    className="w-full bg-transparent font-bold text-gray-900 outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Custom Range Slider */}
                                    <div className="relative mb-6">
                                        <div className="h-2 bg-gray-200 rounded-full relative">
                                            <div
                                                className="absolute h-full bg-[#FDB913] rounded-full transition-all duration-150"
                                                style={{
                                                    left: `${(priceMin / maxPriceLimit) * 100}%`,
                                                    right: `${100 - (priceMax / maxPriceLimit) * 100}%`
                                                }}
                                            />
                                        </div>

                                        {/* Min slider */}
                                        <input
                                            type="range"
                                            min="0"
                                            max={maxPriceLimit}
                                            step={PRICE_STEP}
                                            value={priceMin}
                                            onChange={(e) => handlePriceMinChange(Number(e.target.value))}
                                            className="absolute top-0 w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#FDB913] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#FDB913] [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                                            style={{ zIndex: priceMin > maxPriceLimit - (maxPriceLimit - priceMax) ? 5 : 3 }}
                                        />

                                        {/* Max slider */}
                                        <input
                                            type="range"
                                            min="0"
                                            max={maxPriceLimit}
                                            step={PRICE_STEP}
                                            value={priceMax}
                                            onChange={(e) => handlePriceMaxChange(Number(e.target.value))}
                                            className="absolute top-0 w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#FDB913] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#FDB913] [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                                            style={{ zIndex: priceMin > maxPriceLimit - (maxPriceLimit - priceMax) ? 3 : 5 }}
                                        />
                                    </div>

                                    <div className="flex justify-between text-xs text-gray-400 font-medium">
                                        <span>₹0</span>
                                        <span>₹{maxPriceLimit.toLocaleString()}+</span>
                                    </div>
                                </div>
                            )}

                            {/* RATING SECTION */}
                            {activeSection === 'rating' && (
                                <div className="space-y-3">
                                    {[4, 3, 2, 1].map((rating) => (
                                        <label
                                            key={rating}
                                            className={`flex items-center justify-between p-3 bg-white border rounded-xl cursor-pointer transition-colors ${localFilters.rating === rating
                                                ? 'border-[#FDB913] bg-[#FDB913]/5'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-900 font-bold">{rating}+</span>
                                                <div className="flex">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={16}
                                                            className={`${i < rating
                                                                ? 'fill-[#FDB913] text-[#FDB913]'
                                                                : 'fill-gray-200 text-gray-200'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <input
                                                type="radio"
                                                name="rating"
                                                checked={localFilters.rating === rating}
                                                onChange={() => handleLocalChange('rating', rating)}
                                                className="w-5 h-5 accent-[#FDB913] cursor-pointer"
                                            />
                                        </label>
                                    ))}
                                </div>
                            )}

                            {/* OFFERS SECTION */}
                            {activeSection === 'offer' && (
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <div>
                                            <span className="font-bold text-gray-900 block text-lg">Offers Only</span>
                                            <span className="text-sm text-gray-500">Show only products with discounts</span>
                                        </div>
                                        <div
                                            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${localFilters.hasOffer ? 'bg-[#FDB913]' : 'bg-gray-300'
                                                }`}
                                        >
                                            <div
                                                className="bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300"
                                                style={{ transform: localFilters.hasOffer ? 'translateX(24px)' : 'translateX(0)' }}
                                            />
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={!!localFilters.hasOffer}
                                            onChange={(e) => handleLocalChange('hasOffer', e.target.checked)}
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        className="flex-shrink-0 p-4 border-t border-gray-100 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 flex gap-4"
                        style={{ paddingBottom: 'max(1.5rem, calc(1rem + env(safe-area-inset-bottom, 0px)))' }}
                    >
                        <button
                            onClick={handleReset}
                            className="flex-1 py-3.5 text-gray-700 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all text-sm sm:text-base"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleApply}
                            className="flex-[2] py-3.5 text-black font-bold bg-[#FDB913] rounded-xl shadow-lg shadow-[#FDB913]/30 hover:bg-[#E5A600] active:scale-[0.98] transition-all text-sm sm:text-base"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        @media (min-width: 640px) {
          @keyframes slideUp {
            from {
              transform: translateY(0) scale(0.95);
              opacity: 0;
            }
            to {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
          }
        }
      `}</style>
        </>
    );
}