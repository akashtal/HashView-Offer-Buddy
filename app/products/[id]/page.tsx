'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronRight,
  Share2,
  Heart,
  Star,
  ShoppingCart,
  Minus,
  Plus,
  CheckCircle2,
  MoreHorizontal,
  Filter,
  ChevronDown,
  MapPin
} from 'lucide-react';
import axios from 'axios';
import { useLocation } from '@/lib/LocationContext';
import { calculateDistance } from '@/lib/location-utils';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/Toast';

// Types
interface Review {
  _id: string;
  userName: string;
  rating: number;
  reviewText: string;
  isVerified: boolean;
  createdAt: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const { location } = useLocation();
  const { isAuthenticated } = useAuthStore();

  const [product, setProduct] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Tab state
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'faqs'>('reviews');

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, text: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Stores
  const { addItem } = useCartStore();
  const { toggleItem, isLiked } = useWishlistStore();
  const { showToast, ToastContainer } = useToast();

  const liked = isLiked(productId);

  // Load product data
  const loadProductData = useCallback(async () => {
    try {
      setIsLoading(true);
      const productRes = await axios.get(`/api/products/${productId}`);
      const productData = productRes.data.data.product;
      setProduct(productData);

      if (location?.coordinates && productData.vendorId?.location?.coordinates) {
        const [vendorLng, vendorLat] = productData.vendorId.location.coordinates.coordinates;
        productData.distance = calculateDistance(
          location.coordinates,
          { latitude: vendorLat, longitude: vendorLng }
        );
      }

      if (productData.category?._id) {
        const similarRes = await axios.get(`/api/products`, {
          params: { category: productData.category._id, limit: 6 },
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
  }, [productId, location]);

  // Load reviews
  const loadReviews = useCallback(async (page = 1, append = false) => {
    try {
      setReviewsLoading(true);
      const res = await axios.get('/api/reviews', {
        params: { productId, page, limit: 6 },
      });

      const { reviews: newReviews, totalReviews: total, averageRating: avg, pagination } = res.data.data;

      if (append) {
        setReviews(prev => [...prev, ...newReviews]);
      } else {
        setReviews(newReviews);
      }

      setTotalReviews(total);
      setAverageRating(avg);
      setHasMoreReviews(page < pagination.pages);
      setReviewPage(page);
      setReviewsLoading(false);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setReviewsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProductData();
    loadReviews();
  }, [productId, loadProductData, loadReviews]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product._id,
      title: product.title,
      price: product.price?.discounted || product.price?.original || 0,
      image: product.images?.[0] || '',
      vendorId: product.vendorId?._id,
    }, quantity);
    showToast(`Added ${quantity} item(s) to cart!`, 'success');
    setQuantity(1);
  };

  const handleToggleWishlist = () => {
    toggleItem(productId);
    showToast(liked ? 'Removed from wishlist' : 'Added to wishlist!', liked ? 'info' : 'success');
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to submit a review', 'error');
      return;
    }
    if (newReview.text.length < 10) {
      showToast('Review must be at least 10 characters', 'error');
      return;
    }

    try {
      setSubmittingReview(true);
      await axios.post('/api/reviews', {
        productId,
        rating: newReview.rating,
        reviewText: newReview.text,
      });
      showToast('Review submitted successfully!', 'success');
      setShowReviewForm(false);
      setNewReview({ rating: 5, text: '' });
      loadReviews(1, false);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Star Rating Component
  const StarRating = ({ rating, size = 16 }: { rating: number; size?: number }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
        />
      ))}
    </div>
  );

  // Interactive Star Rating for form
  const InteractiveStarRating = ({ rating, onChange }: { rating: number; onChange: (r: number) => void }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-1 hover:scale-110 transition-transform"
        >
          <Star
            size={28}
            className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-300'}
          />
        </button>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="container-custom">
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-gray-200 w-1/3 rounded"></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 w-3/4 rounded"></div>
                <div className="h-6 bg-gray-200 w-1/2 rounded"></div>
                <div className="h-12 bg-gray-200 w-full rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return <div className="p-12 text-center">Product not found</div>;

  const vendor = product.vendorId;
  const discountPercent = product.price?.discounted && product.price?.original
    ? Math.round((1 - product.price.discounted / product.price.original) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-white">
      <ToastContainer />

      {/* Breadcrumbs */}
      <div className="border-b border-gray-100 py-3">
        <div className="container-custom flex items-center text-sm text-gray-500 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <ChevronRight size={14} className="mx-2 text-gray-300" />
          <Link href="/products" className="hover:text-gray-900">Shop</Link>
          <ChevronRight size={14} className="mx-2 text-gray-300" />
          <Link href={`/products?category=${product.category?._id}`} className="hover:text-gray-900">
            {product.category?.name || 'Products'}
          </Link>
          <ChevronRight size={14} className="mx-2 text-gray-300" />
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.title}</span>
        </div>
      </div>

      <div className="container-custom py-6">
        {/* Main Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* Left: Image Gallery */}
          <div className="flex gap-4">
            {/* Vertical Thumbnails */}
            <div className="hidden sm:flex flex-col gap-3 w-20 flex-shrink-0">
              {product.images?.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${activeImage === idx
                    ? 'border-[#4A7C59] ring-2 ring-[#4A7C59]/20'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <div className="flex-1 relative">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                <Image
                  src={product.images?.[activeImage] || '/placeholder-product.jpg'}
                  alt={product.title}
                  fill
                  className="object-contain p-4"
                  unoptimized
                />

                {/* Wishlist & Share */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button
                    onClick={handleToggleWishlist}
                    className={`p-2.5 rounded-full shadow-md transition-all ${liked ? 'bg-red-50 text-red-500' : 'bg-white text-gray-400 hover:text-red-500'
                      }`}
                  >
                    <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => navigator.share?.({ title: product.title, url: window.location.href })}
                    className="p-2.5 bg-white rounded-full shadow-md text-gray-400 hover:text-gray-600 transition-all"
                  >
                    <Share2 size={20} />
                  </button>
                </div>

                {/* Discount Badge */}
                {discountPercent > 0 && (
                  <div className="absolute top-4 left-4 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                    -{discountPercent}%
                  </div>
                )}
              </div>

              {/* Mobile Thumbnails */}
              <div className="flex sm:hidden gap-2 mt-3 overflow-x-auto pb-2">
                {product.images?.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${activeImage === idx ? 'border-[#4A7C59]' : 'border-gray-200'
                      }`}
                  >
                    <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" unoptimized />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Product Info */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              {product.title}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                <StarRating rating={Math.round(averageRating)} size={18} />
                <span className="text-sm font-medium text-gray-700 ml-1">
                  {averageRating.toFixed(1)}/5
                </span>
              </div>
              {totalReviews > 0 && (
                <span className="text-sm text-gray-500">({totalReviews} reviews)</span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold text-gray-900">
                ₹{(product.price?.discounted || product.price?.original)?.toLocaleString()}
              </span>
              {product.price?.discounted && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    ₹{product.price.original?.toLocaleString()}
                  </span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-sm font-semibold rounded">
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>

            {/* Description Preview */}
            {product.description && (
              <p className="text-gray-600 text-sm mb-6 line-clamp-3">
                {product.description}
              </p>
            )}

            {/* Quantity & Add to Cart */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-gray-100 transition-colors text-gray-600"
                  disabled={quantity <= 1}
                >
                  <Minus size={18} />
                </button>
                <span className="px-5 py-2 min-w-[50px] text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="p-3 hover:bg-gray-100 transition-colors text-gray-600"
                  disabled={quantity >= 10}
                >
                  <Plus size={18} />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 bg-[#4A7C59] hover:bg-[#3d6b4a] text-white font-bold py-3.5 px-6 rounded-lg transition-all"
              >
                <ShoppingCart size={20} />
                ADD TO CART
              </button>
            </div>

            {/* Vendor Info */}
            {vendor && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-4">
                <div className="w-10 h-10 bg-[#4A7C59] rounded-full flex items-center justify-center text-white font-bold">
                  {vendor.shopName?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <Link href={`/vendors/${vendor._id}`} className="font-medium text-gray-900 hover:underline">
                    {vendor.shopName}
                  </Link>
                  {vendor.location?.city && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin size={12} />
                      {vendor.location.city}
                    </p>
                  )}
                </div>
                {vendor.isApproved && (
                  <CheckCircle2 size={20} className="text-green-500" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-10 border-t border-gray-200">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'details', label: 'Product Details' },
              { id: 'reviews', label: 'Rating & Reviews' },
              { id: 'faqs', label: 'FAQs' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 sm:flex-none px-6 py-4 text-sm font-medium transition-colors relative ${activeTab === tab.id
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="py-8">
            {/* Product Details Tab */}
            {activeTab === 'details' && (
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-4">Product Information</h3>
                {product.description ? (
                  <p className="text-gray-600">{product.description}</p>
                ) : (
                  <p className="text-gray-400">No detailed description available.</p>
                )}

                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {product.brand && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Brand</p>
                      <p className="font-medium">{product.brand}</p>
                    </div>
                  )}
                  {product.category && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Category</p>
                      <p className="font-medium">{product.category.name}</p>
                    </div>
                  )}
                  {product.stock && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase">Availability</p>
                      <p className={`font-medium ${product.stock.available ? 'text-green-600' : 'text-red-600'}`}>
                        {product.stock.available ? 'In Stock' : 'Out of Stock'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                {/* Reviews Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-semibold">
                    All Reviews <span className="text-gray-400 font-normal">({totalReviews})</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <Filter size={18} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Latest <ChevronDown size={16} />
                    </button>
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Write a Review
                    </button>
                  </div>
                </div>

                {/* Review Form */}
                {showReviewForm && (
                  <div className="mb-8 p-6 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold mb-4">Write Your Review</h4>
                    <div className="mb-4">
                      <label className="text-sm text-gray-600 mb-2 block">Your Rating</label>
                      <InteractiveStarRating
                        rating={newReview.rating}
                        onChange={(r) => setNewReview(prev => ({ ...prev, rating: r }))}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="text-sm text-gray-600 mb-2 block">Your Review</label>
                      <textarea
                        value={newReview.text}
                        onChange={(e) => setNewReview(prev => ({ ...prev, text: e.target.value }))}
                        placeholder="Share your experience with this product..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowReviewForm(false)}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitReview}
                        disabled={submittingReview}
                        className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Reviews Grid */}
                {reviews.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {reviews.map((review) => (
                        <div key={review._id} className="p-5 border border-gray-200 rounded-xl">
                          <div className="flex items-start justify-between mb-3">
                            <StarRating rating={review.rating} size={16} />
                            <button className="text-gray-400 hover:text-gray-600">
                              <MoreHorizontal size={18} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-semibold text-gray-900">{review.userName}</span>
                            {review.isVerified && (
                              <CheckCircle2 size={16} className="text-green-500" />
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                            &ldquo;{review.reviewText}&rdquo;
                          </p>
                          <p className="text-xs text-gray-400">
                            Posted on {new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Load More */}
                    {hasMoreReviews && (
                      <div className="text-center mt-8">
                        <button
                          onClick={() => loadReviews(reviewPage + 1, true)}
                          disabled={reviewsLoading}
                          className="px-8 py-3 border-2 border-gray-900 text-gray-900 font-medium rounded-full hover:bg-gray-900 hover:text-white transition-colors disabled:opacity-50"
                        >
                          {reviewsLoading ? 'Loading...' : 'LOAD MORE REVIEWS'}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Star size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No reviews yet. Be the first to review this product!</p>
                  </div>
                )}
              </div>
            )}

            {/* FAQs Tab */}
            {activeTab === 'faqs' && (
              <div className="text-center py-12 text-gray-500">
                <p>No FAQs available for this product yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-xl font-bold mb-6">You Might Also Like</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {similarProducts.slice(0, 5).map((p) => (
                <Link
                  key={p._id}
                  href={`/products/${p._id}`}
                  className="group bg-white border border-gray-200 rounded-xl p-3 hover:shadow-lg transition-all"
                >
                  <div className="relative aspect-square mb-3 bg-gray-50 rounded-lg overflow-hidden">
                    <Image
                      src={p.images?.[0] || '/placeholder-product.jpg'}
                      alt={p.title}
                      fill
                      className="object-contain p-2 group-hover:scale-105 transition-transform"
                      unoptimized
                    />
                    {p.offer && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        New
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleItem(p._id);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Heart size={14} className={isLiked(p._id) ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
                    </button>
                  </div>
                  <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                    {p.title}
                  </h4>
                  <div className="flex items-center gap-1 mb-1">
                    <StarRating rating={4} size={12} />
                    <span className="text-xs text-gray-500">4/5</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-gray-900">
                      ₹{(p.price?.discounted || p.price?.original)?.toLocaleString()}
                    </span>
                    {p.price?.discounted && (
                      <span className="text-xs text-gray-400 line-through">
                        ₹{p.price.original?.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      addItem({
                        productId: p._id,
                        title: p.title,
                        price: p.price?.discounted || p.price?.original || 0,
                        image: p.images?.[0] || '',
                        vendorId: p.vendorId?._id,
                      }, 1);
                      showToast('Added to cart!', 'success');
                    }}
                    className="mt-2 w-full p-2 bg-gray-100 hover:bg-[#4A7C59] hover:text-white text-gray-900 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1"
                  >
                    <ShoppingCart size={14} />
                  </button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
