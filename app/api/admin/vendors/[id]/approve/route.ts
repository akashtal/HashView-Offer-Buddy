import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserFromRequest, hasRole } from '@/lib/auth';

// POST - Approve vendor (Admin only)
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

    const vendor = await Vendor.findByIdAndUpdate(
      params.id,
      { isApproved: true },
      { new: true }
    ).populate('category', 'name slug');

    if (!vendor) {
      return NextResponse.json(
        apiError('Vendor not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      apiSuccess({ vendor }, 'Vendor approved successfully'),
      { status: 200 }
    );
  } catch (error) {
    console.error('Approve vendor error:', error);
    return NextResponse.json(
      apiError('Failed to approve vendor'),
      { status: 500 }
    );
  }
}

