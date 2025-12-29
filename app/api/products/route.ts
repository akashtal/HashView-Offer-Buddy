import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Vendor from '@/models/Vendor';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest } from '@/lib/auth';
import { createProductSchema } from '@/lib/validation';

// GET - Get all products with location filtering
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);

    // Location parameters
    const latitude = parseFloat(searchParams.get('latitude') || '0');
    const longitude = parseFloat(searchParams.get('longitude') || '0');
    const radius = parseFloat(searchParams.get('radius') || '5'); // km

    // Filter parameters
    const category = searchParams.get('category');
    const query = searchParams.get('query');
    const hasOffer = searchParams.get('hasOffer') === 'true';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Sort
    const sortBy = searchParams.get('sortBy') || 'distance';

    // Build query for products
    const productQuery: any = { isActive: true };

    if (category) {
      productQuery.category = category;
    }

    if (query) {
      productQuery.$text = { $search: query };
    }

    if (hasOffer) {
      productQuery.offer = { $exists: true };
      productQuery['offer.validUntil'] = { $gte: new Date() };
    }

    if (minPrice || maxPrice) {
      productQuery['price.discounted'] = {};
      if (minPrice) productQuery['price.discounted'].$gte = parseFloat(minPrice);
      if (maxPrice) productQuery['price.discounted'].$lte = parseFloat(maxPrice);
    }

    // Find products
    let products = await Product.find(productQuery)
      .populate('category', 'name slug icon')
      .populate('vendorId', 'shopName shopLogo location contactInfo rating')
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate distance if coordinates provided
    if (latitude && longitude) {
      products = products.map((product: any) => {
        const vendor = product.vendorId;
        if (vendor?.location?.coordinates?.coordinates) {
          const [vendorLng, vendorLat] = vendor.location.coordinates.coordinates;
          product.distance = calculateDistance(latitude, longitude, vendorLat, vendorLng);
        }
        return product;
      });

      // Sort by distance if coordinates provided
      if (sortBy === 'distance' || sortBy === 'newest') {
        products.sort((a: any, b: any) => {
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
          return 0;
        });
      }
    }

    // Sort by other criteria if no location or different sortBy
    if (!latitude || !longitude || sortBy !== 'distance') {
      if (sortBy === 'newest') {
        products.sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else if (sortBy === 'popular') {
        products.sort((a: any, b: any) =>
          (b.analytics?.views || 0) - (a.analytics?.views || 0)
        );
      } else if (sortBy === 'price_low') {
        products.sort((a: any, b: any) =>
          (a.price?.discounted || a.price?.original || 0) - (b.price?.discounted || b.price?.original || 0)
        );
      } else if (sortBy === 'price_high') {
        products.sort((a: any, b: any) =>
          (b.price?.discounted || b.price?.original || 0) - (a.price?.discounted || a.price?.original || 0)
        );
      }
    }

    // Get total count
    const total = await Product.countDocuments(productQuery);

    return NextResponse.json(
      apiSuccess({
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      apiError('Failed to fetch products'),
      { status: 500 }
    );
  }
}

// POST - Create product (Vendor only)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Check authentication
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'vendor') {
      return NextResponse.json(
        apiError('Unauthorized. Only vendors can create products.'),
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = createProductSchema.parse(body);

    // Get vendor
    const vendor = await Vendor.findOne({ userId: user.userId, isActive: true });
    if (!vendor) {
      return NextResponse.json(
        apiError('Vendor profile not found. Please create your shop profile first.'),
        { status: 404 }
      );
    }

    if (!vendor.isApproved) {
      return NextResponse.json(
        apiError('Your vendor account is pending approval.'),
        { status: 403 }
      );
    }

    // Create product
    console.log('Creating product with data:', { ...validatedData, vendorId: vendor._id });
    try {
      const product = await Product.create({
        ...validatedData,
        vendorId: vendor._id,
      });

      // Update vendor's product count
      await Vendor.findByIdAndUpdate(vendor._id, {
        $inc: { 'analytics.totalProducts': 1 },
      });

      const populatedProduct = await Product.findById(product._id)
        .populate('category', 'name slug icon')
        .populate('vendorId', 'shopName shopLogo location');

      return NextResponse.json(
        apiSuccess(
          { product: populatedProduct },
          'Product created successfully'
        ),
        { status: 201 }
      );
    } catch (innerError: any) {
      console.log('Database operation failed');
      throw innerError;
    }
  } catch (error: any) {
    // Safely log error
    console.error('Create product error message:', error?.message);
    if (error?.stack) console.error('Create product error stack:', error.stack);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        apiError(error.errors[0].message),
        { status: 400 }
      );
    }

    return NextResponse.json(
      apiError('Failed to create product'),
      { status: 500 }
    );
  }
}

// Helper function to calculate distance
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

