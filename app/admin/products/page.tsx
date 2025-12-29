'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import Input from '@/components/ui/Input';
import { FiTrash2, FiSearch, FiPackage, FiFilter } from 'react-icons/fi';
import { formatRelativeTime } from '@/lib/utils';

export default function AdminProductsPage() {
    const { products, fetchProducts, deleteProduct, isLoading } = useAdminStore();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const filteredProducts = products.filter((p: any) =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await deleteProduct(id);
        } catch (error: any) {
            alert(error.message || 'Failed to delete product');
        }
    };

    if (isLoading && products.length === 0) return <Loading fullScreen text="Loading products..." />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Product Management</h1>
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                    />
                </div>
            </div>

            <Card>
                <CardBody>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b text-gray-500 text-sm">
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
                                                        <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
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
                                            No products found matching &quot;{searchTerm}&quot;
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
