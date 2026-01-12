'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/components/ui/Toast';

export default function CartPage() {
    const { items, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();
    const { showToast, ToastContainer } = useToast();

    const handleRemove = (productId: string, title: string) => {
        removeItem(productId);
        showToast(`Removed ${title} from cart`, 'info');
    };

    const handleClearCart = () => {
        if (confirm('Are you sure you want to remove all items from cart?')) {
            clearCart();
            showToast('Cart cleared', 'info');
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[#F3F3F3] py-12">
                <ToastContainer />
                <div className="container-custom">
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
                        <p className="text-gray-600 mb-6">Add some products to get started!</p>
                        <Link
                            href="/products"
                            className="inline-flex items-center gap-2 bg-[#FDB913] hover:bg-[#E5A600] text-black font-bold px-6 py-3 rounded-lg transition-all"
                        >
                            Browse Products
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const subtotal = getTotal();

    return (
        <div className="min-h-screen bg-[#F3F3F3] py-8">
            <ToastContainer />
            <div className="container-custom">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">Interested Products</h1>
                    <button
                        onClick={handleClearCart}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                        Clear All
                    </button>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((item) => (
                            <div
                                key={item.productId}
                                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex gap-4"
                            >
                                {/* Product Image */}
                                <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                                    <Image
                                        src={item.image || '/placeholder-product.jpg'}
                                        alt={item.title}
                                        fill
                                        unoptimized
                                        className="object-cover"
                                    />
                                </div>

                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                    <Link href={`/products/${item.productId}`} className="hover:text-[#FDB913]">
                                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{item.title}</h3>
                                    </Link>
                                    <p className="text-lg font-bold text-[#FDB913] mb-2">
                                        ₹{item.price.toLocaleString('en-IN')}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Quantity: {item.quantity}
                                    </p>
                                    <Link
                                        href={`/products/${item.productId}`}
                                        className="inline-flex items-center gap-1 text-sm text-[#FDB913] hover:text-[#E5A600] font-medium"
                                    >
                                        Contact Vendor →
                                    </Link>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col items-end justify-between">
                                    <button
                                        onClick={() => handleRemove(item.productId, item.title)}
                                        className="text-red-600 hover:text-red-700 p-1"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    <p className="text-sm font-semibold text-gray-900">
                                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 sticky top-24">
                            <h2 className="text-xl font-bold mb-4">Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-700">
                                    <span>Products</span>
                                    <span className="font-semibold">{items.length}</span>
                                </div>
                                <div className="flex justify-between text-gray-700">
                                    <span>Total Items</span>
                                    <span className="font-semibold">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                                </div>
                                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                                    <span>Estimated Value</span>
                                    <span className="text-[#FDB913]">₹{subtotal.toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-gray-700">
                                    <strong>Note:</strong> Contact vendors directly to get the best price and quotations for your requirements.
                                </p>
                            </div>

                            <Link
                                href="/products"
                                className="block text-center bg-[#FDB913] hover:bg-[#E5A600] text-black font-bold py-3 rounded-lg transition-all mb-3 shadow-md hover:shadow-lg"
                            >
                                Continue Browsing
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
