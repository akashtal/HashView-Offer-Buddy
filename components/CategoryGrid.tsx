'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, Suspense } from 'react';
import {
    MoreHorizontal,
    Package,
    type LucideIcon
} from 'lucide-react';
import axios from 'axios';

interface Category {
    _id: string;
    name: string;
    slug: string;
    image?: string;
    icon?: string;
}

// Skeleton component for better React 19.2 Suspense experience
function CategorySkeleton() {
    return (
        <div className="card hover:shadow-xl transition-all p-6 text-center space-y-3 group bg-white animate-pulse">
            <div className="w-16 h-16 rounded-full mx-auto bg-gray-200"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
        </div>
    );
}

export default function CategoryGrid() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('/api/categories?parentOnly=true');
                if (response.data?.success) {
                    setCategories(response.data.data.categories);
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (isLoading) {
        return (
            <section className="py-12 bg-gray-50">
                <div className="container-custom">
                    <h2 className="indiamart-section-title text-center mb-8">
                        Explore by Category
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <CategorySkeleton key={i} />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // Limit to likely 11 items to leave room for "More" if needed, 
    // or just show all if count is small.
    // The previous grid had 11 specific + 1 "More".
    const displayCategories = categories.slice(0, 11);

    return (
        <section className="py-12 bg-gray-50">
            <div className="container-custom">
                <h2 className="indiamart-section-title text-center mb-8">
                    Browse by Categories
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {displayCategories.map((category) => (
                        <Link
                            key={category._id}
                            href={`/categories/${category.slug}`}
                            className="indiamart-category-card group"
                        >
                            <div className="flex flex-col items-center text-center p-4">
                                {/* Icon / Image */}
                                <div className="w-16 h-16 flex items-center justify-center bg-white rounded-full mb-3 group-hover:bg-primary transition-colors shadow-sm overflow-hidden relative">
                                    {category.image ? (
                                        <Image
                                            src={category.image}
                                            alt={category.name}
                                            fill
                                            className="object-cover p-2 group-hover:opacity-90 transition-opacity"
                                        />
                                    ) : (
                                        <Package
                                            size={32}
                                            className="text-primary group-hover:text-black transition-colors"
                                        />
                                    )}
                                </div>

                                {/* Category Name */}
                                <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">
                                    {category.name}
                                </h3>

                                {/* Subcategories (Placeholder/Hidden as none exist yet) */}
                            </div>
                        </Link>
                    ))}

                    {/* More Categories Link */}
                    <Link
                        href="/categories"
                        className="indiamart-category-card group"
                    >
                        <div className="flex flex-col items-center text-center p-4">
                            <div className="w-16 h-16 flex items-center justify-center bg-yellow-50 rounded-full mb-3 group-hover:bg-primary transition-colors">
                                <MoreHorizontal
                                    size={32}
                                    className="text-primary group-hover:text-black transition-colors"
                                />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-800 mb-2">
                                More Categories
                            </h3>
                        </div>
                    </Link>
                </div>
            </div>
        </section>
    );
}
