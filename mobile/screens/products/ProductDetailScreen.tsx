import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, Image, TouchableOpacity, ScrollView, 
  ActivityIndicator, StyleSheet, TextInput, Share, Dimensions 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import { useLocation } from '@/context/LocationContext';
import { calculateDistance } from '@/utils/location-utils';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import ChatButton from '@/components/chat/ChatButton';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

// Types
interface Review {
  _id: string;
  userName: string;
  rating: number;
  reviewText: string;
  isVerified: boolean;
  createdAt: string;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const productId = id as string;
  const router = useRouter();
  
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

  const liked = isLiked(productId);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    Toast.show({ type, text1: message });
  };

  // Load product data
  const loadProductData = useCallback(async () => {
    try {
      setIsLoading(true);
      const productRes = await axios.get(`/api/products/${productId}`);
      const productData = productRes.data.data.product;
      setProduct(productData);

      if (location?.coordinates && productData.vendorId?.location?.coordinates) {
        let vendorLng, vendorLat;
        const coords = productData.vendorId.location.coordinates;

        if (Array.isArray(coords)) {
          [vendorLng, vendorLat] = coords;
        } else if (coords?.coordinates && Array.isArray(coords.coordinates)) {
          [vendorLng, vendorLat] = coords.coordinates;
        }

        if (typeof vendorLng === 'number' && typeof vendorLat === 'number') {
          productData.distance = calculateDistance(
            location.coordinates,
            { latitude: vendorLat, longitude: vendorLng }
          );
        }
      }

      if (productData.category?._id) {
        const similarParams: any = { category: productData.category._id, limit: 6 };
        if (location?.coordinates) {
          similarParams.latitude = location.coordinates.latitude;
          similarParams.longitude = location.coordinates.longitude;
        }
        const similarRes = await axios.get(`/api/products`, {
          params: similarParams,
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

  const shareProduct = async () => {
    try {
      await Share.share({
        message: `Check out ${product.title}!`,
        url: `https://hashview.com/products/${product._id}` // example domain
      });
    } catch (error) {
      console.log(error);
    }
  };

  const StarRating = ({ rating, size = 16 }: { rating: number; size?: number }) => (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <FontAwesome
          key={star}
          name="star"
          size={size}
          color={star <= rating ? '#FACC15' : '#D1D5DB'}
          style={styles.starMargin}
        />
      ))}
    </View>
  );

  const InteractiveStarRating = ({ rating, onChange }: { rating: number; onChange: (r: number) => void }) => (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange(star)} style={styles.starMargin}>
          <FontAwesome
            name="star"
            size={28}
            color={star <= rating ? '#FACC15' : '#D1D5DB'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A7C59" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>Product not found</Text>
      </View>
    );
  }

  const vendor = product.vendorId;
  const discountPercent = product.price?.discounted && product.price?.original
    ? Math.round((1 - product.price.discounted / product.price.original) * 100)
    : 0;

  return (
    <View style={styles.container}>
      {/* Header Breadcrumbs replacement */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerText} numberOfLines={1}>{product.title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Image */}
        <View style={styles.imageContainer}>
            <Image
                source={{ uri: product.images?.[activeImage] || 'https://via.placeholder.com/400' }}
                style={styles.mainImage}
                resizeMode="contain"
            />
            {/* Wishlist & Share */}
            <View style={styles.imageActions}>
                <TouchableOpacity onPress={handleToggleWishlist} style={styles.actionButton}>
                    <FontAwesome name={liked ? "heart" : "heart-o"} size={20} color={liked ? "#EF4444" : "#9CA3AF"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={shareProduct} style={styles.actionButton}>
                    <Feather name="share-2" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>
            {discountPercent > 0 && (
                <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>-{discountPercent}%</Text>
                </View>
            )}
        </View>

        {/* Thumbnails */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailsContainer}>
            {product.images?.map((img: string, idx: number) => (
                <TouchableOpacity
                    key={idx}
                    onPress={() => setActiveImage(idx)}
                    style={[styles.thumbnailButton, activeImage === idx && styles.thumbnailActive]}
                >
                    <Image source={{ uri: img }} style={styles.thumbnailImage} resizeMode="cover" />
                </TouchableOpacity>
            ))}
        </ScrollView>

        <View style={styles.productInfo}>
            <Text style={styles.productTitle}>{product.title}</Text>
            
            {/* Rating */}
            <View style={styles.ratingRow}>
                <StarRating rating={Math.round(averageRating)} size={18} />
                <Text style={styles.ratingValue}>{averageRating.toFixed(1)}/5</Text>
                {totalReviews > 0 && (
                    <Text style={styles.totalReviews}>({totalReviews} reviews)</Text>
                )}
            </View>

            {/* Price */}
            <View style={styles.priceRow}>
                <Text style={styles.currentPrice}>
                    ₹{(product.price?.discounted || product.price?.original)?.toLocaleString()}
                </Text>
                {product.price?.discounted && (
                    <>
                        <Text style={styles.originalPrice}>₹{product.price.original?.toLocaleString()}</Text>
                        <View style={styles.savedBadge}>
                            <Text style={styles.savedBadgeText}>-{discountPercent}%</Text>
                        </View>
                    </>
                )}
            </View>

            {product.description && (
                <Text style={styles.descriptionText} numberOfLines={3}>{product.description}</Text>
            )}

            {/* Quantity */}
            <View style={styles.cartActionRow}>
                <View style={styles.quantityBox}>
                    <TouchableOpacity 
                        onPress={() => setQuantity(Math.max(1, quantity - 1))}
                        style={styles.quantityBtn}
                        disabled={quantity <= 1}
                    >
                        <Feather name="minus" size={18} color="#4B5563" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <TouchableOpacity 
                        onPress={() => setQuantity(Math.min(10, quantity + 1))}
                        style={styles.quantityBtn}
                        disabled={quantity >= 10}
                    >
                        <Feather name="plus" size={18} color="#4B5563" />
                    </TouchableOpacity>
                </View>
                
                <TouchableOpacity onPress={handleAddToCart} style={styles.addToCartBtn}>
                    <Feather name="shopping-cart" size={20} color="#FFF" style={styles.cartBtnIcon} />
                    <Text style={styles.addToCartText}>ADD TO CART</Text>
                </TouchableOpacity>
            </View>

            {/* Vendor Info */}
            {vendor && (
                <View style={styles.vendorBox}>
                    <View style={styles.vendorAvatar}>
                        <Text style={styles.vendorAvatarText}>{vendor.shopName?.[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={styles.vendorDetails}>
                        <TouchableOpacity onPress={() => router.push(`/vendors/${vendor._id}` as any)}>
                            <Text style={styles.vendorName}>{vendor.shopName}</Text>
                        </TouchableOpacity>
                        {vendor.location?.city && (
                            <View style={styles.vendorLocationRow}>
                                <Feather name="map-pin" size={12} color="#6B7280" />
                                <Text style={styles.vendorLocationText}>{vendor.location.city}</Text>
                            </View>
                        )}
                    </View>
                    {vendor.isApproved && <Feather name="check-circle" size={20} color="#22C55E" />}
                    
                    <View style={styles.chatBtnWrap}>
                        <ChatButton
                            recipientId={vendor._id}
                            recipientModel="Vendor"
                            recipientName={vendor.shopName}
                        />
                    </View>
                </View>
            )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsSection}>
            <View style={styles.tabHeaders}>
                {[
                  { id: 'details', label: 'Product Details' },
                  { id: 'reviews', label: 'Rating & Reviews' },
                  { id: 'faqs', label: 'FAQs' }
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => setActiveTab(tab.id as any)}
                        style={[styles.tabBtn, activeTab === tab.id && styles.activeTabBtn]}
                    >
                        <Text style={[styles.tabBtnText, activeTab === tab.id && styles.activeTabBtnText]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.tabContent}>
                {activeTab === 'details' && (
                    <View>
                        <Text style={styles.tabTitle}>Product Information</Text>
                        <Text style={styles.tabBodyText}>
                            {product.description || 'No detailed description available.'}
                        </Text>
                        
                        <View style={styles.metaGrid}>
                            {product.brand && (
                                <View style={styles.metaBox}>
                                    <Text style={styles.metaLabel}>BRAND</Text>
                                    <Text style={styles.metaValue}>{product.brand}</Text>
                                </View>
                            )}
                            {product.category && (
                                <View style={styles.metaBox}>
                                    <Text style={styles.metaLabel}>CATEGORY</Text>
                                    <Text style={styles.metaValue}>{product.category.name}</Text>
                                </View>
                            )}
                            {product.stock && (
                                <View style={styles.metaBox}>
                                    <Text style={styles.metaLabel}>AVAILABILITY</Text>
                                    <Text style={[styles.metaValue, product.stock.available ? styles.textGreen : styles.textRed]}>
                                        {product.stock.available ? 'In Stock' : 'Out of Stock'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {activeTab === 'reviews' && (
                    <View>
                        <View style={styles.reviewsHeaderRow}>
                            <Text style={styles.tabTitle}>All Reviews <Text style={styles.reviewsCount}>({totalReviews})</Text></Text>
                            <TouchableOpacity onPress={() => setShowReviewForm(true)} style={styles.writeReviewBtn}>
                                <Text style={styles.writeReviewBtnText}>Write a Review</Text>
                            </TouchableOpacity>
                        </View>

                        {showReviewForm && (
                            <View style={styles.reviewFormBox}>
                                <Text style={styles.formTitle}>Write Your Review</Text>
                                <Text style={styles.formLabel}>Your Rating</Text>
                                <InteractiveStarRating 
                                    rating={newReview.rating} 
                                    onChange={(r) => setNewReview(prev => ({...prev, rating: r}))} 
                                />
                                <Text style={[styles.formLabel, {marginTop: 16}]}>Your Review</Text>
                                <TextInput
                                    style={styles.reviewInput}
                                    multiline
                                    numberOfLines={4}
                                    value={newReview.text}
                                    onChangeText={(t) => setNewReview(prev => ({...prev, text: t}))}
                                    placeholder="Share your experience..."
                                    textAlignVertical="top"
                                />
                                <View style={styles.formActionRow}>
                                    <TouchableOpacity onPress={() => setShowReviewForm(false)} style={styles.cancelBtn}>
                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={handleSubmitReview} 
                                        disabled={submittingReview}
                                        style={styles.submitBtn}
                                    >
                                        <Text style={styles.submitBtnText}>
                                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {reviews.length > 0 ? (
                            <View style={styles.reviewsList}>
                                {reviews.map(review => (
                                    <View key={review._id} style={styles.reviewCard}>
                                        <View style={styles.reviewCardTop}>
                                            <StarRating rating={review.rating} />
                                            <Feather name="more-horizontal" size={18} color="#9CA3AF" />
                                        </View>
                                        <View style={styles.reviewUserRow}>
                                            <Text style={styles.reviewUserName}>{review.userName}</Text>
                                            {review.isVerified && <Feather name="check-circle" size={14} color="#22C55E" />}
                                        </View>
                                        <Text style={styles.reviewBody}>"{review.reviewText}"</Text>
                                        <Text style={styles.reviewDate}>
                                            Posted on {new Date(review.createdAt).toLocaleDateString()}
                                        </Text>
                                    </View>
                                ))}
                                {hasMoreReviews && (
                                    <TouchableOpacity onPress={() => loadReviews(reviewPage + 1, true)} style={styles.loadMoreBtn}>
                                        <Text style={styles.loadMoreBtnText}>{reviewsLoading ? 'Loading...' : 'LOAD MORE REVIEWS'}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <View style={styles.emptyReviews}>
                                <FontAwesome name="star" size={48} color="#D1D5DB" />
                                <Text style={styles.emptyReviewsText}>No reviews yet. Be the first to review this product!</Text>
                            </View>
                        )}
                    </View>
                )}

                {activeTab === 'faqs' && (
                    <View style={styles.emptyReviews}>
                        <Text style={styles.emptyReviewsText}>No FAQs available for this product yet.</Text>
                    </View>
                )}
            </View>
        </View>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
            <View style={styles.similarSection}>
                <Text style={styles.similarTitle}>You Might Also Like</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {similarProducts.map((p) => {
                        const isSimLiked = isLiked(p._id);
                        const simDiscount = p.price?.discounted && p.price?.original
                            ? Math.round((1 - p.price.discounted / p.price.original) * 100)
                            : 0;

                        return (
                            <TouchableOpacity key={p._id} onPress={() => router.push(`/products/${p._id}`)} style={styles.similarCard}>
                                <View style={styles.simImgBox}>
                                    <Image source={{ uri: p.images?.[0] || 'https://via.placeholder.com/200' }} style={styles.simImg} />
                                    {p.offer && (
                                        <View style={styles.simOfferBadge}>
                                            <Text style={styles.simOfferText}>New</Text>
                                        </View>
                                    )}
                                    <TouchableOpacity onPress={() => { toggleItem(p._id); }} style={styles.simLikeBtn}>
                                        <FontAwesome name={isSimLiked ? "heart" : "heart-o"} size={14} color={isSimLiked ? "#EF4444" : "#9CA3AF"} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.simTitle} numberOfLines={2}>{p.title}</Text>
                                <View style={styles.simRatingRow}>
                                    <StarRating rating={4} size={10} />
                                    <Text style={styles.simRatingText}>4/5</Text>
                                </View>
                                <View style={styles.simPriceRow}>
                                    <Text style={styles.simPriceCurrent}>₹{(p.price?.discounted || p.price?.original)?.toLocaleString()}</Text>
                                    {p.price?.discounted && (
                                        <Text style={styles.simPriceOld}>₹{p.price.original?.toLocaleString()}</Text>
                                    )}
                                </View>
                                <TouchableOpacity 
                                    onPress={() => {
                                        addItem({
                                            productId: p._id,
                                            title: p.title,
                                            price: p.price?.discounted || p.price?.original || 0,
                                            image: p.images?.[0] || '',
                                            vendorId: p.vendorId?._id,
                                        }, 1);
                                        showToast('Added to cart!', 'success');
                                    }}
                                    style={styles.simAddBtn}
                                >
                                    <Feather name="shopping-cart" size={14} color="#111827" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        )}
      </ScrollView>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  messageText: { fontSize: 16, color: '#6B7280' },
  
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  backButton: { marginRight: 16 },
  headerText: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1 },
  scrollContent: { paddingBottom: 40 },

  imageContainer: { width: width, height: width, backgroundColor: '#F9FAFB', position: 'relative' },
  mainImage: { width: '100%', height: '100%' },
  imageActions: { position: 'absolute', top: 16, right: 16, gap: 8 },
  actionButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  discountBadge: { position: 'absolute', top: 16, left: 16, backgroundColor: '#16A34A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  discountBadgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  thumbnailsContainer: { paddingHorizontal: 16, marginTop: 12, flexDirection: 'row' },
  thumbnailButton: { width: 64, height: 64, borderRadius: 8, borderWidth: 2, borderColor: '#F3F4F6', marginRight: 8, overflow: 'hidden' },
  thumbnailActive: { borderColor: '#4A7C59' },
  thumbnailImage: { width: '100%', height: '100%' },

  productInfo: { padding: 16 },
  productTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  ratingValue: { fontSize: 14, fontWeight: '500', color: '#374151', marginLeft: 4 },
  totalReviews: { fontSize: 14, color: '#6B7280', marginLeft: 4 },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  currentPrice: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginRight: 12 },
  originalPrice: { fontSize: 18, color: '#9CA3AF', textDecorationLine: 'line-through', marginRight: 8 },
  savedBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  savedBadgeText: { color: '#15803D', fontSize: 14, fontWeight: '600' },

  descriptionText: { fontSize: 14, color: '#4B5563', marginBottom: 24, lineHeight: 20 },

  cartActionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  quantityBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, marginRight: 16 },
  quantityBtn: { padding: 12 },
  quantityText: { fontSize: 16, fontWeight: 'bold', minWidth: 30, textAlign: 'center' },
  addToCartBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4A7C59', borderRadius: 8, paddingVertical: 14 },
  cartBtnIcon: { marginRight: 8 },
  addToCartText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  vendorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 8 },
  vendorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4A7C59', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  vendorAvatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  vendorDetails: { flex: 1 },
  vendorName: { fontSize: 16, fontWeight: '500', color: '#111827' },
  vendorLocationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  vendorLocationText: { fontSize: 12, color: '#6B7280', marginLeft: 4 },
  chatBtnWrap: { marginLeft: 16 },
  chatButtonOverride: { backgroundColor: '#4A7C59', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },

  tabsSection: { marginTop: 24, borderTopWidth: 1, borderColor: '#E5E7EB' },
  tabHeaders: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#E5E7EB' },
  tabBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
  activeTabBtn: { borderColor: '#111827' },
  tabBtnText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  activeTabBtnText: { color: '#111827' },
  
  tabContent: { padding: 16 },
  tabTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 12 },
  tabBodyText: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 24, marginHorizontal: -4 },
  metaBox: { width: '33.33%', padding: 4 },
  metaLabel: { fontSize: 10, color: '#6B7280', marginBottom: 4 },
  metaValue: { fontSize: 14, fontWeight: '500', color: '#111827' },
  textGreen: { color: '#16A34A' },
  textRed: { color: '#DC2626' },

  reviewsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  reviewsCount: { color: '#9CA3AF', fontWeight: 'normal' },
  writeReviewBtn: { backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  writeReviewBtnText: { color: '#FFF', fontSize: 14, fontWeight: '500' },
  
  reviewFormBox: { backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, marginBottom: 24 },
  formTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  formLabel: { fontSize: 12, color: '#4B5563', marginBottom: 8 },
  reviewInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 14, height: 100 },
  formActionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { color: '#374151', fontWeight: '500' },
  submitBtn: { flex: 1, backgroundColor: '#111827', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontWeight: '500' },

  reviewsList: { gap: 16 },
  reviewCard: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16 },
  reviewCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  reviewUserRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  reviewUserName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  reviewBody: { fontSize: 14, color: '#4B5563', marginBottom: 8 },
  reviewDate: { fontSize: 12, color: '#9CA3AF' },

  loadMoreBtn: { marginTop: 24, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 12, borderWidth: 2, borderColor: '#111827', borderRadius: 24 },
  loadMoreBtnText: { fontSize: 14, fontWeight: '600', color: '#111827' },

  emptyReviews: { alignItems: 'center', paddingVertical: 48 },
  emptyReviewsText: { color: '#6B7280', fontSize: 14, marginTop: 16 },

  starRow: { flexDirection: 'row', gap: 2 },
  starMargin: { marginHorizontal: 1 },

  similarSection: { padding: 16, borderTopWidth: 1, borderColor: '#E5E7EB', marginTop: 24 },
  similarTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  similarCard: { width: 160, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, marginRight: 16 },
  simImgBox: { height: 130, backgroundColor: '#F9FAFB', borderRadius: 8, marginBottom: 12, padding: 8, position: 'relative' },
  simImg: { width: '100%', height: '100%', resizeMode: 'contain' },
  simOfferBadge: { position: 'absolute', top: 4, left: 4, backgroundColor: '#EF4444', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  simOfferText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  simLikeBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: '#FFF', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  simTitle: { fontSize: 12, fontWeight: '500', color: '#111827', marginBottom: 4 },
  simRatingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  simRatingText: { fontSize: 10, color: '#6B7280', marginLeft: 4 },
  simPriceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  simPriceCurrent: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginRight: 4 },
  simPriceOld: { fontSize: 10, color: '#9CA3AF', textDecorationLine: 'line-through' },
  simAddBtn: { backgroundColor: '#F3F4F6', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
});
