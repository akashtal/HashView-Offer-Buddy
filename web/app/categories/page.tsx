'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Loading from '@/components/ui/Loading';
import { getCategoryIcon } from '@/lib/category-icons';
import { Package } from 'lucide-react';

export default function CategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/categories?parentOnly=true');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                if (data?.success) {
                    setCategories(data.data.categories || []);
                } else {
                    console.error('API call was not successful:', data.message);
                }
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
                    // Fallback icon logic if needed
                    const { icon: IconComponent, color, bgColor } = getCategoryIcon(category.name);

                    return (
                        <Link
                            key={category._id}
                            href={`/categories/${category.slug}`}
                            className="card hover:shadow-xl transition-all p-8 text-center space-y-4 group overflow-hidden"
                        >
                            <div
                                className="w-24 h-24 rounded-full mx-auto flex items-center justify-center group-hover:scale-110 transition-transform relative overflow-hidden bg-gray-50 border border-gray-100 shadow-inner"
                            >
                                {category.image ? (
                                    <Image
                                        src={category.image}
                                        alt={category.name}
                                        fill
                                        className="object-cover p-2"
                                        sizes="100px"
                                    />
                                ) : (
                                    <div style={{ color }} className="p-4">
                                        {IconComponent ? <IconComponent size={40} /> : <Package size={40} className="text-gray-400" />}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-secondary mb-1 line-clamp-1">
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
