'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { getCategoryIcon } from '@/lib/category-icons';

interface CategoryCarouselProps {
    onCategorySelect?: (categoryId: string) => void;
    selectedCategory?: string;
}

export default function CategoryCarousel({ onCategorySelect, selectedCategory }: CategoryCarouselProps = {}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const response = await axios.get('/api/categories?parentOnly=true');
            const categoriesData = response.data.data?.categories || response.data.data || [];
            setCategories(Array.isArray(categoriesData) ? categoriesData.slice(0, 12) : []);
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to load categories:', error);
            setIsLoading(false);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    if (isLoading) {
        return (
            <section className="py-6 bg-white">
                <div className="container-custom">
                    <h2 className="text-2xl font-bold text-[#282C3F] mb-6">Explore Products by Category</h2>
                    <div className="flex gap-4 overflow-hidden">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex-shrink-0">
                                <div className="shimmer w-28 h-28 rounded-full mb-2"></div>
                                <div className="shimmer h-4 w-24 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (categories.length === 0) {
        return null;
    }

    return (
        <section className="py-3 bg-white">
            <div className="container-custom">
                <h2 className="text-2xl font-bold text-[#282C3F] mb-3">Explore Products by Category</h2>

                <div className="relative">
                    {/* Left Arrow */}
                    <button
                        onClick={() => scroll('left')}
                        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    {/* Category Carousel */}
                    <div
                        ref={scrollRef}
                        className="category-carousel"
                    >
                        {categories.map((category) => {
                            const { icon: IconComponent, color, bgColor } = getCategoryIcon(category.name);

                            return (
                                <div
                                    key={category._id}
                                    onClick={() => onCategorySelect?.(category._id)}
                                    className="category-item outline-none focus:outline-none"
                                    style={{
                                        outline: 'none',
                                    }}
                                >
                                    <div className={`category-image ${selectedCategory === category._id ? 'border-[#FD9139] shadow-md' : ''}`}>
                                        {category.image ? (
                                            <Image
                                                src={category.image}
                                                alt={category.name}
                                                width={112}
                                                height={112}
                                                unoptimized
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <div
                                                className="w-full h-full flex items-center justify-center rounded-full"
                                                style={{ backgroundColor: bgColor }}
                                            >
                                                <IconComponent size={36} style={{ color }} />
                                            </div>
                                        )}
                                    </div>
                                    <span className={`category-name ${selectedCategory === category._id ? 'text-[#FD9139] font-bold' : 'text-[#282C3F]'}`}>
                                        {category.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Arrow */}
                    <button
                        onClick={() => scroll('right')}
                        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg hover:shadow-xl"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </section>
    );
}
