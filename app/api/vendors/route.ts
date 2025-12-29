import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import User from '@/models/User';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest } from '@/lib/auth';
import { createVendorSchema } from '@/lib/validation';

// GET - Get nearby vendors
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);

    const latitude = parseFloat(searchParams.get('latitude') || '0');
    const longitude = parseFloat(searchParams.get('longitude') || '0');
    const radius = parseFloat(searchParams.get('radius') || '5'); // km
    const category = searchParams.get('category');

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query
    const query: any = {
      isActive: true,
      isApproved: true,
    };

    if (category) {
      query.category = category;
    }

    // Location-based query removed
    // if (latitude && longitude) { ... }

    // No location provided, return all approved vendors
    const vendors = await Vendor.find(query)
      .populate('category', 'name slug icon')
      .skip((page - 1) * limit)
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

