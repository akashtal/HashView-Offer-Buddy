'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FiTrash2, FiSearch, FiPackage } from 'react-icons/fi';
import { formatRelativeTime } from '@/lib/utils';

interface AdminProductsClientProps {
    initialProducts: any[];
    initialPagination: {
        page: number;
        total: number;
        hasMore: boolean;
    };
}

export default function AdminProductsClient({
    initialProducts,
    initialPagination,
}: AdminProductsClientProps) {
    const [products, setProducts] = useState(initialProducts);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(initialPagination.page);
    const [hasMore, setHasMore] = useState(initialPagination.hasMore);

    // Client-side filtering for current loaded products
    const filteredProducts = products.filter((p: any) =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleLoadMore = async () => {
        setIsLoading(true);
        try {
            const nextPage = page + 1;
            const res = await fetch(`/api/products?page=${nextPage}&limit=20`);
            const data = await res.json();

            if (data.data?.products) {
                setProducts(prev => [...prev, ...data.data.products]);
                setPage(nextPage);
                setHasMore(data.data.pagination?.hasMore ?? false);
            }
        } catch (error) {
            console.error('Failed to load more:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setProducts(prev => prev.filter(p => p._id !== id));
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
            </div>

            <div className="text-sm text-gray-500">
                Showing {filteredProducts.length} of {initialPagination.total} products
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b text-gray-500 text-sm bg-gray-50">
                                <th className="py-3 px-4">Product</th>
                                <th className="py-3 px-4">Price</th>
                                <th className="py-3 px-4">Category</th>
                                <th className="py-3 px-4">Vendor</th>
                                <th className="py-3 px-4">Added</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product: any) => (
                                <tr key={product._id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded bg-gray-100 flex-shrink-0 overflow-hidden border">
                                                {product.images?.[0] ? (
                                                    <Image
                                                        src={product.images[0]}
                                                        alt={product.title}
                                                        width={48}
                                                        height={48}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <FiPackage className="w-6 h-6 m-auto text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 line-clamp-1">{product.title}</p>
                                                <p className="text-xs text-gray-500 line-clamp-1">{product.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="font-medium">
                                            ₹{product.price?.discounted || product.price?.original}
                                        </div>
                                        {product.price?.discounted && (
                                            <div className="text-xs text-gray-500 line-through">₹{product.price.original}</div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                            {product.category?.name || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600">
                                        {product.vendorId?.shopName || 'Unknown Vendor'}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-500">
                                        {formatRelativeTime(product.createdAt)}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <button
                                            onClick={() => handleDelete(product._id)}
                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                            title="Delete Product"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500">
                                        No products found {searchTerm && `matching "${searchTerm}"`}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Load More */}
                {hasMore && !searchTerm && (
                    <div className="p-4 border-t text-center">
                        <button
                            onClick={handleLoadMore}
                            disabled={isLoading}
                            className="px-6 py-2 text-primary font-medium hover:bg-primary/5 rounded-lg disabled:opacity-50"
                        >
                            {isLoading ? 'Loading...' : 'Load More Products'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
