import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import User from '@/models/User';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest } from '@/lib/auth';
import { createVendorSchema } from '@/lib/validation';

// Enable ISR with 2 hour revalidation
export const revalidate = 7200;

// GET - Get nearby vendors with geospatial filtering
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);

    // Location parameters
    const latitude = parseFloat(searchParams.get('latitude') || '0');
    const longitude = parseFloat(searchParams.get('longitude') || '0');
    const radiusKm = parseFloat(searchParams.get('radius') || '50'); // Default 50km
    const maxRadius = Math.min(radiusKm, 100); // Cap at 100km for performance

    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy') || 'distance'; // distance, rating, newest

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Use geospatial aggregation if location is provided
    if (latitude && longitude) {
      const radiusInMeters = maxRadius * 1000; // Convert km to meters

      // Build aggregation pipeline with $geoNear
      const pipeline: any[] = [
        {
          $geoNear: {
            near: {
              type: 'Point' as const,
              coordinates: [longitude, latitude] as [number, number] // [lng, lat] format for GeoJSON
            },
            distanceField: 'distance',
            maxDistance: radiusInMeters,
            spherical: true,
            distanceMultiplier: 0.001, // Convert meters to km
            query: {
              isActive: true,
              isApproved: true,
              ...(category && { category: require('mongoose').Types.ObjectId(category) })
            }
          }
        }
      ];

      // Add sorting
      if (sortBy === 'rating') {
        pipeline.push({ $sort: { rating: -1, distance: 1 } });
      } else if (sortBy === 'newest') {
        pipeline.push({ $sort: { createdAt: -1 } });
      }
      // distance is default sort from $geoNear

      // Pagination
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      // Populate category
      pipeline.push({
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      });

      pipeline.push({
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true
        }
      });

      const vendors = await Vendor.aggregate(pipeline);

      // Get total count with same filters
      const countPipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point' as const,
              coordinates: [longitude, latitude] as [number, number]
            },
            distanceField: 'distance',
            maxDistance: radiusInMeters,
            spherical: true,
            query: {
              isActive: true,
              isApproved: true,
              ...(category && { category: require('mongoose').Types.ObjectId(category) })
            }
          }
        },
        { $count: 'total' }
      ];

      const countResult = await Vendor.aggregate(countPipeline);
      const total = countResult[0]?.total || 0;

      return NextResponse.json(
        apiSuccess({
          vendors,
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
      const query: any = {
        isActive: true,
        isApproved: true,
      };

      if (category) {
        query.category = category;
      }

      let sortOptions: any = {};
      if (sortBy === 'rating') {
        sortOptions = { rating: -1 };
      } else if (sortBy === 'newest') {
        sortOptions = { createdAt: -1 };
      } else {
        sortOptions = { createdAt: -1 }; // Default to newest
      }

      const vendors = await Vendor.find(query)
        .populate('category', 'name slug icon')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);

      const total = await Vendor.countDocuments(query);

      return NextResponse.json(
        apiSuccess({
          vendors,
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
    console.error('Get vendors error:', error);
    return NextResponse.json(
      apiError('Failed to fetch vendors'),
      { status: 500 }
    );
  }
}

// POST - Create vendor profile
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'vendor') {
      return NextResponse.json(
        apiError('Unauthorized. Only vendors can create shop profiles.'),
        { status: 403 }
      );
    }

    // Check if vendor already exists for this user
    const existingVendor = await Vendor.findOne({ userId: user.userId });
    if (existingVendor) {
      return NextResponse.json(
        apiError('Vendor profile already exists for this user'),
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = createVendorSchema.parse(body);

    // Create vendor with Point type for geospatial queries
    const vendor = await Vendor.create({
      ...validatedData,
      userId: user.userId,
      location: {
        address: validatedData.location.address,
        city: validatedData.location.city,
        state: validatedData.location.state,
        country: validatedData.location.country,
        pincode: validatedData.location.pincode,
        coordinates: {
          type: 'Point',
          coordinates: validatedData.location.coordinates
        }
      },
    });

    // Update user role if needed
    await User.findByIdAndUpdate(user.userId, {
      role: 'vendor',
    });

    const populatedVendor = await Vendor.findById(vendor._id)
      .populate('category', 'name slug icon')
      .populate('userId', 'name email');

    return NextResponse.json(
      apiSuccess(
        { vendor: populatedVendor },
        'Vendor profile created successfully. Awaiting admin approval.'
      ),
      { status: 201 }
    );
  } catch (error: any) {
    // Safer logging to avoid circular reference or inspection errors
    console.error('Create vendor error:', error?.message || error);

    if (error.name === 'ZodError') {
      const message = error.errors?.[0]?.message || 'Validation failed';
      return NextResponse.json(
        apiError(message),
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      return NextResponse.json(
        apiError('Vendor profile already exists'),
        { status: 400 }
      );
    }

    return NextResponse.json(
      apiError('Failed to create vendor profile'),
      { status: 500 }
    );
  }
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
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

