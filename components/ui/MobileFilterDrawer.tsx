'use client';

import { useState, useEffect } from 'react';
import { X, Check, Star } from 'lucide-react';
import { FilterOptions } from './ComprehensiveFilters';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileFilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    currentFilters: FilterOptions;
    categories: any[];
    onApplyFilters: (filters: FilterOptions) => void;
}

export default function MobileFilterDrawer({ isOpen, onClose, currentFilters, categories, onApplyFilters }: MobileFilterDrawerProps) {
    const [localFilters, setLocalFilters] = useState<FilterOptions>(currentFilters);
    const [priceMin, setPriceMin] = useState(currentFilters.minPrice || 0);
    const [priceMax, setPriceMax] = useState(currentFilters.maxPrice || 50000);
    const [activeSection, setActiveSection] = useState<string>('sort'); // sort, category, price, rating

    useEffect(() => {
        if (isOpen) {
            setLocalFilters(currentFilters);
            setPriceMin(currentFilters.minPrice || 0);
            setPriceMax(currentFilters.maxPrice || 50000);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        }
    }, [isOpen, currentFilters]);

    const handleLocalChange = (key: keyof FilterOptions, value: any) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApply = () => {
        onApplyFilters({
            ...localFilters,
            minPrice: priceMin > 0 ? priceMin : undefined,
            maxPrice: priceMax < 50000 ? priceMax : undefined
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
        setPriceMax(50000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001]"
                        onClick={onClose}
                    />

                    {/* Galaxy/Bottom Sheet Layout Container */}
                    <div className="fixed inset-0 z-[1002] flex items-end sm:items-center justify-center pointer-events-none">
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full bg-white rounded-t-[32px] sm:max-w-md sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:h-[80vh] overflow-hidden pointer-events-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                                <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                                <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
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
                                            {section.id === 'category' && localFilters.category && <span className="w-1.5 h-1.5 rounded-full bg-[#FDB913] inline-block ml-1 absolute top-4 right-2" />}
                                            {section.id === 'price' && (priceMin > 0 || priceMax < 50000) && <span className="w-1.5 h-1.5 rounded-full bg-[#FDB913] inline-block ml-1 absolute top-4 right-2" />}
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
                                                <label key={option.value} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-[#FDB913] transition-colors relative overflow-hidden">
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors z-10 ${localFilters.sortBy === option.value ? 'border-[#FDB913] bg-[#FDB913]' : 'border-gray-300'}`}>
                                                        {localFilters.sortBy === option.value && <div className="w-2 h-2 bg-black rounded-full" />}
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        name="sortBy"
                                                        value={option.value}
                                                        checked={localFilters.sortBy === option.value}
                                                        onChange={() => handleLocalChange('sortBy', option.value)}
                                                        className="hidden"
                                                    />
                                                    <span className={`text-sm z-10 ${localFilters.sortBy === option.value ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                                                        {option.label}
                                                    </span>
                                                    {localFilters.sortBy === option.value && (
                                                        <motion.div layoutId="sort-active" className="absolute inset-0 bg-[#FDB913]/5 border-2 border-[#FDB913] rounded-xl pointer-events-none" />
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* CATEGORY SECTION */}
                                    {activeSection === 'category' && (
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => handleLocalChange('category', undefined)}
                                                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${!localFilters.category ? 'bg-[#FDB913]/10 border-[#FDB913] text-black font-bold' : 'bg-white border-gray-200 text-gray-700'}`}
                                            >
                                                All Categories
                                            </button>
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat._id}
                                                    onClick={() => handleLocalChange('category', localFilters.category === cat._id ? undefined : cat._id)}
                                                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between ${localFilters.category === cat._id ? 'bg-[#FDB913]/10 border-[#FDB913] text-black font-bold' : 'bg-white border-gray-200 text-gray-700'}`}
                                                >
                                                    <span>{cat.name}</span>
                                                    {localFilters.category === cat._id && <Check size={16} className="text-[#FDB913]" />}
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
                                                            onChange={(e) => setPriceMin(Number(e.target.value))}
                                                            className="w-full bg-transparent font-bold text-gray-900 outline-none text-sm"
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
                                                            onChange={(e) => setPriceMax(Number(e.target.value))}
                                                            className="w-full bg-transparent font-bold text-gray-900 outline-none text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Range Slider */}
                                            <div className="relative h-2 bg-gray-100 rounded-full mb-6">
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
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto z-10"
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
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto z-10"
                                                />
                                            </div>

                                            <div className="flex justify-between text-xs text-gray-400 font-medium">
                                                <span>₹0</span>
                                                <span>₹50,000+</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* RATING SECTION */}
                                    {activeSection === 'rating' && (
                                        <div className="space-y-3">
                                            {[4, 3, 2, 1].map((rating) => (
                                                <label key={rating} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl cursor-pointer">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-900 font-bold">{rating}+</span>
                                                        <div className="flex">
                                                            {Array.from({ length: 5 }).map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    size={16}
                                                                    className={`${i < rating ? 'fill-[#FDB913] text-[#FDB913]' : 'fill-gray-200 text-gray-200'}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        name="rating"
                                                        checked={localFilters.rating === rating}
                                                        onChange={() => handleLocalChange('rating', rating)}
                                                        className="w-5 h-5 accent-[#FDB913]"
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
                                                <div className={`w-14 h-8 flex items-center bg-gray-200 rounded-full p-1 duration-300 ease-in-out ${localFilters.hasOffer ? 'bg-[#FDB913]' : ''}`}>
                                                    <motion.div
                                                        className="bg-white w-6 h-6 rounded-full shadow-md"
                                                        animate={{ x: localFilters.hasOffer ? 24 : 0 }}
                                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                    />
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={!!localFilters.hasOffer}
                                                    onChange={(e) => handleLocalChange('hasOffer', e.target.checked)}
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white rounded-b-[32px] sm:rounded-b-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20 flex gap-4">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 py-3.5 text-gray-700 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-all text-sm sm:text-base"
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
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

