import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Store from '@/models/Store';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest } from '@/lib/auth';
import { createProductSchema, updateProductSchema } from '@/lib/validation';

// GET - Get product details
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    await dbConnect();

    // Fetch product without populate first to avoid errors with legacy vendorIds
    const product = await Product.findById(params.id)
      .populate('category', 'name slug');

    if (!product) {
      return NextResponse.json(apiError('Product not found'), { status: 404 });
    }

    // Try to populate vendor info from Store, but don't fail if it doesn't exist
    let vendorInfo = null;
    try {
      const store = await Store.findById(product.vendorId);
      if (store) {
        vendorInfo = {
          _id: store._id,
          shopName: store.shopName,
          shopLogo: store.shopLogo,
          location: store.location,
          contactInfo: store.contactInfo
        };
      }
    } catch (err) {
      // vendorId might point to old User record, just set vendorInfo to null
      console.warn(`Could not fetch vendor for product ${params.id}:`, err);
    }

    return NextResponse.json(
      apiSuccess({
        product: {
          ...product.toObject(),
          vendorId: vendorInfo || product.vendorId
        }
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Product fetch error:', error);
    return NextResponse.json(apiError('Failed to fetch product'), { status: 500 });
  }
}

// DELETE - Delete product (Vendor or Admin)
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
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
      const vendor = await Store.findOne({ vendorId: user.userId });
      if (!vendor || vendor._id.toString() !== product.vendorId.toString()) {
        return NextResponse.json(apiError('You do not have permission to delete this product'), { status: 403 });
      }
    }

    await Product.findByIdAndDelete(params.id);

    // Decrement vendor product count
    await Store.findByIdAndUpdate(product.vendorId, { $inc: { 'analytics.totalProducts': -1 } });

    return NextResponse.json(apiSuccess(null, 'Product deleted successfully'), { status: 200 });
  } catch (error) {
    return NextResponse.json(apiError('Failed to delete product'), { status: 500 });
  }
}

// PUT - Update product (Vendor only)
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
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
    const vendor = await Store.findOne({ vendorId: user.userId });
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
