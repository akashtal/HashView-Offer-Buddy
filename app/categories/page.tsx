'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import Loading from '@/components/ui/Loading';
import { getCategoryIcon } from '@/lib/category-icons';

export default function CategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('/api/categories');
                setCategories(response.data.data.categories);
            } catch (error) {
                console.error('Failed to load categories:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (isLoading) {
        return <Loading fullScreen text="Loading categories..." />;
    }

    return (
        <div className="container-custom py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-secondary mb-4">
                    Browse by Category
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Explore products and offers from local shops across various categories
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categories.map((category) => {
                    const { icon: IconComponent, color, bgColor } = getCategoryIcon(category.name);

                    return (
                        <Link
                            key={category._id}
                            href={`/products?category=${category._id}`}
                            className="card hover:shadow-xl transition-all p-8 text-center space-y-4 group"
                        >
                            <div
                                className="w-20 h-20 rounded-full mx-auto flex items-center justify-center group-hover:scale-110 transition-transform"
                                style={{ backgroundColor: bgColor }}
                            >
                                <IconComponent size={40} style={{ color }} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-secondary mb-1">
                                    {category.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Browse collection
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
