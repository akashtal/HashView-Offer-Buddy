import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Vendor from '@/models/Vendor';
import Analytics from '@/models/Analytics';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest } from '@/lib/auth';
import { updateProductSchema } from '@/lib/validation';

// GET - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const product = await Product.findById(params.id)
      .populate('category', 'name slug icon')
      .populate({
        path: 'vendorId',
        select: 'shopName shopDescription shopLogo shopImages location contactInfo businessHours rating totalReviews',
      });

    if (!product) {
      return NextResponse.json(
        apiError('Product not found'),
        { status: 404 }
      );
    }

    // Track view
    await Product.findByIdAndUpdate(params.id, {
      $inc: { 'analytics.views': 1 },
    });

    // Get user location from query params if available
    const { searchParams } = new URL(request.url);
    const userLat = parseFloat(searchParams.get('userLat') || '0');
    const userLon = parseFloat(searchParams.get('userLon') || '0');

    // Calculate distance if user location provided
    let distance = null;
    if (userLat && userLon && product.vendorId && (product.vendorId as any).location) {
      const [vendorLon, vendorLat] = (product.vendorId as any).location.coordinates;
      distance = calculateDistance(userLat, userLon, vendorLat, vendorLon);
    }

    const productData = {
      ...product.toObject(),
      distance,
    };

    return NextResponse.json(
      apiSuccess({ product: productData }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json(
      apiError('Failed to fetch product'),
      { status: 500 }
    );
  }
}

// PUT - Update product (Vendor only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'vendor') {
      return NextResponse.json(
        apiError('Unauthorized'),
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    // Find product and verify ownership
    const product = await Product.findById(params.id);
    if (!product) {
      return NextResponse.json(
        apiError('Product not found'),
        { status: 404 }
      );
    }

    // Verify vendor owns this product
    const vendor = await Vendor.findOne({
      userId: user.userId,
      _id: product.vendorId
    });

    if (!vendor) {
      return NextResponse.json(
        apiError('You do not have permission to update this product'),
        { status: 403 }
      );
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      params.id,
      { $set: validatedData },
      { new: true, runValidators: true }
    )
      .populate('category', 'name slug icon')
      .populate('vendorId', 'shopName shopLogo location');

    return NextResponse.json(
      apiSuccess({ product: updatedProduct }, 'Product updated successfully'),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update product error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        apiError(error.errors[0].message),
        { status: 400 }
      );
    }

    return NextResponse.json(
      apiError('Failed to update product'),
      { status: 500 }
    );
  }
}

// DELETE - Delete product (Vendor only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'vendor') {
      return NextResponse.json(
        apiError('Unauthorized'),
        { status: 403 }
      );
    }

    // Find product and verify ownership
    const product = await Product.findById(params.id);
    if (!product) {
      return NextResponse.json(
        apiError('Product not found'),
        { status: 404 }
      );
    }

    const vendor = await Vendor.findOne({
      userId: user.userId,
      _id: product.vendorId
    });

    if (!vendor) {
      return NextResponse.json(
        apiError('You do not have permission to delete this product'),
        { status: 403 }
      );
    }

    // Delete product
    await Product.findByIdAndDelete(params.id);

    // Update vendor's product count
    await Vendor.findByIdAndUpdate(vendor._id, {
      $inc: { 'analytics.totalProducts': -1 },
    });

    return NextResponse.json(
      apiSuccess(null, 'Product deleted successfully'),
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      apiError('Failed to delete product'),
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

