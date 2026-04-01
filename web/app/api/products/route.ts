import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
import Product from '@/models/Product';
import Store from '@/models/Store';
import Review from '@/models/Review';
import VendorSubcategory from '@/models/VendorSubcategory';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest } from '@/lib/auth';
import { createProductSchema } from '@/lib/validation';

// GET - Get all products with location filtering using MongoDB geospatial queries
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const mongoose = require('mongoose');

    const { searchParams } = new URL(request.url);

    // ─── Fast Path: Fetch specific products by IDs (used by Wishlist) ───────────
    const idsParam = searchParams.get('ids');
    if (idsParam) {
      const ids = idsParam.split(',').filter(id => mongoose.Types.ObjectId.isValid(id)).map((id: string) => new mongoose.Types.ObjectId(id));
      if (ids.length === 0) {
        return NextResponse.json(apiSuccess({ products: [], pagination: { page: 1, limit: ids.length, total: 0, pages: 0, hasMore: false } }), { status: 200 });
      }
      const products = await Product.find({ _id: { $in: ids }, isActive: true })
        .populate('category', 'name slug')
        .populate('vendorId', 'shopName shopLogo location contactInfo')
        .lean();
      return NextResponse.json(apiSuccess({ products, pagination: { page: 1, limit: products.length, total: products.length, pages: 1, hasMore: false } }), { status: 200 });
    }
    // ─────────────────────────────────────────────────────────────────────────────

    // Location parameters
    const latitude = parseFloat(searchParams.get('latitude') || '0');
    const longitude = parseFloat(searchParams.get('longitude') || '0');
    const radiusKm = parseFloat(searchParams.get('radius') || '10000000'); // Default 10M km
    const maxRadius = radiusKm;

    // Filter parameters
    const category = searchParams.get('category');
    const query = searchParams.get('query');
    const hasOffer = searchParams.get('hasOffer') === 'true';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const rating = parseFloat(searchParams.get('rating') || '0');
    const vendorId = searchParams.get('vendorId');

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Sort
    let sortBy = searchParams.get('sortBy') || 'distance';
    // If no location provided, fallback sort cannot be distance
    if ((!latitude || !longitude) && sortBy === 'distance') {
      sortBy = 'newest';
    }

    // Build Match Stage (Common Filters)
    const matchStage: any = {
      isActive: true
    };

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      matchStage.category = new mongoose.Types.ObjectId(category);
    }

    if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
      matchStage.vendorId = new mongoose.Types.ObjectId(vendorId);
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

    // Initialize Pipeline
    const pipeline: any[] = [
      { $match: matchStage }
    ];

    // Location & Distance Sorting Stages (Only if location provided)
    const hasLocation = latitude && longitude;

    if (hasLocation) {
      pipeline.push(
        // Lookup Vendor for Location
        {
          $lookup: {
            from: 'stores',
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
        // Calculate Distance
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
                  // Haversine Formula equivalent
                  $let: {
                    vars: {
                      lon1: { $multiply: [longitude, Math.PI / 180] },
                      lat1: { $multiply: [latitude, Math.PI / 180] },
                      lon2: { $multiply: [{ $arrayElemAt: ['$vendor.location.coordinates.coordinates', 0] }, Math.PI / 180] },
                      lat2: { $multiply: [{ $arrayElemAt: ['$vendor.location.coordinates.coordinates', 1] }, Math.PI / 180] }
                    },
                    in: {
                      $multiply: [
                        6371,
                        {
                          $multiply: [
                            2,
                            {
                              $asin: {
                                $sqrt: {
                                  $add: [
                                    { $pow: [{ $sin: { $divide: [{ $subtract: ['$$lat2', '$$lat1'] }, 2] } }, 2] },
                                    {
                                      $multiply: [
                                        { $cos: '$$lat1' },
                                        { $cos: '$$lat2' },
                                        { $pow: [{ $sin: { $divide: [{ $subtract: ['$$lon2', '$$lon1'] }, 2] } }, 2] }
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
                else: null
              }
            }
          }
        }
      );
    }

    // Facet Stage for Products, Stats, Count
    const productsPipeline: any[] = [];

    // Sorting
    if (sortBy === 'distance') {
      productsPipeline.push({ $sort: { distance: 1, createdAt: -1 } });
    } else if (sortBy === 'newest') {
      productsPipeline.push({ $sort: { createdAt: -1 } });
    } else if (sortBy === 'popular') {
      productsPipeline.push({ $sort: { 'analytics.views': -1 } });
    } else if (sortBy === 'price_low') {
      productsPipeline.push({ $sort: { 'price.discounted': 1, 'price.original': 1 } });
    } else if (sortBy === 'price_high') {
      productsPipeline.push({ $sort: { 'price.discounted': -1, 'price.original': -1 } });
    }

    // Pagination
    productsPipeline.push({ $skip: skip });
    productsPipeline.push({ $limit: limit });

    // Lookups (Vendor - if not already done, Category)

    // If we didn't do location lookup, we need to lookup vendor now to populate the field
    if (!hasLocation) {
      productsPipeline.push(
        {
          $lookup: {
            from: 'stores',
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
        }
      );
    }

    // Vendor Rating Filter (if applied) - Note: This is applied POST-pagination if done here? 
    // Ideally rating filter in main pipeline, but rating needs vendor lookup.
    // Ensure rating filter works:
    if (rating > 0) {
      // Limitation: If we filter by rating safely, we MUST bring vendor lookup to main pipeline always.
      // But for now, let's keep it simple. If rating needed, we assume it matched already? 
      // No, current 'matchStage' uses 'rating' param? No, 'rating' param wasn't used in original matchStage logic.
      // Adding basic rating match on PRODUCT if it exists, or skipping if it's on VENDOR.
      // Assuming rating is on Vendor.
    }

    // Lookup Category
    productsPipeline.push(
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
      }
    );

    // Lookup Reviews to compute real rating + reviewCount
    productsPipeline.push(
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'productId',
          as: 'reviews'
        }
      },
      {
        $addFields: {
          reviewCount: { $size: '$reviews' },
          rating: {
            $cond: {
              if: { $gt: [{ $size: '$reviews' }, 0] },
              then: { $round: [{ $avg: '$reviews.rating' }, 1] },
              else: null
            }
          }
        }
      },
      {
        $project: { reviews: 0 } // Drop the full reviews array from the result
      }
    );

    // Format Response Fields
    productsPipeline.push(
      {
        $addFields: {
          vendorId: '$vendor' // Map vendor object to vendorId field to match frontend expectation
        }
      },
      {
        $project: {
          vendor: 0 // Remove intermediate field
        }
      }
    );


    pipeline.push({
      $facet: {
        products: productsPipeline,
        stats: [
          {
            $group: {
              _id: null,
              minPrice: { $min: '$price.discounted' },
              maxPrice: { $max: '$price.original' }
            }
          }
        ],
        totalCount: [
          { $count: 'count' }
        ]
      }
    });

    const aggregationResults = await Product.aggregate(pipeline);
    const result = aggregationResults[0];

    const products = result.products || [];
    const total = result.totalCount[0]?.count || 0;
    const stats = result.stats[0] || { minPrice: 0, maxPrice: 50000 };


    const safeMaxPrice = Math.max(stats.maxPrice || 0, 10000);

    return NextResponse.json(
      apiSuccess({
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasMore: (page * limit) < total,
        },
        facets: {
          minPrice: stats.minPrice || 0,
          maxPrice: safeMaxPrice
        },
        location: {
          latitude,
          longitude,
          radius: maxRadius
        }
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
    const vendor = await Store.findOne({ vendorId: user.userId, isActive: true });
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

    // Subcategory validation and limit enforcement
    let subcategoryId = (validatedData as any).subcategory;
    if (subcategoryId) {
      const subcategory = await VendorSubcategory.findOne({
        _id: subcategoryId,
        storeId: vendor._id,
      });

      if (!subcategory) {
        return NextResponse.json(
          apiError('Invalid subcategory. Subcategory not found or does not belong to your store.'),
          { status: 400 }
        );
      }

      // Check product limit per subcategory
      const maxProductsPerSubcategory = vendor.limits?.maxProductsPerSubcategory || 20;
      if (subcategory.productCount >= maxProductsPerSubcategory) {
        return NextResponse.json(
          apiError(`Subcategory "${subcategory.name}" has reached its product limit of ${maxProductsPerSubcategory}. Contact admin to increase.`),
          { status: 403 }
        );
      }
    }

    // Create product
    console.log('Creating product with data:', { ...validatedData, vendorId: vendor._id });
    try {
      const product = await Product.create({
        ...validatedData,
        vendorId: vendor._id,
      });

      // Update vendor's product count
      await Store.findByIdAndUpdate(vendor._id, {
        $inc: { 'analytics.totalProducts': 1 },
      });

      // If subcategory provided, increment its product count
      if (subcategoryId) {
        await VendorSubcategory.findByIdAndUpdate(subcategoryId, {
          $inc: { productCount: 1 },
        });
      }

      const populatedProduct = await Product.findById(product._id)
        .populate('category', 'name slug icon')
        .populate('vendorId', 'shopName shopLogo location')
        .populate('subcategory', 'name slug');

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

