import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import Product from '@/models/Product';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest, hasRole } from '@/lib/auth';

// POST - Block/Unblock vendor (Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const user = await getUserFromRequest(request);
    if (!hasRole(user, ['admin'])) {
      return NextResponse.json(
        apiError('Unauthorized'),
        { status: 403 }
      );
    }

    const body = await request.json();
    const { isActive } = body;

    const vendor = await Vendor.findByIdAndUpdate(
      params.id,
      { isActive },
      { new: true }
    );

    if (!vendor) {
      return NextResponse.json(
        apiError('Vendor not found'),
        { status: 404 }
      );
    }

    // Update all products
    await Product.updateMany(
      { vendorId: params.id },
      { isActive }
    );

    return NextResponse.json(
      apiSuccess(
        { vendor },
        isActive ? 'Vendor activated successfully' : 'Vendor blocked successfully'
      ),
      { status: 200 }
    );
  } catch (error) {
    console.error('Block vendor error:', error);
    return NextResponse.json(
      apiError('Failed to update vendor status'),
      { status: 500 }
    );
  }
}

