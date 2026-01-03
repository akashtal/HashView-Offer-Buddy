'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  ChevronRight,
  Share2,
  Heart,
  MessageSquare,
  Star,
  ChevronLeft,
  ZoomIn
} from 'lucide-react';
import axios from 'axios';
import { useLocation } from '@/lib/LocationContext';
import { calculateDistance } from '@/lib/location-utils';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const { location } = useLocation();

  const [product, setProduct] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    loadProductData();
  }, [productId]);

  const loadProductData = async () => {
    try {
      setIsLoading(true);
      const productRes = await axios.get(`/api/products/${productId}`);
      const productData = productRes.data.data.product;
      setProduct(productData);

      // Calculate distance if user location exists
      if (location?.coordinates && productData.vendorId?.location?.coordinates) {
        const [vendorLng, vendorLat] = productData.vendorId.location.coordinates.coordinates;
        productData.distance = calculateDistance(
          location.coordinates,
          { latitude: vendorLat, longitude: vendorLng }
        );
      }

      // Fetch similar products
      if (productData.category?._id) {
        const similarRes = await axios.get(`/api/products`, {
          params: {
            category: productData.category._id,
            limit: 5,
          },
        });
        setSimilarProducts(
          similarRes.data.data.products.filter((p: any) => p._id !== productId)
        );
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load product:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="container-custom">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 w-1/3 rounded"></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 w-3/4 rounded"></div>
                <div className="h-6 bg-gray-200 w-1/4 rounded"></div>
                <div className="h-32 bg-gray-200 w-full rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return <div className="p-12 text-center">Product not found</div>;

  const vendor = product.vendorId;

  return (
    <div className="min-h-screen bg-[#F3F3F3]">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="container-custom flex items-center text-sm text-gray-500 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-[#FDB913]">Home</Link>
          <ChevronRight size={14} className="mx-2" />
          <Link href="/products" className="hover:text-[#FDB913]">Products</Link>
          <ChevronRight size={14} className="mx-2" />
          <Link href={`/products?category=${product.category?._id}`} className="hover:text-[#FDB913]">
            {product.category?.name || 'Category'}
          </Link>
          <ChevronRight size={14} className="mx-2" />
          <span className="text-gray-900 font-medium truncate">{product.title}</span>
        </div>
      </div>

      <div className="container-custom py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid md:grid-cols-12 gap-0">
            {/* Image Gallery Section */}
            <div className="md:col-span-5 p-4 md:p-6 border-b md:border-b-0 md:border-r border-gray-200 bg-white">
              {/* Main Image with Navigation */}
              <div className="relative group">
                <div className="relative h-64 sm:h-80 md:h-96 lg:h-[480px] w-full mb-3 border border-gray-100 rounded-xl overflow-hidden bg-gray-50">
                  <Image
                    src={product.images[activeImage] || '/placeholder-product.jpg'}
                    alt={product.title}
                    fill
                    unoptimized
                    className="object-contain p-4"
                  />

                  {/* Badges */}
                  {product.offer && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
                      {product.offer.value}% OFF
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button className="p-2.5 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-white transition-all hover:scale-110 text-gray-600 hover:text-red-500">
                      <Heart size={18} />
                    </button>
                    <button className="p-2.5 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-white transition-all hover:scale-110 text-gray-600">
                      <Share2 size={18} />
                    </button>
                  </div>

                  {/* Navigation Arrows */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                      >
                        <ChevronLeft size={20} className="text-gray-700" />
                      </button>
                      <button
                        onClick={() => setActiveImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                      >
                        <ChevronRight size={20} className="text-gray-700" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  {product.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/70 backdrop-blur text-white text-xs font-medium rounded-full">
                      {activeImage + 1} / {product.images.length}
                    </div>
                  )}
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {product.images.length > 1 && (
                <div className="relative">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {product.images.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={`relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 border-2 rounded-lg overflow-hidden transition-all hover:scale-105 ${activeImage === idx
                          ? 'border-[#FDB913] ring-2 ring-[#FDB913]/30 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <Image
                          src={img}
                          alt={`Product ${idx + 1}`}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Product Info Section */}
            <div className="md:col-span-7 p-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {product.title}
              </h1>

              <div className="flex items-center gap-2 mb-4">
                <span className="indiamart-price text-3xl">
                  ₹{product.price?.discounted || product.price?.original}
                </span>
                {product.price?.discounted && (
                  <span className="text-gray-500 line-through text-lg">
                    ₹{product.price.original}
                  </span>
                )}
                <span className="text-gray-500 text-sm">/ Unit</span>
              </div>

              {/* Lead Form / Buttons */}
              <div className="bg-[#FFF9E6] p-4 rounded-lg border border-[#FFEBA1] mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowEnquiryModal(true)}
                    className="flex-1 indiamart-btn-primary flex items-center justify-center gap-2 text-lg"
                  >
                    <Phone size={20} />
                    Get Best Price
                  </button>
                  {vendor.contactInfo?.whatsapp && (
                    <a
                      href={`https://wa.me/${vendor.contactInfo.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageSquare size={20} />
                      Chat on WhatsApp
                    </a>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Call {vendor.contactInfo?.phone} for instant details
                </p>
              </div>

              {/* Product Details Table */}
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3 border-b pb-2">Product Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-sm">
                  {product.description && (
                    <div className="col-span-full text-gray-700 leading-relaxed mb-4">
                      {product.description}
                    </div>
                  )}
                  {product.brand && (
                    <div className="flex border-b border-gray-100 pb-2">
                      <span className="text-gray-500 w-32">Brand</span>
                      <span className="font-medium">{product.brand}</span>
                    </div>
                  )}
                  {product.stock?.available && (
                    <div className="flex border-b border-gray-100 pb-2">
                      <span className="text-gray-500 w-32">Availability</span>
                      <span className="font-medium text-green-600">In Stock</span>
                    </div>
                  )}
                  {product.offer && (
                    <div className="flex border-b border-gray-100 pb-2">
                      <span className="text-gray-500 w-32">Condition</span>
                      <span className="font-medium text-red-600">{product.offer.description}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vendor Card (Embedded) */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg mb-1">
                      Sold by {vendor.shopName}
                    </h4>
                    {vendor.yearEstablished && (
                      <div className="text-xs text-gray-500">
                        Established {vendor.yearEstablished}
                      </div>
                    )}
                  </div>
                  {vendor.isApproved && (
                    <div className="verified-badge">
                      <ShieldCheck size={14} className="mr-1" />
                      TrustSEAL Verified
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                  <MapPin size={16} className="text-gray-400" />
                  {vendor.location?.address}, {vendor.location?.city}
                </div>

                {product.distance !== undefined && (
                  <div className="text-sm font-medium text-green-600 mb-3 flex items-center gap-1">
                    <MapPin size={14} />
                    {product.distance < 1 ?
                      `${(product.distance * 1000).toFixed(0)} m` :
                      `${product.distance.toFixed(1)} km`} away from you
                  </div>
                )}

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
                  <div className="text-center">
                    <div className="flex items-center gap-1 font-bold text-gray-900">
                      {vendor.rating || '4.5'} <Star size={12} fill="currentColor" className="text-[#FDB913]" />
                    </div>
                    <div className="text-xs text-gray-500">Rating</div>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900">
                      {vendor.analytics?.totalProducts || '50+'}
                    </div>
                    <div className="text-xs text-gray-500">Products</div>
                  </div>
                  <div className="ml-auto">
                    <Link href={`/vendors/${vendor._id}`} className="text-[#00A651] font-bold text-sm hover:underline">
                      View Supplier Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mt-8">
            <h3 className="indiamart-section-title">Similar Products from other Suppliers</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {similarProducts.map((p) => (
                <Link
                  key={p._id}
                  href={`/products/${p._id}`}
                  className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-40 mb-2">
                    <Image
                      src={p.images?.[0] || '/placeholder-product.jpg'}
                      alt={p.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-[#FDB913]">
                    {p.title}
                  </h4>
                  <div className="font-bold text-gray-900">
                    ₹{p.price?.discounted || p.price?.original}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {p.vendorId?.city || 'Mumbai'}
                  </div>
                  <button className="w-full mt-2 border border-[#FDB913] text-[#FDB913] text-xs font-bold py-1.5 rounded hover:bg-[#FDB913] hover:text-black transition-colors">
                    Contact Supplier
                  </button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Enquiry Modal */}
      {showEnquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden relative">
            <button
              onClick={() => setShowEnquiryModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"
            >
              ✕
            </button>

            <div className="bg-[#FDB913] p-4 text-black">
              <h3 className="text-xl font-bold">Get Best Price</h3>
              <p className="text-sm opacity-90">{product.title}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Mobile Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    className="flex-1 block w-full rounded-r-md border-gray-300 border p-2 focus:ring-[#FDB913] focus:border-[#FDB913]"
                    placeholder="Enter mobile number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  className="block w-full rounded-md border-gray-300 border p-2 focus:ring-[#FDB913] focus:border-[#FDB913]"
                  defaultValue={1}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requirement Details</label>
                <textarea
                  rows={3}
                  className="block w-full rounded-md border-gray-300 border p-2 focus:ring-[#FDB913] focus:border-[#FDB913]"
                  placeholder="Describe your requirement..."
                ></textarea>
              </div>

              <button className="w-full indiamart-btn-primary py-3 text-lg">
                Submit Requirement
              </button>

              <p className="text-xs text-center text-gray-500">
                By clicking submit you agree to our Terms & Conditions
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
