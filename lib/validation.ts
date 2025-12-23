import { z } from 'zod';

// User Schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.enum(['user', 'vendor']).default('user'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
  location: z
    .object({
      coordinates: z.tuple([z.number(), z.number()]),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      pincode: z.string().optional(),
    })
    .optional(),
  preferences: z
    .object({
      radius: z.number().min(1).max(100).optional(),
      categories: z.array(z.string()).optional(),
    })
    .optional(),
});

// Vendor Schemas
export const createVendorSchema = z.object({
  shopName: z.string().min(2, 'Shop name is required').max(200),
  shopDescription: z.string().max(1000).optional(),
  shopLogo: z.string().optional(),
  shopImages: z.array(z.string()).optional(),
  category: z.string().min(1, 'Category is required'),
  location: z.object({
    coordinates: z.tuple([z.number(), z.number()]),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    country: z.string().default('India'),
    pincode: z.string().min(1, 'Pincode is required'),
  }),
  contactInfo: z.object({
    phone: z.string().min(10, 'Valid phone number is required'),
    whatsapp: z.string().optional(),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
  }),
  businessHours: z
    .array(
      z.object({
        day: z.enum([
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ]),
        openTime: z.string(),
        closeTime: z.string(),
        isClosed: z.boolean().default(false),
      })
    )
    .optional(),
});

export const updateVendorSchema = createVendorSchema.partial();

// Product Schemas
export const createProductSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  images: z.array(z.string()).min(1, 'At least one image is required'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  price: z
    .object({
      original: z.number().positive().optional(),
      discounted: z.number().positive().optional(),
      currency: z.string().default('INR'),
    })
    .optional(),
  offer: z
    .object({
      type: z.enum(['percentage', 'flat', 'bogo', 'other']),
      value: z.number().positive().optional(),
      description: z.string().min(1, 'Offer description is required'),
      validFrom: z.string().or(z.date()),
      validUntil: z.string().or(z.date()),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  stock: z
    .object({
      available: z.boolean().default(true),
      quantity: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

export const updateProductSchema = createProductSchema.partial();

// Category Schema
export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name is required').max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  parentCategory: z.string().optional(),
  order: z.number().int().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

// Search and Filter Schemas
export const locationQuerySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().min(1).max(100).default(5),
});

export const productSearchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  radius: z.number().min(1).max(100).default(5),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  hasOffer: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['newest', 'popular', 'distance', 'price']).default('distance'),
});

// Analytics Schema
export const trackAnalyticsSchema = z.object({
  vendorId: z.string().min(1),
  productId: z.string().optional(),
  type: z.enum(['view', 'contact', 'call', 'whatsapp', 'directions']),
  userLocation: z
    .object({
      coordinates: z.tuple([z.number(), z.number()]),
    })
    .optional(),
});

