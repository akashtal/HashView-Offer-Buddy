'use client';

import { useEffect, useState, useCallback, useOptimistic } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, X } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/components/ui/Toast';

export default function WishlistPage() {
    const { items: wishlistIds, toggleItem } = useWishlistStore();
    const { addItem } = useCartStore();
    const { showToast, ToastContainer } = useToast();

    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // React 19.2: Optimistic updates for instant removal feedback
    const [optimisticProducts, removeOptimistic] = useOptimistic(
        products,
        (state, removedId: string) => state.filter(p => p._id !== removedId)
    );

    const loadWishlistProducts = useCallback(async () => {
        if (wishlistIds.length === 0) {
            setProducts([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            // Fetch all products and filter by wishlist IDs
            const response = await fetch('/api/products');
            const data = await response.json();
            const allProducts = data.data.products;
            const wishlistProducts = allProducts.filter((p: any) => wishlistIds.includes(p._id));
            setProducts(wishlistProducts);
        } catch (error) {
            console.error('Failed to load wishlist:', error);
        } finally {
            setIsLoading(false);
        }
    }, [wishlistIds]);

    useEffect(() => {
        loadWishlistProducts();
    }, [wishlistIds, loadWishlistProducts]);

    const handleRemove = async (productId: string, title: string) => {
        // Optimistic: Remove from UI instantly
        removeOptimistic(productId);

        // Actual removal in background
        toggleItem(productId);
        showToast(`Removed ${title} from wishlist`, 'info');
    };

    const handleAddToCart = (product: any) => {
        addItem({
            productId: product._id,
            title: product.title,
            price: product.price?.discounted || product.price?.original || 0,
            image: product.images?.[0] || '',
            vendorId: product.vendorId?._id,
        }, 1);
        showToast(`Added ${product.title} to cart!`, 'success');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F3F3F3] py-12">
                <div className="container-custom">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 w-48 rounded"></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="min-h-screen bg-[#F3F3F3] py-12">
                <ToastContainer />
                <div className="container-custom">
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <Heart size={64} className="mx-auto text-gray-300 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Wishlist is Empty</h2>
                        <p className="text-gray-600 mb-6">Start adding products you love!</p>
                        <Link
                            href="/products"
                            className="inline-flex items-center gap-2 bg-[#FDB913] hover:bg-[#E5A600] text-black font-bold px-6 py-3 rounded-lg transition-all"
                        >
                            Browse Products
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F3F3F3] py-8">
            <ToastContainer />
            <div className="container-custom">
                <h1 className="text-3xl font-bold mb-6">My Wishlist ({products.length})</h1>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                        <div
                            key={product._id}
                            className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow group relative"
                        >
                            {/* Remove Button */}
                            <button
                                onClick={() => handleRemove(product._id, product.title)}
                                className="absolute top-2 right-2 z-10 p-2 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-red-50 text-gray-600 hover:text-red-600 transition-all"
                            >
                                <X size={16} />
                            </button>

                            {/* Product Image */}
                            <Link href={`/products/${product._id}`}>
                                <div className="relative h-48 bg-gray-100">
                                    <Image
                                        src={product.images?.[0] || '/placeholder-product.jpg'}
                                        alt={product.title}
                                        fill
                                        unoptimized
                                        className="object-cover"
                                    />
                                </div>
                            </Link>

                            {/* Product Info */}
                            <div className="p-3">
                                <Link href={`/products/${product._id}`}>
                                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-2">
                                        {product.title}
                                    </h3>
                                </Link>

                                <p className="text-lg font-bold text-[#FDB913] mb-3">
                                    ₹{(product.price?.discounted || product.price?.original || 0).toLocaleString('en-IN')}
                                </p>

                                <button
                                    onClick={() => handleAddToCart(product)}
                                    className="w-full flex items-center justify-center gap-2 bg-[#FDB913] hover:bg-[#E5A600] text-black font-bold py-2 rounded-lg transition-all text-sm"
                                >
                                    <ShoppingCart size={16} />
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
