'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  FiPhone,
  FiMapPin,
  FiClock,
  FiTag,
  FiEye,
  FiShare2,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import axios from 'axios';
import { useProductStore } from '@/store/productStore';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card, { CardBody } from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const { trackContact } = useProductStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const params: any = {};
        const response = await axios.get(`/api/products/${productId}`, { params });
        setProduct(response.data.data.product);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleContact = async (type: 'call' | 'whatsapp' | 'directions') => {
    await trackContact(productId, type, [0, 0]);
  };

  const handleCall = () => {
    handleContact('call');
    window.open(`tel:${product.vendorId.contactInfo.phone}`);
  };

  const handleWhatsApp = () => {
    handleContact('whatsapp');
    const phone = product.vendorId.contactInfo.whatsapp || product.vendorId.contactInfo.phone;
    const message = encodeURIComponent(`Hi! I'm interested in: ${product.title}`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleGetDirections = () => {
    handleContact('directions');
    const [lon, lat] = product.vendorId.location.coordinates;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
      '_blank'
    );
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading product..." />;
  }

  if (error || !product) {
    return (
      <div className="container-custom py-12">
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <p className="text-red-600 font-medium mb-4">
                {error || 'Product not found'}
              </p>
              <Link href="/">
                <Button variant="primary">Back to Home</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const vendor = product.vendorId;
  const hasDiscount =
    product.price?.original && product.price?.discounted &&
    product.price.discounted < product.price.original;

  return (
    <div className="bg-accent-light min-h-screen py-8">
      <div className="container-custom">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <Card>
              <div className="relative h-96 bg-gray-100">
                <Image
                  src={product.images[0]}
                  alt={product.title}
                  fill
                  className="object-contain p-4"
                />
                {product.offer && (
                  <div className="absolute top-4 left-4">
                    <Badge variant="danger" size="lg">
                      <FiTag className="inline mr-2" />
                      {product.offer.description}
                    </Badge>
                  </div>
                )}
                <button
                  onClick={handleShare}
                  className="absolute top-4 right-4 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
                >
                  <FiShare2 size={20} />
                </button>
              </div>

              {/* Thumbnail Gallery */}
              {product.images.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {product.images.map((image: string, index: number) => (
                    <div
                      key={index}
                      className="relative w-20 h-20 flex-shrink-0 border-2 border-gray-200 rounded-lg overflow-hidden hover:border-primary cursor-pointer"
                    >
                      <Image
                        src={image}
                        alt={`${product.title} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Product Details */}
            <Card>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold text-secondary mb-2">
                      {product.title}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <FiEye />
                        <span>{product.analytics.views} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiClock />
                        <span>Posted {formatRelativeTime(product.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  {product.price && (
                    <div className="py-4 border-t border-b">
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-bold text-primary">
                          {formatCurrency(product.price.discounted || product.price.original)}
                        </span>
                        {hasDiscount && (
                          <>
                            <span className="text-xl text-gray-500 line-through">
                              {formatCurrency(product.price.original!)}
                            </span>
                            <Badge variant="success">
                              {Math.round(
                                ((product.price.original! - product.price.discounted!) /
                                  product.price.original!) *
                                100
                              )}
                              % OFF
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Offer Details */}
                  {product.offer && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h3 className="font-semibold text-secondary mb-2">
                        Special Offer
                      </h3>
                      <p className="text-gray-700">{product.offer.description}</p>
                      <p className="text-sm text-gray-600 mt-2">
                        Valid until: {new Date(product.offer.validUntil).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <h3 className="font-semibold text-lg text-secondary mb-2">
                      Description
                    </h3>
                    <p className="text-gray-700 whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>

                  {/* Tags */}
                  {product.tags && product.tags.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg text-secondary mb-2">
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag: string) => (
                          <Badge key={tag} variant="info">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vendor Info */}
            <Card>
              <CardBody>
                <div className="space-y-4">
                  <div className="text-center">
                    {vendor.shopLogo ? (
                      <div className="relative w-20 h-20 mx-auto mb-3">
                        <Image
                          src={vendor.shopLogo}
                          alt={vendor.shopName}
                          fill
                          className="object-cover rounded-full"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 mx-auto mb-3 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-3xl font-bold text-primary">
                          {vendor.shopName[0]}
                        </span>
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-secondary">
                      {vendor.shopName}
                    </h3>
                    {vendor.rating && (
                      <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                        <span>⭐ {vendor.rating.toFixed(1)}</span>
                        <span>({vendor.totalReviews} reviews)</span>
                      </div>
                    )}
                  </div>



                  {/* Contact Buttons */}
                  <div className="space-y-3">
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleCall}
                    >
                      <FiPhone className="inline mr-2" />
                      Call Now
                    </Button>

                    {(vendor.contactInfo.whatsapp || vendor.contactInfo.phone) && (
                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={handleWhatsApp}
                      >
                        <FaWhatsapp className="inline mr-2" />
                        WhatsApp
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      fullWidth
                      onClick={handleGetDirections}
                    >
                      <FiMapPin className="inline mr-2" />
                      Get Directions
                    </Button>
                  </div>

                  {/* Address */}
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold text-secondary mb-2">Address</h4>
                    <p className="text-sm text-gray-600">
                      {vendor.location.address}
                      <br />
                      {vendor.location.city}, {vendor.location.state}
                      <br />
                      {vendor.location.pincode}
                    </p>
                  </div>

                  {/* Business Hours */}
                  {vendor.businessHours && vendor.businessHours.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold text-secondary mb-2">
                        Business Hours
                      </h4>
                      <div className="space-y-1 text-sm">
                        {vendor.businessHours.map((hours: any, index: number) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-gray-600">{hours.day}</span>
                            <span className="text-secondary font-medium">
                              {hours.isClosed
                                ? 'Closed'
                                : `${hours.openTime} - ${hours.closeTime}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View Shop Button */}
                  <Link href={`/vendors/${vendor._id}`}>
                    <Button variant="ghost" fullWidth>
                      View Shop Profile
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>

            {/* Safety Tips */}
            <Card>
              <CardBody>
                <h4 className="font-semibold text-secondary mb-3">Safety Tips</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>✓ Visit the shop during business hours</li>
                  <li>✓ Verify the offer details before purchasing</li>
                  <li>✓ Check product quality in person</li>
                  <li>✓ Get a receipt for your purchase</li>
                </ul>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

