import dbConnect from './mongodb';
import Product from '@/models/Product';
import Store from '@/models/Store';
import Category from '@/models/Category';
import { cache } from 'react';

export interface ProductFilters {
    category?: string;
    vendorId?: string;
    hasOffer?: boolean;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    query?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    isActive?: boolean;
}

export interface PaginationResult {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
}

export interface ProductsResponse {
    products: any[];
    pagination: PaginationResult;
}

/**
 * Server-side function to fetch products with caching
 * Uses React's cache() for request deduplication
 */
export const getProducts = cache(async (
    filters: ProductFilters = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'createdAt'
): Promise<ProductsResponse> => {
    await dbConnect();

    const query: any = { isActive: filters.isActive ?? true };

    // Category filter
    if (filters.category) {
        query.category = filters.category;
    }

    // Vendor filter
    if (filters.vendorId) {
        query.vendorId = filters.vendorId;
    }

    // Offer filter
    if (filters.hasOffer) {
        query['offer.validUntil'] = { $gte: new Date() };
    }

    // Price range
    if (filters.minPrice !== undefined) {
        query['price.original'] = { ...query['price.original'], $gte: filters.minPrice };
    }
    if (filters.maxPrice !== undefined) {
        query['price.original'] = { ...query['price.original'], $lte: filters.maxPrice };
    }

    // Text search
    if (filters.query) {
        query.$or = [
            { title: { $regex: filters.query, $options: 'i' } },
            { description: { $regex: filters.query, $options: 'i' } },
        ];
    }

    // Sort options
    let sortOption: any = { createdAt: -1 };
    switch (sortBy) {
        case 'price_asc':
            sortOption = { 'price.original': 1 };
            break;
        case 'price_desc':
            sortOption = { 'price.original': -1 };
            break;
        case 'rating':
            sortOption = { 'analytics.rating': -1 };
            break;
        case 'popular':
            sortOption = { 'analytics.views': -1 };
            break;
    }

    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
        .populate('category', 'name slug')
        .populate('vendorId', 'shopName location logo')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        products: JSON.parse(JSON.stringify(products)),
        pagination: {
            page,
            limit,
            total,
            hasMore: skip + products.length < total,
        },
    };
});

/**
 * Get products for a specific vendor (for vendor dashboard)
 */
export const getVendorProducts = cache(async (
    vendorId: string,
    page: number = 1,
    limit: number = 20
): Promise<ProductsResponse> => {
    await dbConnect();

    const query = { vendorId };
    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
        .populate('category', 'name slug')
        .populate('subcategory', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        products: JSON.parse(JSON.stringify(products)),
        pagination: {
            page,
            limit,
            total,
            hasMore: skip + products.length < total,
        },
    };
});

/**
 * Get all products for admin (includes inactive)
 */
export const getAdminProducts = cache(async (
    page: number = 1,
    limit: number = 20,
    searchTerm?: string
): Promise<ProductsResponse> => {
    await dbConnect();

    const query: any = {};

    if (searchTerm) {
        query.$or = [
            { title: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
        ];
    }

    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
        .populate('category', 'name slug')
        .populate('vendorId', 'shopName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        products: JSON.parse(JSON.stringify(products)),
        pagination: {
            page,
            limit,
            total,
            hasMore: skip + products.length < total,
        },
    };
});

/**
 * Get categories for filtering
 */
export const getCategories = cache(async () => {
    await dbConnect();
    const categories = await Category.find({ parent: null, isActive: true })
        .sort({ name: 1 })
        .lean();
    return JSON.parse(JSON.stringify(categories));
});
