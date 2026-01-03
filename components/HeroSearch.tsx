'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HeroSearch() {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <div className="hidden md:block bg-gradient-to-br from-black to-gray-900 py-12 md:py-16">
            <div className="container-custom">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Hero Title */}
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        India&apos;s Largest Online B2B Marketplace
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 mb-8">
                        Find quality products & reliable suppliers near you
                    </p>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto">
                        <div className="flex flex-col md:flex-row gap-3 bg-white rounded-lg shadow-2xl p-2">
                            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-md">
                                <Search className="text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search for products, services, or suppliers..."
                                    className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400"
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-primary hover:bg-primary-dark text-black font-bold px-8 py-3 rounded-md whitespace-nowrap transition-colors"
                            >
                                Search
                            </button>
                        </div>
                    </form>

                    {/* Quick Suggestions */}
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                        <span className="text-gray-300 text-sm">Popular:</span>
                        {['Building Materials', 'Electronics', 'Machinery', 'Pharmaceuticals'].map((term) => (
                            <button
                                key={term}
                                onClick={() => {
                                    setSearchQuery(term);
                                    router.push(`/products?search=${encodeURIComponent(term)}`);
                                }}
                                className="bg-white/20 hover:bg-primary hover:text-black text-white text-sm px-3 py-1 rounded-full transition-colors"
                            >
                                {term}
                            </button>
                        ))}
                    </div>

                    {/* CTA Section */}
                    <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4">
                        <button className="bg-primary hover:bg-primary-dark text-black font-bold px-8 py-3 rounded-lg transition-colors">
                            Get Best Price
                        </button>
                        <span className="text-white text-sm">
                            or
                        </span>
                        <button className="border-2 border-primary text-primary hover:bg-primary hover:text-black font-bold px-8 py-3 rounded-lg transition-colors">
                            Browse Categories
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
