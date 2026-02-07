'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Star } from 'lucide-react';
import axios from 'axios';
import { getCategoryIcon } from '@/lib/category-icons';

interface CategoryCarouselProps {
    onCategorySelect?: (categoryId: string) => void;
    selectedCategory?: string;
}

export default function CategoryCarousel({ onCategorySelect, selectedCategory }: CategoryCarouselProps = {}) {
    // Refs for scrolling
    const categoryScrollRef = useRef<HTMLDivElement>(null);
    const vendorScrollRef = useRef<HTMLDivElement>(null);

    // State
    const [categories, setCategories] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Categories
                const catResponse = await axios.get('/api/categories?parentOnly=true');
                const categoriesData = catResponse.data.data?.categories || catResponse.data.data || [];
                setCategories(Array.isArray(categoriesData) ? categoriesData : []);

                // Fetch Vendors
                const vendResponse = await axios.get('/api/vendors?limit=10');
                const vendorsData = vendResponse.data.data?.vendors || [];
                setVendors(vendorsData);

                setIsLoading(false);
            } catch (error) {
                console.error('Failed to load data:', error);
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
        if (ref.current) {
            const scrollAmount = 300;
            ref.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    if (isLoading) {
        return (
            <section className="py-4 bg-white">
                <div className="container-custom space-y-6">
                    {/* Categories Shimmer */}
                    <div className="flex gap-4 overflow-hidden">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={`cat-${i}`} className="flex-shrink-0 flex flex-col items-center gap-2">
                                <div className="shimmer w-16 h-16 rounded-full"></div>
                                <div className="shimmer w-12 h-3 rounded"></div>
                            </div>
                        ))}
                    </div>
                    {/* Vendors Shimmer */}
                    <div>
                        <div className="shimmer w-40 h-6 rounded mb-4"></div>
                        <div className="flex gap-4 overflow-hidden">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={`vend-${i}`} className="flex-shrink-0 w-48">
                                    <div className="shimmer w-full h-32 rounded-lg mb-2"></div>
                                    <div className="shimmer h-3 w-3/4 rounded mb-1"></div>
                                    <div className="shimmer h-3 w-1/2 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (categories.length === 0 && vendors.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2 bg-white pb-6 pt-2">
            {/* 1. Categories Section */}
            {categories.length > 0 && (
                <section className="py-2">
                    <div className="container-custom">
                        <div className="relative group">
                            {/* Left Arrow */}
                            <button
                                onClick={() => scroll(categoryScrollRef, 'left')}
                                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg opacity-0 group-hover:opacity-100 transition-opacity border border-gray-100"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <div
                                ref={categoryScrollRef}
                                className="flex gap-4 overflow-x-auto scrollbar-hide py-2 px-1"
                                style={{ scrollSnapType: 'x mandatory' }}
                            >
                                {categories.map((category) => {
                                    const { icon: IconComponent, color, bgColor } = getCategoryIcon(category.name);

                                    // Handle both image and icon fallback
                                    const hasImage = Boolean(category.image);

                                    return (
                                        <div
                                            key={category._id}
                                            onClick={() => onCategorySelect?.(selectedCategory === category._id ? '' : category._id)}
                                            className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer group/item scroll-snap-align-start"
                                        >
                                            <div
                                                className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover/item:scale-105 border-2 ${selectedCategory === category._id ? 'border-[#FD9139]' : 'border-transparent'}`}
                                                style={{ backgroundColor: hasImage ? '#f0f0f0' : bgColor }}
                                            >
                                                {hasImage ? (
                                                    <Image
                                                        src={category.image}
                                                        alt={category.name}
                                                        width={80}
                                                        height={80}
                                                        className="object-cover w-full h-full"
                                                    />
                                                ) : (
                                                    <IconComponent size={28} style={{ color }} />
                                                )}
                                            </div>
                                            <span className={`text-xs md:text-sm font-medium whitespace-nowrap ${selectedCategory === category._id ? 'text-[#FD9139]' : 'text-gray-700'}`}>
                                                {category.name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Right Arrow */}
                            <button
                                onClick={() => scroll(categoryScrollRef, 'right')}
                                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl opacity-0 group-hover:opacity-100 transition-opacity border border-gray-100"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* 2. Top Stores Section */}
            {vendors.length > 0 && (
                <section className="py-2">
                    <div className="container-custom">
                        <h2 className="text-xl font-bold text-[#282C3F] mb-3">Top Stores Near You</h2>

                        <div className="relative group">
                            {/* Left Arrow */}
                            <button
                                onClick={() => scroll(vendorScrollRef, 'left')}
                                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl opacity-0 group-hover:opacity-100 transition-opacity border border-gray-100"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            {/* Vendor Carousel */}
                            <div
                                ref={vendorScrollRef}
                                className="flex gap-4 overflow-x-auto scrollbar-hide py-2 px-1"
                                style={{ scrollSnapType: 'x mandatory' }}
                            >
                                {vendors.map((vendor) => (
                                    <Link
                                        key={vendor._id}
                                        href={`/vendors/${vendor._id}`}
                                        className="flex-shrink-0 w-48 md:w-56 scroll-snap-align-start hover:scale-[1.02] transition-transform duration-300 block"
                                    >
                                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow">
                                            {/* Image */}
                                            <div className="relative h-32 bg-gray-100">
                                                <Image
                                                    src={vendor.shopLogo || '/placeholder-shop.jpg'}
                                                    alt={vendor.shopName}
                                                    fill
                                                    className="object-cover"
                                                />
                                                {/* Overlay gradient */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                <div className="absolute bottom-2 left-2 right-2 text-white">
                                                    <p className="font-bold text-sm truncate">{vendor.shopName}</p>
                                                    <p className="text-[10px] opacity-90 truncate">{vendor.category?.name || 'General'}</p>
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="p-2.5 flex-1 flex flex-col justify-between gap-2">
                                                <div>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                                                            <Star size={8} fill="currentColor" /> {vendor.rating || '4.5'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 truncate max-w-[80px]">{vendor.location?.city}</span>
                                                    </div>
                                                </div>
                                                <div className="pt-2 border-t border-gray-50 flex items-center text-[10px] text-gray-500 font-medium">
                                                    <MapPin size={10} className="mr-1 text-red-500 flex-shrink-0" />
                                                    <span className="truncate">{vendor.location?.address || 'View details'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Right Arrow */}
                            <button
                                onClick={() => scroll(vendorScrollRef, 'right')}
                                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl opacity-0 group-hover:opacity-100 transition-opacity border border-gray-100"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
