import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Vendor from '@/models/Vendor';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest } from '@/lib/auth';
import { createProductSchema, updateProductSchema } from '@/lib/validation';

// GET - Get product details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const product = await Product.findById(params.id)
      .populate('vendorId', 'shopName shopLogo location contactInfo')
      .populate('category', 'name slug');

    if (!product) {
      return NextResponse.json(apiError('Product not found'), { status: 404 });
    }

    return NextResponse.json(apiSuccess({ product }), { status: 200 });
  } catch (error) {
    return NextResponse.json(apiError('Failed to fetch product'), { status: 500 });
  }
}

// DELETE - Delete product (Vendor or Admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const user = await getUserFromRequest(request);

    if (!user || (user.role !== 'vendor' && user.role !== 'admin')) {
      return NextResponse.json(apiError('Unauthorized'), { status: 403 });
    }

    const product = await Product.findById(params.id);
    if (!product) {
      return NextResponse.json(apiError('Product not found'), { status: 404 });
    }

    // Check permissions
    // Admin can delete anything. Vendor can only delete their own.
    if (user.role !== 'admin') {
      // Find vendor associated with this user
      const vendor = await Vendor.findOne({ userId: user.userId });
      if (!vendor || vendor._id.toString() !== product.vendorId.toString()) {
        return NextResponse.json(apiError('You do not have permission to delete this product'), { status: 403 });
      }
    }

    await Product.findByIdAndDelete(params.id);

    // Decrement vendor product count
    await Vendor.findByIdAndUpdate(product.vendorId, { $inc: { 'analytics.totalProducts': -1 } });

    return NextResponse.json(apiSuccess(null, 'Product deleted successfully'), { status: 200 });
  } catch (error) {
    return NextResponse.json(apiError('Failed to delete product'), { status: 500 });
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

    // Check auth
    if (!user || user.role !== 'vendor') {
      return NextResponse.json(
        apiError('Unauthorized. Only vendors can update products.'),
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = updateProductSchema.parse(body);

    // Get current product
    const product = await Product.findById(params.id);
    if (!product) {
      return NextResponse.json(
        apiError('Product not found'),
        { status: 404 }
      );
    }

    // Check ownership
    const vendor = await Vendor.findOne({ userId: user.userId });
    if (!vendor || vendor._id.toString() !== product.vendorId.toString()) {
      return NextResponse.json(
        apiError('You are not authorized to update this product'),
        { status: 403 }
      );
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      params.id,
      { $set: validatedData },
      { new: true, runValidators: true }
    );

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
