import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
import Product from '@/models/Product';
import Vendor from '@/models/Vendor';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest } from '@/lib/auth';
import { createProductSchema } from '@/lib/validation';

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;

// GET - Get all products with location filtering using MongoDB geospatial queries
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);

    // Location parameters
    const latitude = parseFloat(searchParams.get('latitude') || '0');
    const longitude = parseFloat(searchParams.get('longitude') || '0');
    const radiusKm = parseFloat(searchParams.get('radius') || '10000000'); // Default 10M km to show all products (even those with no location)
    const maxRadius = radiusKm; // Removed 100km cap to allow finding distant products

    // Filter parameters
    const category = searchParams.get('category');
    const query = searchParams.get('query');
    const hasOffer = searchParams.get('hasOffer') === 'true';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Sort
    const sortBy = searchParams.get('sortBy') || 'distance';

    // Use geospatial aggregation if location is provided
    if (latitude && longitude) {
      const radiusInMeters = maxRadius * 1000; // Convert km to meters

      const pipeline: any[] = [
        // Stage 1: Lookup vendors with their location data
        {
          $lookup: {
            from: 'vendors',
            localField: 'vendorId',
            foreignField: '_id',
            as: 'vendor'
          }
        },
        {
          $unwind: {
            path: '$vendor',
            preserveNullAndEmptyArrays: true
          }
        },
        // Stage 2: Add distance calculation field
        {
          $addFields: {
            distance: {
              $cond: {
                if: {
                  $and: [
                    { $ifNull: ['$vendor.location.coordinates.coordinates', false] },
                    { $isArray: '$vendor.location.coordinates.coordinates' }
                  ]
                },
                then: {
                  $let: {
                    vars: {
                      lon1: { $multiply: [longitude, Math.PI / 180] },
                      lat1: { $multiply: [latitude, Math.PI / 180] },
                      lon2: { $multiply: [{ $arrayElemAt: ['$vendor.location.coordinates.coordinates', 0] }, Math.PI / 180] },
                      lat2: { $multiply: [{ $arrayElemAt: ['$vendor.location.coordinates.coordinates', 1] }, Math.PI / 180] }
                    },
                    in: {
                      $multiply: [
                        6371, // Earth's radius in km
                        {
                          $multiply: [
                            2,
                            {
                              $asin: {
                                $sqrt: {
                                  $add: [
                                    {
                                      $pow: [
                                        { $sin: { $divide: [{ $subtract: ['$$lat2', '$$lat1'] }, 2] } },
                                        2
                                      ]
                                    },
                                    {
                                      $multiply: [
                                        { $cos: '$$lat1' },
                                        { $cos: '$$lat2' },
                                        {
                                          $pow: [
                                            { $sin: { $divide: [{ $subtract: ['$$lon2', '$$lon1'] }, 2] } },
                                            2
                                          ]
                                        }
                                      ]
                                    }
                                  ]
                                }
                              }
                            }
                          ]
                        }
                      ]
                    }
                  }
                },
                else: 999999 // Very high distance for items without location
              }
            }
          }
        },
        // Stage 3: Filter by radius - REMOVED to show all products sorted by distance
        // {
        //   $match: {
        //     distance: { $lte: maxRadius }
        //   }
        // }
      ];

      // Add product filters
      const matchStage: any = {
        isActive: true
      };

      if (category) {
        matchStage.category = { $eq: require('mongoose').Types.ObjectId(category) };
      }

      if (hasOffer) {
        matchStage.offer = { $exists: true };
        matchStage['offer.validUntil'] = { $gte: new Date() };
      }

      if (minPrice || maxPrice) {
        matchStage['price.discounted'] = {};
        if (minPrice) matchStage['price.discounted'].$gte = parseFloat(minPrice);
        if (maxPrice) matchStage['price.discounted'].$lte = parseFloat(maxPrice);
      }

      if (query) {
        matchStage.$text = { $search: query };
      }

      // Insert match stage at the beginning
      pipeline.unshift({ $match: matchStage });

      // Stage 4: Sort
      if (sortBy === 'distance') {
        pipeline.push({ $sort: { distance: 1, createdAt: -1 } });
      } else if (sortBy === 'newest') {
        pipeline.push({ $sort: { createdAt: -1 } });
      } else if (sortBy === 'popular') {
        pipeline.push({ $sort: { 'analytics.views': -1 } });
      } else if (sortBy === 'price_low') {
        pipeline.push({ $sort: { 'price.discounted': 1, 'price.original': 1 } });
      } else if (sortBy === 'price_high') {
        pipeline.push({ $sort: { 'price.discounted': -1, 'price.original': -1 } });
      }

      // Stage 5: Pagination
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      // Stage 6: Populate references
      pipeline.push(
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $unwind: {
            path: '$category',
            preserveNullAndEmptyArrays: true
          }
        },
        // Replace vendor array with single vendor object and keep distance
        {
          $addFields: {
            vendorId: '$vendor'
          }
        },
        {
          $project: {
            vendor: 0 // Remove the temporary vendor field
          }
        }
      );

      const products = await Product.aggregate(pipeline);

      // Get total count for pagination
      const countPipeline = pipeline.slice(0, -3); // Remove skip, limit, and final stages
      countPipeline.push({ $count: 'total' });
      const countResult = await Product.aggregate(countPipeline);
      const total = countResult[0]?.total || 0;

      return NextResponse.json(
        apiSuccess({
          products,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
          location: {
            latitude,
            longitude,
            radius: maxRadius
          }
        }),
        { status: 200 }
      );
    } else {
      // No location provided - fallback to simple query
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

      let sortOptions: any = {};
      if (sortBy === 'newest') {
        sortOptions = { createdAt: -1 };
      } else if (sortBy === 'popular') {
        sortOptions = { 'analytics.views': -1 };
      } else if (sortBy === 'price_low') {
        sortOptions = { 'price.discounted': 1, 'price.original': 1 };
      } else if (sortBy === 'price_high') {
        sortOptions = { 'price.discounted': -1, 'price.original': -1 };
      }

      const products = await Product.find(productQuery)
        .populate('category', 'name slug icon')
        .populate('vendorId', 'shopName shopLogo location contactInfo rating')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean();

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
    }
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

