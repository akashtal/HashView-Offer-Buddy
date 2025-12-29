'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FiMapPin, FiTag, FiEye } from 'react-icons/fi';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';

interface ProductCardProps {
  product: {
    _id: string;
    title: string;
    description: string;
    images: string[];
    price?: {
      original?: number;
      discounted?: number;
      currency: string;
    };
    offer?: {
      type: string;
      value?: number;
      description: string;
      validUntil: string;
    };
    vendorId: {
      _id: string;
      shopName: string;
      shopLogo?: string;
      location: {
        city: string;
      };
    };
    distance?: number;
    analytics: {
      views: number;
    };
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const hasDiscount =
    product.price?.original && product.price?.discounted &&
    product.price.discounted < product.price.original;

  const discountPercentage = hasDiscount && product.price
    ? Math.round(
      ((product.price.original! - product.price.discounted!) /
        product.price.original!) *
      100
    )
    : 0;

  return (
    <Link href={`/products/${product._id}`}>
      <Card hoverable className="h-full">
        {/* Image */}
        <div className="relative h-48 bg-gray-100">
          <Image
            src={product.images[0] || '/placeholder-product.jpg'}
            alt={product.title}
            fill
            className="object-cover"
          />
          {product.offer && (
            <div className="absolute top-2 left-2">
              <Badge variant="danger" size="sm">
                <FiTag className="inline mr-1" />
                {product.offer.description}
              </Badge>
            </div>
          )}
          {hasDiscount && (
            <div className="absolute top-2 right-2">
              <Badge variant="success" size="sm">
                {discountPercentage}% OFF
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-lg text-secondary line-clamp-2 hover:text-primary transition-colors">
            {product.title}
          </h3>

          {/* Vendor */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {product.vendorId.shopLogo ? (
              <Image
                src={product.vendorId.shopLogo}
                alt={product.vendorId.shopName}
                width={20}
                height={20}
                className="rounded-full"
              />
            ) : (
              <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold">
                {product.vendorId.shopName[0]}
              </div>
            )}
            <span className="font-medium">{product.vendorId.shopName}</span>
          </div>

          {/* Price */}
          {product.price && (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(product.price.discounted || product.price.original || 0)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-500 line-through">
                  {formatCurrency(product.price.original!)}
                </span>
              )}
            </div>
          )}

          {/* Footer Info */}
          <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
            <div className="flex items-center gap-1">
              <FiMapPin size={14} />
              <span>
                {product.vendorId.location.city}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <FiEye size={14} />
              <span>{product.analytics.views} views</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

