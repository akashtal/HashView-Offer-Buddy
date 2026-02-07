'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiEdit2, FiTrash2, FiPackage, FiPlus, FiEye, FiEyeOff } from 'react-icons/fi';

interface VendorProductsClientProps {
    initialProducts: any[];
    initialPagination: {
        page: number;
        total: number;
        hasMore: boolean;
    };
}

export default function VendorProductsClient({
    initialProducts,
    initialPagination,
}: VendorProductsClientProps) {
    const [products, setProducts] = useState(initialProducts);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(initialPagination.page);
    const [hasMore, setHasMore] = useState(initialPagination.hasMore);

    const handleLoadMore = async () => {
        setIsLoading(true);
        try {
            const nextPage = page + 1;
            const res = await fetch(`/api/products?vendorProducts=true&page=${nextPage}&limit=20`);
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

    const handleDelete = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
            if (res.ok) {
                setProducts(prev => prev.filter(p => p._id !== productId));
            }
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const handleToggleStatus = async (productId: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/products/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus }),
            });
            if (res.ok) {
                setProducts(prev =>
                    prev.map(p => p._id === productId ? { ...p, isActive: !currentStatus } : p)
                );
            }
        } catch (error) {
            console.error('Failed to toggle status:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">My Products</h1>
                <Link
                    href="/vendor/products/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                    <FiPlus /> Add Product
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border">
                    <p className="text-sm text-gray-500">Total Products</p>
                    <p className="text-2xl font-bold">{initialPagination.total}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border">
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-2xl font-bold text-green-600">
                        {products.filter(p => p.isActive).length}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-4 border">
                    <p className="text-sm text-gray-500">Inactive</p>
                    <p className="text-2xl font-bold text-gray-400">
                        {products.filter(p => !p.isActive).length}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-4 border">
                    <p className="text-sm text-gray-500">With Offers</p>
                    <p className="text-2xl font-bold text-orange-500">
                        {products.filter(p => p.offer?.validUntil && new Date(p.offer.validUntil) > new Date()).length}
                    </p>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl border overflow-hidden">
                {products.length === 0 ? (
                    <div className="py-16 text-center">
                        <FiPackage className="mx-auto text-gray-300 mb-4" size={48} />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Products Yet</h3>
                        <p className="text-gray-500 mb-4">Start by adding your first product</p>
                        <Link
                            href="/vendor/products/new"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg"
                        >
                            <FiPlus /> Add Product
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b text-sm text-gray-500">
                                    <tr>
                                        <th className="text-left py-3 px-4">Product</th>
                                        <th className="text-left py-3 px-4">Price</th>
                                        <th className="text-left py-3 px-4">Category</th>
                                        <th className="text-left py-3 px-4">Status</th>
                                        <th className="text-right py-3 px-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {products.map((product) => (
                                        <tr key={product._id} className="hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden flex-shrink-0">
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
                                                    <div className="text-xs text-gray-500 line-through">
                                                        ₹{product.price.original}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                                    {product.category?.name || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${product.isActive
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {product.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleStatus(product._id, product.isActive)}
                                                        className="p-2 text-gray-400 hover:text-gray-600"
                                                        title={product.isActive ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {product.isActive ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                                    </button>
                                                    <Link
                                                        href={`/vendor/products/${product._id}/edit`}
                                                        className="p-2 text-gray-400 hover:text-primary"
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(product._id)}
                                                        className="p-2 text-gray-400 hover:text-red-600"
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Load More */}
                        {hasMore && (
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
                    </>
                )}
            </div>
        </div>
    );
}
