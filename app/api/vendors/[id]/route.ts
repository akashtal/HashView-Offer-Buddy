import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import Product from '@/models/Product';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest } from '@/lib/auth';
import { updateVendorSchema } from '@/lib/validation';

// GET - Get vendor by ID with products
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const vendor = await Vendor.findById(params.id)
      .populate('category', 'name slug icon')
      .populate('userId', 'name email');

    if (!vendor) {
      return NextResponse.json(
        apiError('Vendor not found'),
        { status: 404 }
      );
    }

    // Get vendor's products
    const products = await Product.find({
      vendorId: params.id,
      isActive: true,
    })
      .populate('category', 'name slug icon')
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json(
      apiSuccess({
        vendor: {
          ...vendor.toObject(),
        },
        products,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Get vendor error:', error);
    return NextResponse.json(
      apiError('Failed to fetch vendor'),
      { status: 500 }
    );
  }
}

// PUT - Update vendor profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const user = await getUserFromRequest(request);
    if (!user || (user.role !== 'vendor' && user.role !== 'admin')) {
      return NextResponse.json(
        apiError('Unauthorized'),
        { status: 403 }
      );
    }

    // Verify ownership or check if admin
    let vendor = await Vendor.findOne({
      _id: params.id,
      userId: user.userId,
    });

    // If not found by ownership, check if admin can find it by ID
    if (!vendor) {
      if (user.role === 'admin') {
        vendor = await Vendor.findById(params.id);
      }
    }

    if (!vendor) {
      return NextResponse.json(
        apiError('Vendor not found or you do not have permission'),
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateVendorSchema.parse(body);

    // Update vendor
    const updatedVendor = await Vendor.findByIdAndUpdate(
      params.id,
      { $set: validatedData },
      { new: true, runValidators: true }
    )
      .populate('category', 'name slug icon')
      .populate('userId', 'name email');

    return NextResponse.json(
      apiSuccess({ vendor: updatedVendor }, 'Vendor profile updated successfully'),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update vendor error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        apiError(error.errors[0].message),
        { status: 400 }
      );
    }

    return NextResponse.json(
      apiError('Failed to update vendor profile'),
      { status: 500 }
    );
  }
}

// DELETE - Delete vendor (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const user = await getUserFromRequest(request);
    if (!user || await (user.role !== 'vendor' && user.role !== 'admin')) {
      return NextResponse.json(
        apiError('Unauthorized'),
        { status: 403 }
      );
    }

    // Verify ownership or admin
    let vendor = await Vendor.findOne({
      _id: params.id,
      userId: user.userId,
    });

    // If not found by ownership, check if admin can find it by ID
    if (!vendor) {
      if (user.role === 'admin') {
        vendor = await Vendor.findById(params.id);
      }
    }

    if (!vendor) {
      return NextResponse.json(
        apiError('Vendor not found or you do not have permission'),
        { status: 404 }
      );
    }

    // Soft delete
    await Vendor.findByIdAndUpdate(params.id, {
      isActive: false,
    });

    // Also deactivate all products
    await Product.updateMany(
      { vendorId: params.id },
      { isActive: false }
    );

    return NextResponse.json(
      apiSuccess(null, 'Vendor profile deactivated successfully'),
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete vendor error:', error);
    return NextResponse.json(
      apiError('Failed to deactivate vendor profile'),
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
