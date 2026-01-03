'use client';

import Link from 'next/link';
import {
    Building2,
    Cpu,
    Pill,
    Stethoscope,
    Factory,
    Wrench,
    Wheat,
    Shirt,
    Package,
    Beaker,
    Truck,
    MoreHorizontal,
    type LucideIcon
} from 'lucide-react';

interface Category {
    name: string;
    icon: LucideIcon;
    href: string;
    subcategories?: string[];
}

const categories: Category[] = [
    {
        name: 'Building Construction',
        icon: Building2,
        href: '/categories/building-construction',
        subcategories: ['TMT Bars', 'Cement', 'Bricks', 'Plywood'],
    },
    {
        name: 'Electronics & Electrical',
        icon: Cpu,
        href: '/categories/electronics',
        subcategories: ['Cables', 'Switches', 'LED Lights', 'Batteries'],
    },
    {
        name: 'Pharmaceutical Drugs',
        icon: Pill,
        href: '/categories/pharmaceutical',
        subcategories: ['Medicines', 'Nutraceuticals', 'PCD Franchise'],
    },
    {
        name: 'Hospital Equipment',
        icon: Stethoscope,
        href: '/categories/medical-equipment',
        subcategories: ['Lab Instruments', 'Monitoring Systems', 'Imaging'],
    },
    {
        name: 'Industrial Machinery',
        icon: Factory,
        href: '/categories/machinery',
        subcategories: ['CNC Machines', 'Food Processing', 'Printing'],
    },
    {
        name: 'Industrial Supplies',
        icon: Wrench,
        href: '/categories/industrial-supplies',
        subcategories: ['Pumps', 'Tanks', 'Conveyors', 'Oils'],
    },
    {
        name: 'Agriculture & Food',
        icon: Wheat,
        href: '/categories/agriculture',
        subcategories: ['Rice', 'Wheat', 'Pulses', 'Vegetables'],
    },
    {
        name: 'Apparel & Garments',
        icon: Shirt,
        href: '/categories/apparel',
        subcategories: ['Kurtis', 'T-Shirts', 'Uniforms', 'Fabrics'],
    },
    {
        name: 'Packaging Material',
        icon: Package,
        href: '/categories/packaging',
        subcategories: ['Boxes', 'Bottles', 'Pouches', 'Machines'],
    },
    {
        name: 'Chemicals & Dyes',
        icon: Beaker,
        href: '/categories/chemicals',
        subcategories: ['Industrial Chemicals', 'Dyes', 'Solvents'],
    },
    {
        name: 'Logistics & Transport',
        icon: Truck,
        href: '/categories/logistics',
        subcategories: ['Transportation', 'Packers & Movers', 'Cargo'],
    },
    {
        name: 'More Categories',
        icon: MoreHorizontal,
        href: '/categories',
        subcategories: [],
    },
];

export default function CategoryGrid() {
    return (
        <section className="py-12 bg-gray-50">
            <div className="container-custom">
                <h2 className="indiamart-section-title text-center mb-8">
                    Browse by Categories
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {categories.map((category) => {
                        const Icon = category.icon;

                        return (
                            <Link
                                key={category.name}
                                href={category.href}
                                className="indiamart-category-card group"
                            >
                                <div className="flex flex-col items-center text-center p-2">
                                    {/* Icon */}
                                    <div className="w-16 h-16 flex items-center justify-center bg-yellow-50 rounded-full mb-3 group-hover:bg-primary transition-colors">
                                        <Icon
                                            size={32}
                                            className="text-primary group-hover:text-black transition-colors"
                                        />
                                    </div>

                                    {/* Category Name */}
                                    <h3 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2">
                                        {category.name}
                                    </h3>

                                    {/* Subcategories */}
                                    {category.subcategories && category.subcategories.length > 0 && (
                                        <div className="text-xs text-gray-500 line-clamp-2">
                                            {category.subcategories.slice(0, 2).join(', ')}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
