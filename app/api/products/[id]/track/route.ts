import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Vendor from '@/models/Vendor';
import Analytics from '@/models/Analytics';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest } from '@/lib/auth';

// POST - Track analytics (view, contact, call, whatsapp, directions)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const body = await request.json();
    const { type, userLocation } = body;

    // Validate type
    const validTypes = ['view', 'contact', 'call', 'whatsapp', 'directions'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        apiError('Invalid tracking type'),
        { status: 400 }
      );
    }

    // Find product
    const product = await Product.findById(params.id);
    if (!product) {
      return NextResponse.json(
        apiError('Product not found'),
        { status: 404 }
      );
    }

    // Get user if authenticated
    const user = await getUserFromRequest(request);
    const userId = user ? user.userId : undefined;

    // Update product analytics
    if (type === 'view') {
      await Product.findByIdAndUpdate(params.id, {
        $inc: { 'analytics.views': 1 },
      });
    } else if (['contact', 'call', 'whatsapp', 'directions'].includes(type)) {
      await Product.findByIdAndUpdate(params.id, {
        $inc: { 'analytics.contacts': 1 },
      });
    }

    // Update vendor analytics
    if (['contact', 'call', 'whatsapp', 'directions'].includes(type)) {
      await Vendor.findByIdAndUpdate(product.vendorId, {
        $inc: { 'analytics.totalContacts': 1 },
      });
    }

    await Vendor.findByIdAndUpdate(product.vendorId, {
      $inc: { 'analytics.totalViews': 1 },
    });

    // Create analytics record
    const analyticsData: any = {
      vendorId: product.vendorId,
      productId: product._id,
      type,
    };

    if (userId) {
      analyticsData.userId = userId;
    }

    if (userLocation && userLocation.coordinates) {
      analyticsData.userLocation = {
        type: 'Point',
        coordinates: userLocation.coordinates,
      };
    }

    await Analytics.create(analyticsData);

    return NextResponse.json(
      apiSuccess(null, 'Analytics tracked successfully'),
      { status: 200 }
    );
  } catch (error) {
    console.error('Track analytics error:', error);
    return NextResponse.json(
      apiError('Failed to track analytics'),
      { status: 500 }
    );
  }
}

