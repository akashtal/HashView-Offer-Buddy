import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Search, X } from 'lucide-react';
import Image from 'next/image';

interface ProductPickerProps {
    vendorId: string;
    onSelect: (product: any) => void;
    onClose: () => void;
}
const ProductPicker: React.FC<ProductPickerProps> = ({ vendorId, onSelect, onClose }) => {
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Ensure vendorId is valid before fetching
                if (!vendorId) return;

                // Using the updated products API with vendorId filter
                const res = await axios.get('/api/products', {
                    params: {
                        vendorId: vendorId,
                        limit: 20
                    }
                });
                setProducts(res.data.data.products || []);
            } catch (error) {
                console.error('Failed to fetch vendor products:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, [vendorId]);

    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl max-h-[80vh] flex flex-col shadow-xl animate-in fade-in zoom-in-95">
                <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Share a Product</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 border-b bg-gray-50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">
                            <p>No products found for this vendor.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {filteredProducts.map((product) => (
                                <button
                                    key={product._id}
                                    onClick={() => onSelect(product)}
                                    className="flex items-start gap-3 p-3 hover:bg-indigo-50 rounded-xl transition-colors text-left group border border-transparent hover:border-indigo-100"
                                >
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative border border-gray-200">
                                        {product.images && product.images[0] ? (
                                            <Image
                                                src={product.images[0]}
                                                alt={product.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-gray-900 truncate">{product.title}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="font-bold text-gray-900">₹{product.price?.discounted || product.price?.original}</span>
                                            {product.price?.discounted && product.price.original && (
                                                <span className="text-xs text-gray-400 line-through">₹{product.price.original}</span>
                                            )}
                                        </div>
                                        {product.stock?.available === false && (
                                            <span className="text-[10px] text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded mt-1 inline-block">Out of Stock</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default ProductPicker;
